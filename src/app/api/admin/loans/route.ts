// import { prisma } from "@/lib/prisma";
// import { auth } from "@/lib/auth";
// import { NextResponse } from "next/server";

// export async function GET(req: Request) {
//   try {
//     const session = await auth();
//     if (!session || session.user.role !== "ADMIN") {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     const { searchParams } = new URL(req.url);
//     const status = searchParams.get("status");
//     const from = searchParams.get("from");
//     const to = searchParams.get("to");

//     const loans = await prisma.loan.findMany({
//       where: {
//         ...(status && status !== "ALL" ? { status: status as never } : {}),
//         ...(from && to
//           ? {
//               createdAt: {
//                 gte: new Date(from),
//                 lte: new Date(to),
//               },
//             }
//           : {}),
//       },
//       include: {
//         customer: {
//           include: {
//             user: {
//               select: { name: true, phone: true },
//             },
//           },
//         },
//         agent: {
//           include: {
//             user: {
//               select: { name: true },
//             },
//           },
//         },
//         emiPayments: {
//           select: {
//             id: true,
//             emiNumber: true,
//             dueDate: true,
//             paidDate: true,
//             emiAmount: true,
//             status: true,
//             paidByAgentId: true,
//             remarks: true,
//           },
//         },
//       },
//       orderBy: { createdAt: "desc" },
//     });
    
//     return NextResponse.json(loans);
//   } catch (error) {
//     console.error("GET /api/admin/loans error:", error);
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
    const status = searchParams.get("status");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const loans = await prisma.loan.findMany({
      where: {
        ...(status && status !== "ALL" ? { status: status as never } : {}),
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
        customer: {
          include: {
            user: {
              select: { name: true, phone: true },
            },
          },
        },
        agent: {
          include: {
            user: {
              select: { name: true },
            },
          },
        },
        emiPayments: {
          select: {
            id: true,
            dayNumber: true,
            dueDate: true,
            paidDate: true,
            installmentAmount: true,
            status: true,
            paidByAgentId: true,
            remarks: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(loans);
  } catch (error) {
    console.error("GET /api/admin/loans error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}