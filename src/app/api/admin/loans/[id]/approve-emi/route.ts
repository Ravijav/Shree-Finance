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

    if (emiPayment.status !== PaymentStatus.PENDING_APPROVAL) {
      return NextResponse.json(
        { error: "Payment is not pending approval" },
        { status: 400 }
      );
    }

    const newOutstanding =
      emiPayment.loan.outstandingAmount - emiPayment.installmentAmount;

    // Step 1 — Update payment and loan
    await prisma.$transaction(async (tx) => {
      await tx.eMIPayment.update({
        where: { id: emiPaymentId },
        data: {
          status: PaymentStatus.PAID,
          paidDate: new Date(),
          remarks: `Approved by Admin on ${new Date().toLocaleDateString("en-IN")}`,
        },
      });

      await tx.loan.update({
        where: { id: emiPayment.loanId },
        data: {
          outstandingAmount: newOutstanding < 0 ? 0 : newOutstanding,
          paidDays: emiPayment.loan.paidDays + 1,
          principalCollected:
            emiPayment.loan.principalCollected +
            emiPayment.loan.principalPerDay,
          interestCollected:
            emiPayment.loan.interestCollected +
            emiPayment.loan.interestPerDay,
          ...(newOutstanding <= 0
            ? { status: "CLOSED", closedAt: new Date() }
            : {}),
        },
      });
    });

    // Step 2 — Create transaction AFTER db update is committed
    await createTransaction({
      type: TransactionType.EMI_APPROVED,
      status: TransactionStatus.SUCCESS,
      amount: emiPayment.installmentAmount,
      customerId: emiPayment.loan.customerId,
      agentId: emiPayment.loan.agentId,
      loanId: emiPayment.loanId,
      outstandingBefore: emiPayment.loan.outstandingAmount,
      outstandingAfter: newOutstanding < 0 ? 0 : newOutstanding,
      remarks: `Day #${emiPayment.dayNumber} approved by admin`,
    });

    // Step 3 — If loan closed add closing transaction
    if (newOutstanding <= 0) {
      await createTransaction({
        type: TransactionType.LOAN_CLOSED,
        status: TransactionStatus.SUCCESS,
        amount: 0,
        customerId: emiPayment.loan.customerId,
        agentId: emiPayment.loan.agentId,
        loanId: emiPayment.loanId,
        outstandingBefore: emiPayment.loan.outstandingAmount,
        outstandingAfter: 0,
        remarks: `Loan fully repaid and closed after ${emiPayment.loan.paidDays + 1} days`,
      });
    }

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "EMI_APPROVED",
        entity: "EMIPayment",
        entityId: emiPaymentId,
        details: {
          loanId: id,
          amount: emiPayment.installmentAmount,
          dayNumber: emiPayment.dayNumber,
          approvedBy: session.user.name,
        },
      },
    });

    return NextResponse.json({
      message: "Daily collection approved successfully",
    });
  } catch (error) {
    console.error("PATCH /api/admin/loans/[id]/approve-emi error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}