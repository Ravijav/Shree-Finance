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
    if (!session || session.user.role !== "AGENT") {
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

    if (payment.status === PaymentStatus.PAID) {
      return NextResponse.json(
        { error: "Payment already marked as paid" },
        { status: 400 }
      );
    }

    if (payment.status === PaymentStatus.PENDING_APPROVAL) {
      return NextResponse.json(
        { error: "Payment already submitted for approval" },
        { status: 400 }
      );
    }
    await createTransaction({
      type: TransactionType.RD_PAYMENT_SUBMITTED,
      status: TransactionStatus.PENDING,
      amount: payment.amount,
      customerId: payment.rdAccount.customerId,
      agentId: payment.rdAccount.agentId,
      rdAccountId: payment.rdAccountId,
      remarks: `Month #${payment.monthNumber} submitted for approval`,
    });

    // Submit for approval
    await prisma.rDPayment.update({
      where: { id: paymentId },
      data: {
        status: PaymentStatus.PENDING_APPROVAL,
        paidByAgentId: session.user.id,
        remarks: `Submitted for approval by agent on ${new Date().toLocaleDateString("en-IN")}`,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "RD_PAYMENT_SUBMITTED",
        entity: "RDPayment",
        entityId: paymentId,
        details: {
          rdAccountId: id,
          amount: payment.amount,
          monthNumber: payment.monthNumber,
        },
      },
    });

    return NextResponse.json({
      message: "Payment submitted for admin approval",
    });
  } catch (error) {
    console.error("PATCH /api/agent/rd-accounts/[id]/payment error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}