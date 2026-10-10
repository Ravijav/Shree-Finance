import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const type = searchParams.get("type");
    const source = searchParams.get("source"); // "LOAN" or "RD"

    // Filter by source
    const sourceFilter =
      source === "RD"
        ? { rdAccountId: { not: null } }
        : source === "LOAN"
        ? { loanId: { not: null } }
        : {};

    const transactions = await prisma.transaction.findMany({
      where: {
        ...sourceFilter,
        ...(type && type !== "ALL" ? { type: type as never } : {}),
        ...(from && to
          ? {
              createdAt: {
                gte: new Date(from),
                lte: new Date(to),
              },
            }
          : {}),
      },
      include: {
        customer: {
          include: {
            user: { select: { name: true, phone: true } },
          },
        },
        agent: {
          include: {
            user: { select: { name: true } },
          },
        },
        loan: {
          select: {
            loanCode: true,
            loanType: true,
            principalAmount: true,
          },
        },
        rdAccount: {
          select: {
            accountNumber: true,
            planYears: true,
            interestRate: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const totalDisbursed = transactions
      .filter((t) => t.type === "LOAN_DISBURSED")
      .reduce((sum, t) => sum + t.amount, 0);

    const totalCollected = transactions
      .filter((t) => t.type === "EMI_APPROVED")
      .reduce((sum, t) => sum + t.amount, 0);

    const totalReverted = transactions
      .filter((t) => t.type === "EMI_REVERTED")
      .reduce((sum, t) => sum + t.amount, 0);

    const totalRDDeposited = transactions
      .filter((t) => t.type === "RD_PAYMENT_APPROVED")
      .reduce((sum, t) => sum + t.amount, 0);

    return NextResponse.json({
      transactions,
      summary: {
        totalTransactions: transactions.length,
        totalDisbursed,
        totalCollected,
        totalReverted,
        totalRDDeposited,
        netFlow: totalCollected - totalDisbursed,
      },
    });
  } catch (error) {
    console.error("GET /api/admin/transactions error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}