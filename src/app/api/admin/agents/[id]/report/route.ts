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

    const agent = await prisma.agent.findUnique({
      where: { id },
      include: {
        user: { select: { name: true, email: true, phone: true } },
      },
    });

    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    const customers = await prisma.customer.findMany({
      where: { agentId: id },
      include: {
        user: {
          select: { name: true, phone: true, email: true, createdAt: true },
        },
        loans: {
          include: {
            emiPayments: {
              select: {
                status: true,
                installmentAmount: true,  // ← changed from emiAmount
                dueDate: true,
                paidDate: true,
              },
            },
            // rdAccount: {
            //   select: {
            //     accountNumber: true,
            //     monthlyDeposit: true,
            //     totalDeposited: true,
            //   },
            // },
            
          },
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ agent, customers });
  } catch (error) {
    console.error("GET /api/admin/agents/[id]/report error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}