import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { generateEmployeeCode } from "@/lib/utils";
import { createAgentSchema } from "@/lib/validations";

// GET - Fetch all agents
export async function GET() {
  try {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const agents = await prisma.agent.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            isActive: true,
            createdAt: true,
          },
        },
        _count: {
          select: {
            customers: true,
            loans: true,
          },
        },
      },
      orderBy: { joinedAt: "desc" },
    });

    return NextResponse.json(agents);
  } catch (error) {
    console.error("GET /api/admin/agents error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST - Create new agent
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, email, phone, password, paymentType, salaryAmount, commissionRate } = body;

    // Validate required fields
    if (!name || !email || !phone || !password || !paymentType) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    // Check if email or phone already exists
    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, { phone }] },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Email or phone number already registered" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const employeeCode = generateEmployeeCode();

    const agent = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        password: hashedPassword,
        role: "AGENT",
        agentProfile: {
          create: {
            employeeCode,
            paymentType,
            salaryAmount: paymentType === "SALARY" ? salaryAmount : null,
            commissionRate: paymentType === "COMMISSION" ? commissionRate : null,
          },
        },
      },
      include: {
        agentProfile: true,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "AGENT_CREATED",
        entity: "Agent",
        entityId: agent.agentProfile!.id,
        details: { name, email, employeeCode },
      },
    });

    return NextResponse.json({ message: "Agent created successfully" }, { status: 201 });
  } catch (error) {
    console.error("POST /api/admin/agents error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}