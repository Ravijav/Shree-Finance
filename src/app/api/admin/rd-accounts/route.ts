import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rdAccounts = await prisma.standaloneRDAccount.findMany({
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
        payments: {
          orderBy: { monthNumber: "asc" },
        },
      },
      orderBy: { openedAt: "desc" },
    });

    return NextResponse.json(rdAccounts);
  } catch (error) {
    console.error("GET /api/admin/rd-accounts error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}