import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [
      totalLoans,
      activeLoans,
      closedLoans,
      defaultedLoans,
      loanAmounts,
      collectedAmount,
      overdueEMIs,
      pendingEMIs,
      pendingApprovals,
      loansByType,
      agentPerformance,
      monthlyDisbursement,
      loanBreakdown,
    ] = await Promise.all([
      prisma.loan.count(),
      prisma.loan.count({ where: { status: "ACTIVE" } }),
      prisma.loan.count({ where: { status: "CLOSED" } }),
      prisma.loan.count({ where: { status: "DEFAULTED" } }),
      prisma.loan.aggregate({
        _sum: {
          principalAmount: true,
          totalAmount: true,
          outstandingAmount: true,
        },
      }),
      prisma.eMIPayment.aggregate({
        where: { status: "PAID" },
        _sum: { installmentAmount: true },   // ← changed from emiAmount
      }),
      prisma.eMIPayment.count({ where: { status: "OVERDUE" } }),
      prisma.eMIPayment.count({ where: { status: "PENDING" } }),
      prisma.eMIPayment.count({ where: { status: "PENDING_APPROVAL" } }),
      prisma.loan.groupBy({
        by: ["loanType"],
        _count: { id: true },
        _sum: { principalAmount: true },
      }),
      prisma.agent.findMany({
        include: {
          user: { select: { name: true } },
          _count: {
            select: { customers: true, loans: true },
          },
          loans: {
            select: {
              principalAmount: true,
              status: true,
            },
          },
        },
      }),
      prisma.$queryRaw<{ month: string; total: number }[]>`
        SELECT
          TO_CHAR(DATE_TRUNC('month', "createdAt"), 'Mon YYYY') as month,
          SUM("principalAmount") as total
        FROM loans
        WHERE "createdAt" >= NOW() - INTERVAL '6 months'
        GROUP BY DATE_TRUNC('month', "createdAt")
        ORDER BY DATE_TRUNC('month', "createdAt") ASC
      `,
      prisma.loan.aggregate({
        _sum: {
          // principalAmount: true,
          // interestAmount: true,
          // collectedAmount: true,
          // outstandingAmount: true,
           principalAmount: true,
          interestAmount: true,
          principalCollected: true,
          interestCollected: true,
          outstandingAmount: true,
        },
      }),
    ]);

    const totalDisbursed = loanAmounts._sum.principalAmount ?? 0;
    const totalToCollect = loanAmounts._sum.totalAmount ?? 0;
    const totalOutstanding = loanAmounts._sum.outstandingAmount ?? 0;
    const totalCollected = collectedAmount._sum.installmentAmount ?? 0;  // ← changed
    const totalProfit = totalCollected - totalDisbursed;

    // const totalPrincipal = loanBreakdown._sum.principalAmount ?? 0;
    // const totalInterest = loanBreakdown._sum.interestAmount ?? 0;
    // const totalCollectedAmount = loanBreakdown._sum.collectedAmount ?? 0;
    // const totalOutstandingAmount = loanBreakdown._sum.outstandingAmount ?? 0;
    
    const totalPrincipal = loanBreakdown._sum.principalAmount ?? 0;
    const totalInterest = loanBreakdown._sum.interestAmount ?? 0;
    // const totalCollectedAmount = loanBreakdown._sum.collectedAmount ?? 0;
    const totalOutstandingAmount = loanBreakdown._sum.outstandingAmount ?? 0;

    // Interest collected = totalCollected * (interestAmount/totalAmount) per loan
    // Simpler: use ratio
    // const interestRatio = totalInterest / (totalPrincipal + totalInterest);
    // const interestCollected = Math.round(totalCollectedAmount * interestRatio * 100) / 100;
    // const principalCollected = Math.round((totalCollectedAmount - interestCollected) * 100) / 100;

    // const interestRatio = totalInterest / (totalPrincipal + totalInterest);
    const interestCollected =loanBreakdown._sum.interestCollected ?? 0;
    const principalCollected =loanBreakdown._sum.principalCollected ?? 0;
    const totalCollectedAmount = interestCollected+principalCollected;

    return NextResponse.json({
      summary: {
        totalLoans,
        activeLoans,
        closedLoans,
        defaultedLoans,
        totalDisbursed,
        totalToCollect,
        totalOutstanding,
        totalCollected,
        totalProfit,
        overdueEMIs,
        pendingEMIs,
        pendingApprovals,
        totalPrincipalDisbursed: totalPrincipal,
        totalInterestExpected: totalInterest,
        totalCollectedAmount,
        interestCollected,
        principalCollected,
        totalOutstandingAmount,
      },
      loansByType,
      agentPerformance,
      monthlyDisbursement,
    });
  } catch (error) {
    console.error("GET /api/admin/reports error:", error);
    return NextResponse.json({
      error: "Internal server error",
    }, { status: 500 });
  }
}