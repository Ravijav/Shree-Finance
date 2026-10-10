import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const deductions = await prisma.rDDeduction.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        rdAccount: {
          select: {
            accountNumber: true,
            totalDeposited: true,
          },
        },
        loan: {
          select: {
            loanCode: true,
            dailyInstallment: true,
          },
        },
        emiPayment: {
          select: {
            dayNumber: true,
            dueDate: true,
            installmentAmount: true,
          },
        },
      },
    });

    // Include customer and agent via loan
    const deductionsWithDetails = await Promise.all(
      deductions.map(async (d) => {
        const loan = await prisma.loan.findUnique({
          where: { id: d.loanId },
          include: {
            customer: { include: { user: { select: { name: true, phone: true } } } },
            agent: { include: { user: { select: { name: true } } } },
          },
        });
        return { ...d, customer: loan?.customer, agent: loan?.agent };
      })
    );

    return NextResponse.json(deductionsWithDetails);
  } catch (error) {
    console.error("GET /api/admin/rd-deductions error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}