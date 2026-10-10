import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const agent = await prisma.agent.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }
    if (!agent.isActive) {
      return NextResponse.json({ error: "Agent is already deactivated" }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: agent.userId },
      data: { isActive: false },
    });

    await prisma.agent.update({
      where: { id },
      data: { isActive: false },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "AGENT_DEACTIVATED",
        entity: "Agent",
        entityId: id,
        details: { name: agent.user.name },
      },
    });

    return NextResponse.json({ message: "Agent deactivated successfully" });
  } catch (error) {
    console.error("DELETE /api/admin/agents/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

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
    const { password } = await req.json();

    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const agent = await prisma.agent.findUnique({
      where: { id },
    });

    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await prisma.user.update({
      where: { id: agent.userId },
      data: { password: hashedPassword },
    });

    return NextResponse.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("PATCH /api/admin/agents/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const agent = await prisma.agent.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    await prisma.user.update({
      where: { id: agent.userId },
      data: { isActive: true },
    });

    await prisma.agent.update({
      where: { id },
      data: { isActive: true },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "AGENT_REACTIVATED",
        entity: "Agent",
        entityId: id,
        details: { name: agent.user.name },
      },
    });

    return NextResponse.json({ message: "Agent reactivated successfully" });
  } catch (error) {
    console.error("PUT /api/admin/agents/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}