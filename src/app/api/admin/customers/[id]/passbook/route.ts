// import { prisma } from "@/lib/prisma";
// import { auth } from "@/lib/auth";
// import { NextResponse } from "next/server";

// export async function GET(
//   req: Request,
//   { params }: { params: Promise<{ id: string }> }
// ) {
//   try {
//     const session = await auth();
//     if (!session || session.user.role !== "ADMIN") {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     const { id } = await params;

//     const customer = await prisma.customer.findUnique({
//       where: { id },
//       include: {
//         user: { select: { name: true, phone: true } },
//         agent: {
//           include: { user: { select: { name: true } } },
//         },
//         loans: {
//           include: {
//             emiPayments: {
//               where: { status: "PAID" },
//               orderBy: { paidDate: "asc" },
//             },
//             rdAccount: {
//               select: { accountNumber: true },
//             },
//           },
//         },
//       },
//     });

//     if (!customer) {
//       return NextResponse.json(
//         { error: "Customer not found" },
//         { status: 404 }
//       );
//     }

//     // Flatten all paid payments across all loans with running balance
//     let runningBalance = 0;
//     const passbookEntries = customer.loans
//       .flatMap((loan) =>
//         loan.emiPayments.map((payment) => ({
//           id: payment.id,
//           paymentDate: payment.paidDate,
//           particulars: "By Cash",
//           agentName: customer.agent.user.name,
//           loanCode: loan.loanCode,
//           loanType: loan.loanType,
//           accountNumber: loan.rdAccount?.accountNumber ?? loan.loanCode,
//           dayNumber: payment.dayNumber,               // ← changed from emiNumber
//           debit: 0,
//           credit: payment.installmentAmount,           // ← changed from emiAmount
//           installmentAmount: payment.installmentAmount, // ← changed from emiAmount
//         }))
//       )
//       .sort(
//         (a, b) =>
//           new Date(a.paymentDate!).getTime() -
//           new Date(b.paymentDate!).getTime()
//       )
//       .map((entry) => {
//         runningBalance += entry.credit;
//         return { ...entry, balanceAmount: runningBalance };
//       });

//     return NextResponse.json({
//       customer: {
//         customerCode: customer.customerCode,
//         name: customer.user.name,
//         phone: customer.user.phone,
//         agentName: customer.agent.user.name,
//       },
//       passbookEntries,
//     });
//   } catch (error) {
//     console.error("GET /api/admin/customers/[id]/passbook error:", error);
//     return NextResponse.json(
//       { error: "Internal server error" },
//       { status: 500 }
//     );
//   }
// }
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

    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        user: { select: { name: true, phone: true } },
        agent: {
          include: { user: { select: { name: true } } },
        },
        loans: {
          include: {
            emiPayments: {
              where: { status: "PAID" },
              orderBy: { paidDate: "asc" },
            },
          },
        },
      },
    });

    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    let runningBalance = 0;
    const passbookEntries = customer.loans
      .flatMap((loan) =>
        loan.emiPayments.map((payment) => ({
          id: payment.id,
          paymentDate: payment.paidDate,
          particulars: "By Cash",
          agentName: customer.agent.user.name,
          loanCode: loan.loanCode,
          loanType: loan.loanType,
          accountNumber: loan.loanCode, // ← use loanCode directly
          dayNumber: payment.dayNumber,
          debit: 0,
          credit: payment.installmentAmount,
          installmentAmount: payment.installmentAmount,
        }))
      )
      .sort(
        (a, b) =>
          new Date(a.paymentDate!).getTime() -
          new Date(b.paymentDate!).getTime()
      )
      .map((entry) => {
        runningBalance += entry.credit;
        return { ...entry, balanceAmount: runningBalance };
      });

    return NextResponse.json({
      customer: {
        customerCode: customer.customerCode,
        name: customer.user.name,
        phone: customer.user.phone,
        agentName: customer.agent.user.name,
      },
      passbookEntries,
    });
  } catch (error) {
    console.error("GET /api/admin/customers/[id]/passbook error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}