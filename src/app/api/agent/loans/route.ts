import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { generateLoanCode } from "@/lib/utils";
import { createTransaction } from "@/lib/transaction";
import { TransactionType } from "@prisma/client";

export async function GET() {
  try {
    const session = await auth();
    if (!session || session.user.role !== "AGENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const agent = await prisma.agent.findUnique({
      where: { userId: session.user.id },
    });

    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    const loans = await prisma.loan.findMany({
      where: { agentId: agent.id },
      include: {
        customer: {
          include: {
            user: { select: { name: true, phone: true } },
          },
        },
        emiPayments: {
          orderBy: { dayNumber: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(loans);
  } catch (error) {
    console.error("GET /api/agent/loans error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "AGENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const agent = await prisma.agent.findUnique({
      where: { userId: session.user.id },
    });

    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    const body = await req.json();
    const {
      customerId,
      loanType,
      principalAmount,
      interestRate,
      tenureDays,
    } = body;

    if (!customerId || !loanType || !principalAmount || !interestRate || !tenureDays) {
      return NextResponse.json(
        { error: "All loan fields are required" },
        { status: 400 }
      );
    }

    const customer = await prisma.customer.findFirst({
      where: { id: customerId, agentId: agent.id },
    });

    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    // Flat rate calculator
    const flatRatePercentage = Number(interestRate) * 4 + 100;
    const totalAmount = Number(principalAmount) * (flatRatePercentage / 100);
    const interest = totalAmount - Number(principalAmount);
    const dailyInstallment = totalAmount / Number(tenureDays);
    const principalPerDay = Number(principalAmount) / Number(tenureDays);
    const interestPerDay = interest / Number(tenureDays);
    const loanCode = generateLoanCode();

    // Step 1 — Create loan and schedule
    const loan = await prisma.$transaction(async (tx) => {
      const newLoan = await tx.loan.create({
        data: {
          loanCode,
          customerId,
          agentId: agent.id,
          loanType,
          principalAmount: Number(principalAmount),
          interestRate: Number(interestRate),
          interestAmount: Math.round(interest),
          tenureDays: Number(tenureDays),
          totalDays: Number(tenureDays),
          dailyInstallment: Math.round(dailyInstallment * 100) / 100,
          totalAmount: Math.round(totalAmount),
          outstandingAmount: Math.round(totalAmount),
          principalPerDay: Math.round(principalPerDay * 100) / 100,
          interestPerDay: Math.round(interestPerDay * 100) / 100,
          principalCollected: 0,
          interestCollected: 0,
          paidDays: 0,
          status: "ACTIVE",
          disbursedAt: new Date(),
        },
      });

      const dailySchedule = Array.from(
        { length: Number(tenureDays) },
        (_, i) => {
          const dueDate = new Date();
          dueDate.setDate(dueDate.getDate() + i + 1);
          return {
            loanId: newLoan.id,
            dayNumber: i + 1,
            dueDate,
            installmentAmount: Math.round(dailyInstallment * 100) / 100,
            status: "PENDING" as const,
          };
        }
      );

      await tx.eMIPayment.createMany({ data: dailySchedule });

      return newLoan;
    });

    // Step 2 — Create transaction AFTER loan is committed
    await createTransaction({
      type: TransactionType.LOAN_DISBURSED,
      amount: Number(principalAmount),
      customerId,
      agentId: agent.id,
      loanId: loan.id,
      outstandingBefore: 0,
      outstandingAfter: Math.round(totalAmount),
      remarks: `Loan ${loanCode} disbursed — ${tenureDays} days at ${interestRate}% Daily: ₹${Math.round(dailyInstallment * 100) / 100}`,
    });

    // Step 3 — Audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "LOAN_CREATED",
        entity: "Loan",
        entityId: loan.id,
        details: { loanCode, principalAmount, customerId, tenureDays },
      },
    });

    return NextResponse.json(
      { message: "Loan created successfully", loanCode },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/agent/loans error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}