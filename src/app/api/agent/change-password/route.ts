// import { prisma } from "@/lib/prisma";
// import { auth } from "@/lib/auth";
// import { NextResponse } from "next/server";
// import bcrypt from "bcryptjs";

// export async function PATCH(req: Request) {
//   try {
//     const session = await auth();
//     if (!session || session.user.role !== "AGENT") {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     const { currentPassword, newPassword } = await req.json();

//     if (!currentPassword || !newPassword) {
//       return NextResponse.json(
//         { error: "Both current and new password are required" },
//         { status: 400 }
//       );
//     }

//     if (newPassword.length < 6) {
//       return NextResponse.json(
//         { error: "New password must be at least 6 characters" },
//         { status: 400 }
//       );
//     }

//     const user = await prisma.user.findUnique({
//       where: { id: session.user.id },
//     });

//     if (!user) {
//       return NextResponse.json({ error: "User not found" }, { status: 404 });
//     }

//     // Verify current password
//     const isValid = await bcrypt.compare(currentPassword, user.password);
//     if (!isValid) {
//       return NextResponse.json(
//         { error: "Current password is incorrect" },
//         { status: 400 }
//       );
//     }

//     const hashedPassword = await bcrypt.hash(newPassword, 12);

//     // Get agent profile
//     const agent = await prisma.agent.findUnique({
//       where: { userId: session.user.id },
//     });

//     if (!agent) {
//       return NextResponse.json({ error: "Agent not found" }, { status: 404 });
//     }

//     // Update password + log the change with plain text for admin visibility
//     await prisma.$transaction(async (tx) => {
//       await tx.user.update({
//         where: { id: session.user.id },
//         data: { password: hashedPassword },
//       });

//       // Log new password in plain text so admin can see it
//       await tx.agentPasswordLog.create({
//         data: {
//           agentId: agent.id,
//           newPassword: newPassword,
//           seenByAdmin: false,
//         },
//       });
//     });

//     await prisma.auditLog.create({
//       data: {
//         userId: session.user.id,
//         action: "AGENT_PASSWORD_CHANGED",
//         entity: "Agent",
//         entityId: agent.id,
//         details: { changedBy: "agent", name: user.name },
//       },
//     });

//     return NextResponse.json({ message: "Password changed successfully" });
//   } catch (error) {
//     console.error("PATCH /api/agent/change-password error:", error);
//     return NextResponse.json(
//       { error: "Internal server error" },
//       { status: 500 }
//     );
//   }
// }

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function PATCH(req: Request) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "AGENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { currentPassword, newPassword } = await req.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Both current and new password are required" },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "New password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      return NextResponse.json(
        { error: "Current password is incorrect" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    const agent = await prisma.agent.findUnique({
      where: { userId: session.user.id },
    });

    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: session.user.id },
        data: { password: hashedPassword },
      });

      // Only log the event — NO plain text password stored
      await tx.agentPasswordLog.create({
        data: {
          agentId: agent.id,
          seenByAdmin: false,
        },
      });
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "AGENT_PASSWORD_CHANGED",
        entity: "Agent",
        entityId: agent.id,
        details: { changedBy: "agent", name: user.name },
      },
    });

    return NextResponse.json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("PATCH /api/agent/change-password error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}