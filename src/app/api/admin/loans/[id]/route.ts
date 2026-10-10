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

//     const loan = await prisma.loan.findUnique({
//       where: { id },
//       include: {
//         customer: {
//           include: {
//             user: { select: { name: true, phone: true } },
//           },
//         },
//         agent: {
//           include: {
//             user: { select: { name: true } },
//           },
//         },
//         emiPayments: {
//           orderBy: { emiNumber: "asc" },
//         },
//         rdAccount: true,
//       },
//     });

//     if (!loan) {
//       return NextResponse.json({ error: "Loan not found" }, { status: 404 });
//     }

//     return NextResponse.json(loan);
//   } catch (error) {
//     console.error("GET /api/admin/loans/[id] error:", error);
//     return NextResponse.json({ error: "Internal server error" }, { status: 500 });
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

    const loan = await prisma.loan.findUnique({
      where: { id },
      include: {
        customer: {
          include: {
            user: { select: { name: true, phone: true } },
          },
        },
        agent: {
          include: {
            user: { select: { name: true } },
          },
        },
        emiPayments: {
          orderBy: { dayNumber: "asc" },
        },
       
      },
    });

    if (!loan) {
      return NextResponse.json({ error: "Loan not found" }, { status: 404 });
    }

    return NextResponse.json(loan);
  } catch (error) {
    console.error("GET /api/admin/loans/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}