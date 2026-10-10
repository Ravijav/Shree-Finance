import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { createTransaction } from "@/lib/transaction";
import { TransactionType } from "@prisma/client";
import {
  calculateRDAccount,
  getRDInterestRate,
  generateRDAccountNumber,
} from "@/lib/utils";

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

    const rdAccounts = await prisma.standaloneRDAccount.findMany({
      where: { agentId: agent.id },
      include: {
        customer: {
          include: {
            user: { select: { name: true, phone: true } },
          },
        },
        payments: {
          orderBy: { monthNumber: "asc" },
        },
      },
      orderBy: { openedAt: "desc" },
    });

    return NextResponse.json(rdAccounts);
  } catch (error) {
    console.error("GET /api/agent/rd-accounts error:", error);
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
      planYears,
      monthlyDeposit,
      openingDeposit,
      interestPayableOn,
    } = body;

    if (!customerId || !planYears || !monthlyDeposit) {
      return NextResponse.json(
        { error: "Customer, plan and monthly deposit are required" },
        { status: 400 }
      );
    }

    // Verify customer belongs to this agent
    const customer = await prisma.customer.findFirst({
      where: { id: customerId, agentId: agent.id },
    });

    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    const calc = calculateRDAccount(
      Number(monthlyDeposit),
      Number(planYears)
    );

    const accountNumber = generateRDAccountNumber();
    const openedAt = new Date();
    const maturityDate = new Date(openedAt);
    maturityDate.setFullYear(
      maturityDate.getFullYear() + Number(planYears)
    );

    const rdAccount = await prisma.$transaction(async (tx) => {
      const newRD = await tx.standaloneRDAccount.create({
        data: {
          accountNumber,
          customerId,
          agentId: agent.id,
          planYears: Number(planYears),
          interestRate: getRDInterestRate(Number(planYears)),
          interestPayableOn: "MATURITY",
          monthlyDeposit: Number(monthlyDeposit),
          openingDeposit: Number(openingDeposit ?? 0),
          totalDeposited: Number(openingDeposit ?? 0),
          totalMonths: calc?.totalMonths?? 0,
          paidMonths: 0,
          totalPrincipal: calc?.totalPrincipal?? 0,
          interestAmount: calc?.interestAmount?? 0,
          maturityAmount: calc?.maturityAmount?? 0,
          monthlyInterest: 0,
          quarterlyInterest:0,
          maturityDate,
          status: "ACTIVE",
        },
      });
      
      await createTransaction(
        {
          type: TransactionType.RD_ACCOUNT_OPENED,
          amount: Number(openingDeposit ?? 0),
          customerId,
          agentId: agent.id,
          rdAccountId: newRD.id,
          outstandingBefore: 0,
          outstandingAfter: calc?.maturityAmount??0,
          remarks: `RD Account ${accountNumber} opened — ${planYears} year plan at ${getRDInterestRate(Number(planYears))}% p.a.`,
        },
        tx
      );

      // Generate monthly payment schedule
      const paymentSchedule = Array.from(
        { length: calc?.totalMonths??0 },
        (_, i) => {
          const dueDate = new Date(openedAt);
          dueDate.setMonth(dueDate.getMonth() + i + 1);
          return {
            rdAccountId: newRD.id,
            monthNumber: i + 1,
            dueDate,
            amount: Number(monthlyDeposit),
            status: "PENDING" as const,
          };
        }
      );

      await tx.rDPayment.createMany({ data: paymentSchedule });

      return newRD;
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "RD_ACCOUNT_OPENED",
        entity: "StandaloneRDAccount",
        entityId: rdAccount.id,
        details: {
          accountNumber,
          customerId,
          planYears,
          monthlyDeposit,
          maturityAmount: calc?.maturityAmount?? 0,
        },
      },
    });

    return NextResponse.json(
      { message: "RD Account opened successfully", accountNumber },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/agent/rd-accounts error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}