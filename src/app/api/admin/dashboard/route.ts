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
      totalCustomers,
      totalAgents,
      totalLoans,
      activeLoans,
      totalDisbursed,
      totalCollected,
      overdueEMIs,
      pendingApprovals,
      recentLoans,
    ] = await Promise.all([
      prisma.customer.count(),
      prisma.agent.count(),
      prisma.loan.count(),
      prisma.loan.count({ where: { status: "ACTIVE" } }),
      prisma.loan.aggregate({ _sum: { principalAmount: true } }),
      prisma.eMIPayment.aggregate({
        where: { status: "PAID" },
        _sum: { installmentAmount: true },
      }),
      prisma.eMIPayment.count({ where: { status: "OVERDUE" } }),
      prisma.eMIPayment.count({ where: { status: "PENDING_APPROVAL" } }),
      prisma.loan.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          customer: {
            include: {
              user: { select: { name: true } },
            },
          },
          agent: {
            include: {
              user: { select: { name: true } },
            },
          },
        },
      }),
    ]);

    return NextResponse.json({
      totalCustomers,
      totalAgents,
      totalLoans,
      activeLoans,
      totalDisbursed: totalDisbursed._sum.principalAmount ?? 0,
      totalCollected: totalCollected._sum.installmentAmount ?? 0,
      overdueEMIs,
      pendingApprovals,
      recentLoans,
    });
  } catch (error) {
    console.error("GET /api/admin/dashboard error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}