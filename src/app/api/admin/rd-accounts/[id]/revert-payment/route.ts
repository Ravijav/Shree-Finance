import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { PaymentStatus } from "@prisma/client";
import { createTransaction } from "@/lib/transaction";
import { TransactionType, TransactionStatus } from "@prisma/client";

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
    const { paymentId, reason } = await req.json();

    if (!paymentId || !reason) {
      return NextResponse.json(
        { error: "Payment ID and reason are required" },
        { status: 400 }
      );
    }

    const payment = await prisma.rDPayment.findUnique({
      where: { id: paymentId },
      include: { rdAccount: true },
    });

    if (!payment) {
      return NextResponse.json(
        { error: "Payment not found" },
        { status: 404 }
      );
    }

    if (payment.status !== PaymentStatus.PAID) {
      return NextResponse.json(
        { error: "Payment is not marked as paid" },
        { status: 400 }
      );
    }

    await prisma.$transaction(async (tx) => {
      // Revert payment
      await tx.rDPayment.update({
        where: { id: paymentId },
        data: {
          status: PaymentStatus.PENDING,
          paidDate: null,
          paidByAgentId: null,
          remarks: `Reverted by Admin: ${reason}`,
        },
      });

      // Restore RD account totals
      const newTotal =
        payment.rdAccount.totalDeposited - payment.amount;
      const newPaidMonths =
        payment.rdAccount.paidMonths > 0
          ? payment.rdAccount.paidMonths - 1
          : 0;

      await tx.standaloneRDAccount.update({
        where: { id: payment.rdAccountId },
        data: {
          totalDeposited: newTotal < 0 ? 0 : newTotal,
          paidMonths: newPaidMonths,
          // Reopen if it was matured
          ...(payment.rdAccount.status === "MATURED"
            ? { status: "ACTIVE" }
            : {}),
        },
      });
      await createTransaction(
      {
        type: TransactionType.RD_PAYMENT_REVERTED,
        status: TransactionStatus.REVERTED,
        amount: payment.amount,
        customerId: payment.rdAccount.customerId,
        agentId: payment.rdAccount.agentId,
        rdAccountId: payment.rdAccountId,
        outstandingBefore: payment.rdAccount.totalDeposited,
        outstandingAfter: payment.rdAccount.totalDeposited - payment.amount,
        remarks: `Month #${payment.monthNumber} reverted — Reason: ${reason}`,
      },
      tx
    );
    });
    

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "RD_PAYMENT_REVERTED",
        entity: "RDPayment",
        entityId: paymentId,
        details: {
          rdAccountId: id,
          amount: payment.amount,
          monthNumber: payment.monthNumber,
          reason,
          revertedBy: session.user.name,
        },
      },
    });

    return NextResponse.json({
      message: "RD payment reverted successfully",
    });
  } catch (error) {
    console.error("PATCH /api/admin/rd-accounts/[id]/revert-payment error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}