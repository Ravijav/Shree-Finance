import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "AGENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Get loan to find customer
    const loan = await prisma.loan.findUnique({
      where: { id },
      select: { customerId: true, dailyInstallment: true },
    });

    if (!loan) {
      return NextResponse.json({ error: "Loan not found" }, { status: 404 });
    }

    // Get customer's active RD accounts with sufficient balance
    const rdAccounts = await prisma.standaloneRDAccount.findMany({
      where: {
        customerId: loan.customerId,
        status: "ACTIVE",
        totalDeposited: { gte: loan.dailyInstallment },
      },
      select: {
        id: true,
        accountNumber: true,
        totalDeposited: true,
        monthlyDeposit: true,
        planYears: true,
        interestRate: true,
      },
    });

    return NextResponse.json({
      rdAccounts,
      requiredAmount: loan.dailyInstallment,
    });
  } catch (error) {
    console.error("GET /api/agent/loans/[id]/rd-accounts error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}