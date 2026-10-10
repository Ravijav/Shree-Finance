import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        user: { select: { name: true, phone: true } },
        agent: { include: { user: { select: { name: true } } } },
        rdAccounts: {
          include: {
            payments: {
              where: { status: "PAID" },
              orderBy: { paidDate: "asc" },
            },
            deductions: {
              where: { status: "APPROVED" },
              include: {
                loan: { select: { loanCode: true } },
                emiPayment: {
                  select: { dayNumber: true, installmentAmount: true, paidDate: true },
                },
              },
            },
          },
        },
      },
    });

    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    // Build passbook per RD account
    const rdPassbooks = customer.rdAccounts.map((rdAccount) => {
      let runningBalance = 0;

      // Regular monthly payments
      const regularEntries = rdAccount.payments.map((payment) => ({
        id: payment.id,
        paymentDate: payment.paidDate,
        particulars: "Monthly Deposit",
        monthNumber: payment.monthNumber,
        debit: 0,
        credit: payment.amount,
        type: "DEPOSIT",
      }));

      // RD deduction entries (money deducted for loan EMI)
      const deductionEntries = rdAccount.deductions.map((deduction) => ({
        id: deduction.id,
        paymentDate: deduction.emiPayment.paidDate,
        particulars: `EMI Deduction — Loan ${deduction.loan.loanCode} Day #${deduction.emiPayment.dayNumber}`,
        monthNumber: null,
        debit: deduction.amount,
        credit: 0,
        type: "DEDUCTION",
      }));

      // Merge and sort by date
      const allEntries = [...regularEntries, ...deductionEntries]
        .sort(
          (a, b) =>
            new Date(a.paymentDate!).getTime() -
            new Date(b.paymentDate!).getTime()
        )
        .map((entry) => {
          runningBalance += entry.credit - entry.debit;
          return { ...entry, balanceAmount: runningBalance };
        });

      return {
        accountNumber: rdAccount.accountNumber,
        planYears: rdAccount.planYears,
        interestRate: rdAccount.interestRate,
        monthlyDeposit: rdAccount.monthlyDeposit,
        totalDeposited: rdAccount.totalDeposited,
        maturityAmount: rdAccount.maturityAmount,
        interestAmount: rdAccount.interestAmount,
        openedAt: rdAccount.openedAt,
        maturityDate: rdAccount.maturityDate,
        status: rdAccount.status,
        entries: allEntries,
      };
    });

    return NextResponse.json({
      customer: {
        customerCode: customer.customerCode,
        name: customer.user.name,
        phone: customer.user.phone,
        agentName: customer.agent.user.name,
      },
      rdPassbooks,
    });
  } catch (error) {
    console.error("GET /api/admin/customers/[id]/rd-passbook error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}