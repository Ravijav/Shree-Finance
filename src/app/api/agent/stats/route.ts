import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

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

    const [
      totalCustomers,
      activeLoans,
      totalLoans,
      collectedAmount,
      overdueEMIs,
      pendingApprovals,
      recentCustomers,
    ] = await Promise.all([
      prisma.customer.count({ where: { agentId: agent.id } }),
      prisma.loan.count({
        where: { agentId: agent.id, status: "ACTIVE" },
      }),
      prisma.loan.count({ where: { agentId: agent.id } }),
      prisma.eMIPayment.aggregate({
        where: {
          status: "PAID",
          loan: { agentId: agent.id },
        },
        _sum: { installmentAmount: true },  // ← changed from emiAmount
      }),
      prisma.eMIPayment.count({
        where: {
          status: "OVERDUE",
          loan: { agentId: agent.id },
        },
      }),
      prisma.eMIPayment.count({              // ← added
        where: {
          status: "PENDING_APPROVAL",
          loan: { agentId: agent.id },
        },
      }),
      prisma.customer.findMany({
        where: { agentId: agent.id },
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: { name: true, phone: true },
          },
          loans: {
            select: { status: true, principalAmount: true },
          },
        },
      }),
    ]);

    return NextResponse.json({
      totalCustomers,
      activeLoans,
      totalLoans,
      totalCollected: collectedAmount._sum.installmentAmount ?? 0,  // ← changed
      overdueEMIs,
      pendingApprovals,                      // ← added
      recentCustomers,
    });
  } catch (error) {
    console.error("GET /api/agent/stats error:", error);
    return NextResponse.json({
      error: "Internal server error",
    }, { status: 500 });
  }
}