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
    const { action } = await req.json(); // "APPROVE" or "REJECT"

    if (!action || !["APPROVE", "REJECT"].includes(action)) {
      return NextResponse.json(
        { error: "Action must be APPROVE or REJECT" },
        { status: 400 }
      );
    }

    // const deduction = await prisma.rDDeduction.findUnique({
    //   where: { id },
    //   include: {
    //     rdAccount: true,
    //     loan: true,
    //     emiPayment: { include: { loan: true } },
    //   },
    // });
    const deduction = await prisma.rDDeduction.findUnique({
        where: { id },
        include: {
            rdAccount: true,
            loan: true,
            emiPayment: true,  // ← remove the nested loan include
        },
       });

    if (!deduction) {
      return NextResponse.json(
        { error: "Deduction request not found" },
        { status: 404 }
      );
    }

    if (deduction.status !== "PENDING") {
      return NextResponse.json(
        { error: "Deduction request already processed" },
        { status: 400 }
      );
    }

    if (action === "REJECT") {
      await prisma.rDDeduction.update({
        where: { id },
        data: {
          status: "REJECTED",
          approvedByAdminId: session.user.id,
        },
      });

      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: "RD_DEDUCTION_REJECTED",
          entity: "RDDeduction",
          entityId: id,
          details: { rejectedBy: session.user.name },
        },
      });

      return NextResponse.json({
        message: "Deduction request rejected",
      });
    }

    // APPROVE — deduct from RD and mark EMI as paid
    if (deduction.rdAccount.totalDeposited < deduction.amount) {
      return NextResponse.json(
        { error: "Insufficient RD balance to approve deduction" },
        { status: 400 }
      );
    }

    const newOutstanding =
      deduction.loan.outstandingAmount - deduction.amount;

    await prisma.$transaction(async (tx) => {
      // Mark deduction as approved
      await tx.rDDeduction.update({
        where: { id },
        data: {
          status: "APPROVED",
          approvedByAdminId: session.user.id,
        },
      });

      // Mark EMI as paid
      await tx.eMIPayment.update({
        where: { id: deduction.emiPaymentId },
        data: {
          status: PaymentStatus.PAID,
          paidDate: new Date(),
          remarks: `Paid via RD account ${deduction.rdAccount.accountNumber} — Approved by Admin`,
        },
      });

      // Reduce loan outstanding
      await tx.loan.update({
        where: { id: deduction.loanId },
        data: {
          outstandingAmount: newOutstanding < 0 ? 0 : newOutstanding,
          paidDays: deduction.loan.paidDays + 1,
          principalCollected:
            deduction.loan.principalCollected + deduction.loan.principalPerDay,
          interestCollected:
            deduction.loan.interestCollected + deduction.loan.interestPerDay,
          ...(newOutstanding <= 0
            ? { status: "CLOSED", closedAt: new Date() }
            : {}),
        },
      });

      // Deduct from RD account balance
      await tx.standaloneRDAccount.update({
        where: { id: deduction.rdAccountId },
        data: {
          totalDeposited: deduction.rdAccount.totalDeposited - deduction.amount,
        },
      });
    });

    // Create transaction records after commit
    await createTransaction({
    type: TransactionType.EMI_APPROVED,
    status: TransactionStatus.SUCCESS,
    amount: deduction.amount,
    customerId: deduction.loan.customerId,
    agentId: deduction.loan.agentId,
    loanId: deduction.loanId,
    outstandingBefore: deduction.loan.outstandingAmount,
    outstandingAfter: newOutstanding < 0 ? 0 : newOutstanding,
    remarks: `Day #${deduction.emiPayment.dayNumber} paid via RD deduction from ${deduction.rdAccount.accountNumber}`,
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "RD_DEDUCTION_APPROVED",
        entity: "RDDeduction",
        entityId: id,
        details: {
          rdAccountId: deduction.rdAccountId,
          amount: deduction.amount,
          approvedBy: session.user.name,
        },
      },
    });

    return NextResponse.json({
      message: "RD deduction approved — EMI marked as paid",
    });
  } catch (error) {
    console.error("PATCH /api/admin/rd-deductions/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}