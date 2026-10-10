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
    const { paymentId } = await req.json();

    if (!paymentId) {
      return NextResponse.json(
        { error: "Payment ID is required" },
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

    if (payment.status !== PaymentStatus.PENDING_APPROVAL) {
      return NextResponse.json(
        { error: "Payment is not pending approval" },
        { status: 400 }
      );
    }

    await prisma.$transaction(async (tx) => {
      // Mark payment as paid
      await tx.rDPayment.update({
        where: { id: paymentId },
        data: {
          status: PaymentStatus.PAID,
          paidDate: new Date(),
          remarks: `Approved by Admin on ${new Date().toLocaleDateString("en-IN")}`,
        },
      });

      // Update RD account totals
      await tx.standaloneRDAccount.update({
        where: { id: payment.rdAccountId },
        data: {
          totalDeposited: payment.rdAccount.totalDeposited + payment.amount,
          paidMonths: payment.rdAccount.paidMonths + 1,
          // Check if all months are paid — mark as matured
          ...(payment.rdAccount.paidMonths + 1 >= payment.rdAccount.totalMonths
            ? { status: "MATURED" }
            : {}),
        },
      });

      await createTransaction(
      {
        type: TransactionType.RD_PAYMENT_APPROVED,
        status: TransactionStatus.SUCCESS,
        amount: payment.amount,
        customerId: payment.rdAccount.customerId,
        agentId: payment.rdAccount.agentId,
        rdAccountId: payment.rdAccountId,
        outstandingBefore: payment.rdAccount.totalDeposited,
        outstandingAfter: payment.rdAccount.totalDeposited + payment.amount,
        remarks: `Month #${payment.monthNumber} approved by admin`,
      },
      tx
    );

    // If matured add:
    if (payment.rdAccount.paidMonths + 1 >= payment.rdAccount.totalMonths) {
      await createTransaction(
        {
          type: TransactionType.RD_MATURED,
          status: TransactionStatus.SUCCESS,
          amount: payment.rdAccount.maturityAmount,
          customerId: payment.rdAccount.customerId,
          agentId: payment.rdAccount.agentId,
          rdAccountId: payment.rdAccountId,
          outstandingBefore: payment.rdAccount.totalDeposited + payment.amount,
          outstandingAfter: payment.rdAccount.maturityAmount,
          remarks: `RD Account matured — Maturity amount: ₹${payment.rdAccount.maturityAmount}`,
        },
        tx
      );
    }

    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "RD_PAYMENT_APPROVED",
        entity: "RDPayment",
        entityId: paymentId,
        details: {
          rdAccountId: id,
          amount: payment.amount,
          monthNumber: payment.monthNumber,
          approvedBy: session.user.name,
        },
      },
    });

    return NextResponse.json({
      message: "RD payment approved successfully",
    });
  } catch (error) {
    console.error("PATCH /api/admin/rd-accounts/[id]/approve-payment error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}