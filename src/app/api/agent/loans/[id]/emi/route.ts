import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { PaymentStatus, TransactionType } from "@prisma/client";
import { createTransaction } from "@/lib/transaction";

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
    const { emiPaymentId } = await req.json();

    if (!emiPaymentId) {
      return NextResponse.json(
        { error: "EMI payment ID is required" },
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

    if (emiPayment.status === PaymentStatus.PAID) {
      return NextResponse.json(
        { error: "Daily collection already marked as paid" },
        { status: 400 }
      );
    }

    if (emiPayment.status === PaymentStatus.PENDING_APPROVAL) {
      return NextResponse.json(
        { error: "Already submitted for approval" },
        { status: 400 }
      );
    }

    // Mark as PENDING_APPROVAL + create transaction record
    await prisma.$transaction(async (tx) => {
      await tx.eMIPayment.update({
        where: { id: emiPaymentId },
        data: {
          status: PaymentStatus.PENDING_APPROVAL,
          paidByAgentId: session.user.id,
          remarks: `Submitted for approval by agent on ${new Date().toLocaleDateString("en-IN")}`,
        },
      });

      // Create transaction record as PENDING
      await createTransaction(
        {
          type: TransactionType.EMI_SUBMITTED,
          status: "PENDING" as never,
          amount: emiPayment.installmentAmount,
          customerId: emiPayment.loan.customerId,
          agentId: emiPayment.loan.agentId,
          loanId: emiPayment.loanId,
          emiPaymentId: emiPaymentId,
          outstandingBefore: emiPayment.loan.outstandingAmount,
          outstandingAfter: emiPayment.loan.outstandingAmount,
          remarks: `Day #${emiPayment.dayNumber} collection submitted for approval`,
        },
        tx
      );
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "EMI_SUBMITTED_FOR_APPROVAL",
        entity: "EMIPayment",
        entityId: emiPaymentId,
        details: {
          loanId: id,
          amount: emiPayment.installmentAmount,
          dayNumber: emiPayment.dayNumber,
        },
      },
    });

    return NextResponse.json({
      message: "Daily collection submitted for admin approval",
    });
  } catch (error) {
    console.error("PATCH /api/agent/loans/[id]/emi error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}