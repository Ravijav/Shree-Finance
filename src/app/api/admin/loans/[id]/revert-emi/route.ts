import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { PaymentStatus, TransactionType, TransactionStatus } from "@prisma/client";
import { createTransaction } from "@/lib/transaction";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { emiPaymentId, reason } = await req.json();

    if (!emiPaymentId || !reason) {
      return NextResponse.json(
        { error: "EMI payment ID and reason are required" },
        { status: 400 }
      );
    }

    const emiPayment = await prisma.eMIPayment.findUnique({
      where: { id: emiPaymentId },
      include: { loan: true },
    });

    if (!emiPayment) {
      return NextResponse.json(
        { error: "EMI payment not found" },
        { status: 404 }
      );
    }

    if (emiPayment.status !== PaymentStatus.PAID) {
      return NextResponse.json(
        { error: "This payment is not marked as paid" },
        { status: 400 }
      );
    }

    const restoredOutstanding =
      emiPayment.loan.outstandingAmount + emiPayment.installmentAmount;

    // Step 1 — Revert payment and loan
    await prisma.$transaction(async (tx) => {
      await tx.eMIPayment.update({
        where: { id: emiPaymentId },
        data: {
          status: PaymentStatus.PENDING,
          paidDate: null,
          paidByAgentId: null,
          remarks: `Reverted by Admin: ${reason}`,
        },
      });

      await tx.loan.update({
        where: { id: emiPayment.loanId },
        data: {
          outstandingAmount: restoredOutstanding,
          paidDays:
            emiPayment.loan.paidDays > 0
              ? emiPayment.loan.paidDays - 1
              : 0,
          principalCollected: Math.max(
            0,
            emiPayment.loan.principalCollected -
              emiPayment.loan.principalPerDay
          ),
          interestCollected: Math.max(
            0,
            emiPayment.loan.interestCollected -
              emiPayment.loan.interestPerDay
          ),
          ...(emiPayment.loan.status === "CLOSED"
            ? { status: "ACTIVE", closedAt: null }
            : {}),
        },
      });
    });

    // Step 2 — Create transaction AFTER committed
    await createTransaction({
      type: TransactionType.EMI_REVERTED,
      status: TransactionStatus.REVERTED,
      amount: emiPayment.installmentAmount,
      customerId: emiPayment.loan.customerId,
      agentId: emiPayment.loan.agentId,
      loanId: emiPayment.loanId,
      outstandingBefore: emiPayment.loan.outstandingAmount,
      outstandingAfter: restoredOutstanding,
      remarks: `Day #${emiPayment.dayNumber} reverted — Reason: ${reason}`,
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "EMI_REVERTED",
        entity: "EMIPayment",
        entityId: emiPaymentId,
        details: {
          loanId: id,
          amount: emiPayment.installmentAmount,
          dayNumber: emiPayment.dayNumber,
          reason,
          revertedBy: session.user.name,
        },
      },
    });

    return NextResponse.json({
      message: "Daily collection reverted successfully",
    });
  } catch (error) {
    console.error("PATCH /api/admin/loans/[id]/revert-emi error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}