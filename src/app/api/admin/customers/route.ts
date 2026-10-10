// import { prisma } from "@/lib/prisma";
// import { auth } from "@/lib/auth";
// import { NextResponse } from "next/server";

// // GET - Fetch all customers
// export async function GET(req: Request) {
//   try {
//     const session = await auth();
//     if (!session || session.user.role !== "ADMIN") {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     const { searchParams } = new URL(req.url);
//     const from = searchParams.get("from");
//     const to = searchParams.get("to");

//     // const customers = await prisma.customer.findMany({
//     //   where: {
//     //     ...(from && to
//     //       ? {
//     //           createdAt: {
//     //             gte: new Date(from),
//     //             lte: new Date(to),
//     //           },
//     //         }
//     //       : {}),
//     //   },
//     //   include: {
//     //     user: {
//     //       select: {
//     //         name: true,
//     //         email: true,
//     //         phone: true,
//     //         isActive: true,
//     //         createdAt: true,
//     //       },
//     //     },
//     //     agent: {
//     //       include: {
//     //         user: {
//     //           select: { name: true },
//     //         },
//     //       },
//     //     },
//     //     loans: {
//     //       select: {
//     //         id: true,
//     //         status: true,
//     //         principalAmount: true,
//     //       },
//     //     },
//     //   },
//     //   orderBy: { createdAt: "desc" },
//     // });
//     const customers = await prisma.customer.findMany({
//   where: {
//     ...(from && to
//       ? {
//           createdAt: {
//             gte: new Date(from),
//             lte: new Date(to),
//           },
//         }
//       : {}),
//   },
//   include: {
//     user: {
//       select: {
//         name: true,
//         email: true,
//         phone: true,
//         isActive: true,
//         createdAt: true,
//       },
//     },
//     agent: {
//       include: {
//         user: {
//           select: { name: true },
//         },
//       },
//     },
//     loans: {
//       select: {
//         id: true,
//         status: true,
//         principalAmount: true,
//       },
//     },
//     rdAccounts: {                          // ← add this
//       select: {
//         id: true,
//         accountNumber: true,
//         status: true,
//         monthlyDeposit: true,
//         totalDeposited: true,
//         maturityAmount: true,
//       },
//     },
//   },
//   orderBy: { createdAt: "desc" },
// });

//     return NextResponse.json(customers);
//   } catch (error) {
//     console.error("GET /api/admin/customers error:", error);
//     return NextResponse.json({ error: "Internal server error" }, { status: 500 });
//   }
// }

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

//     // Get all approved RD deductions for this customer's loans
//     const rdDeductions = await prisma.rDDeduction.findMany({
//       where: {
//         status: "APPROVED",
//         loan: { customerId: id },
//       },
//       include: {
//         rdAccount: { select: { accountNumber: true } },
//       },
//     });

//     // Map emiPaymentId to RD account number for quick lookup
//     const rdDeductionMap = new Map(
//       rdDeductions.map((d) => [
//         d.emiPaymentId,
//         d.rdAccount.accountNumber,
//       ])
//     );

//     let runningBalance = 0;
//     const passbookEntries = customer.loans
//       .flatMap((loan) =>
//         loan.emiPayments.map((payment) => {
//           const rdAccountNumber = rdDeductionMap.get(payment.id);
//           return {
//             id: payment.id,
//             paymentDate: payment.paidDate,
//             particulars: rdAccountNumber
//               ? `Deducted from RD A/C ${rdAccountNumber}`
//               : "By Cash",
//             agentName: customer.agent.user.name,
//             loanCode: loan.loanCode,
//             loanType: loan.loanType,
//             accountNumber: loan.loanCode,
//             dayNumber: payment.dayNumber,
//             debit: 0,
//             credit: payment.installmentAmount,
//             installmentAmount: payment.installmentAmount,
//           };
//         })
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

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const customers = await prisma.customer.findMany({
      where: {
        ...(from && to
          ? {
              createdAt: {
                gte: new Date(from),
                lte: new Date(to),
              },
            }
          : {}),
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
            isActive: true,
            createdAt: true,
          },
        },
        agent: {
          include: {
            user: {
              select: { name: true },
            },
          },
        },
        loans: {
          select: {
            id: true,
            status: true,
            principalAmount: true,
          },
        },
        rdAccounts: {
          select: {
            id: true,
            accountNumber: true,
            status: true,
            monthlyDeposit: true,
            totalDeposited: true,
            maturityAmount: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(customers);
  } catch (error) {
    console.error("GET /api/admin/customers error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}