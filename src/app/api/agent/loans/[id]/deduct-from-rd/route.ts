import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { PaymentStatus } from "@prisma/client";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "AGENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { emiPaymentId, rdAccountId, reason } = await req.json();

    if (!emiPaymentId || !rdAccountId || !reason) {
      return NextResponse.json(
        { error: "EMI payment ID, RD account and reason are required" },
        { status: 400 }
      );
    }

    // Verify EMI payment exists and belongs to this loan
    const emiPayment = await prisma.eMIPayment.findUnique({
      where: { id: emiPaymentId },
      include: { loan: true },
    });

    if (!emiPayment || emiPayment.loanId !== id) {
      return NextResponse.json(
        { error: "EMI payment not found" },
        { status: 404 }
      );
    }

    if (
      emiPayment.status === PaymentStatus.PAID ||
      emiPayment.status === PaymentStatus.PENDING_APPROVAL
    ) {
      return NextResponse.json(
        { error: "EMI is already paid or pending approval" },
        { status: 400 }
      );
    }

    // Verify RD account belongs to same customer and has enough balance
    const rdAccount = await prisma.standaloneRDAccount.findUnique({
      where: { id: rdAccountId },
    });

    if (!rdAccount || rdAccount.customerId !== emiPayment.loan.customerId) {
      return NextResponse.json(
        { error: "RD account not found" },
        { status: 404 }
      );
    }

    if (rdAccount.totalDeposited < emiPayment.installmentAmount) {
      return NextResponse.json(
        {
          error: `Insufficient RD balance. Available: ₹${rdAccount.totalDeposited}, Required: ₹${emiPayment.installmentAmount}`,
        },
        { status: 400 }
      );
    }

    // Check if deduction already requested for this EMI
    const existingDeduction = await prisma.rDDeduction.findFirst({
      where: {
        emiPaymentId,
        status: "PENDING",
      },
    });

    if (existingDeduction) {
      return NextResponse.json(
        { error: "Deduction already requested for this EMI" },
        { status: 400 }
      );
    }

    // Create deduction request
    // const deduction = await prisma.rDDeduction.create({
    //   data: {
    //     rdAccountId,
    //     loanId: id,
    //     emiPaymentId,
    //     amount: emiPayment.installmentAmount,
    //     status: "PENDING",
    //     requestedByAgentId: session.user.id,
    //     reason,
    //   },
    // });

    const [deduction, updatedEmi] = await prisma.$transaction([
      // 1. Create deduction request
      prisma.rDDeduction.create({
        data: {
          rdAccountId,
          loanId: id,
          emiPaymentId,
          amount: emiPayment.installmentAmount,
          status: "PENDING",
          requestedByAgentId: session.user.id,
          reason,
        },
      }),
      // 2. Update the EMI payment status to PENDING_APPROVAL
      prisma.eMIPayment.update({
        where: { id: emiPaymentId },
        data: { status: PaymentStatus.PENDING_APPROVAL },
      }),
    ]);

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "RD_DEDUCTION_REQUESTED",
        entity: "RDDeduction",
        entityId: deduction.id,
        details: {
          loanId: id,
          rdAccountId,
          amount: emiPayment.installmentAmount,
          emiPaymentId,
        },
      },
    });

    return NextResponse.json({
      message: "RD deduction request submitted for admin approval",
    });
  } catch (error) {
    console.error("POST /api/agent/loans/[id]/deduct-from-rd error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}