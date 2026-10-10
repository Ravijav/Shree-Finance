// import { prisma } from "@/lib/prisma";
// import { auth } from "@/lib/auth";
// import { NextResponse } from "next/server";
// import bcrypt from "bcryptjs";
// import crypto from "crypto";
// import { generateCustomerCode } from "@/lib/utils";

// // GET - Fetch agent's customers
// export async function GET() {
//   try {
//     const session = await auth();
//     if (!session || session.user.role !== "AGENT") {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     const agent = await prisma.agent.findUnique({
//       where: { userId: session.user.id },
//     });

//     if (!agent) {
//       return NextResponse.json({ error: "Agent not found" }, { status: 404 });
//     }

//     const customers = await prisma.customer.findMany({
//       where: { agentId: agent.id },
//       include: {
//         user: {
//           select: {
//             name: true,
//             email: true,
//             phone: true,
//             isActive: true,
//             createdAt: true,
//           },
//         },
//         loans: {
//           select: {
//             id: true,
//             status: true,
//             principalAmount: true,
//             outstandingAmount: true,
//           },
//         },
//         rdAccounts: {
//           select: { id: true, accountNumber: true },
//         },
//       },
//       orderBy: { createdAt: "desc" },
//     });

//     return NextResponse.json(customers);
//   } catch (error) {
//     console.error("GET /api/agent/customers error:", error);
//     return NextResponse.json({ error: "Internal server error" }, { status: 500 });
//   }
// }

// // POST - Add new customer
// export async function POST(req: Request) {
//   try {
//     const session = await auth();
//     if (!session || session.user.role !== "AGENT") {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     const agent = await prisma.agent.findUnique({
//       where: { userId: session.user.id },
//     });

//     if (!agent) {
//       return NextResponse.json({ error: "Agent not found" }, { status: 404 });
//     }

//     const body = await req.json();
//     // const { name, email, phone, password, address, aadharNumber, panNumber } = body;
//     const { name, email, phone, address, aadharNumber, panNumber } = body;

//     const randomPassword = crypto.randomBytes(32).toString("hex");

//     // if (!name || !phone || !password) {
//     //   return NextResponse.json(
//     //     { error: "Name, phone and password are required" },
//     //     { status: 400 }
//     //   );
//     // }

//     if (!name || !phone) {
//     return NextResponse.json(
//       { error: "Name and phone are required" },
//       { status: 400 }
//     );
//   }

//     // Check if phone or email already exists
//     const existing = await prisma.user.findFirst({
//       where: {
//         OR: [
//           { phone },
//           ...(email ? [{ email }] : []),
//         ],
//       },
//     });

//     if (existing) {
//       return NextResponse.json(
//         { error: "Phone or email already registered" },
//         { status: 400 }
//       );
//     }
//     const hashedPassword = await bcrypt.hash(randomPassword, 12);
//     // const hashedPassword = await bcrypt.hash(password, 12);
//     const customerCode = generateCustomerCode();

//     const customer = await prisma.user.create({
//       data: {
//         name: body.name,
//         email: body.email || `${body.phone}@sreeshyam.com`,
//         phone: body.phone,
//         password: hashedPassword,
//         role: "CUSTOMER",
//         customerProfile: {
//           create: {
//             customerCode,
//             agentId: agent.id,
//             // Personal
//             title: body.title || null,
//             fatherSpouseName: body.fatherSpouseName || null,
//             dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : null,
//             sex: body.sex || null,
//             address: body.address || null,
//             city: body.city || null,
//             pinCode: body.pinCode || null,
//             occupation: body.occupation || null,
//             aadharNumber: body.aadharNumber || null,
//             panNumber: body.panNumber || null,
//             // Nominee
//             nomineeName: body.nomineeName || null,
//             nomineeRelationship: body.nomineeRelationship || null,
//             nomineeAge: body.nomineeAge ? Number(body.nomineeAge) : null,
//             nomineeDOB: body.nomineeDOB ? new Date(body.nomineeDOB) : null,
//             nomineePAN: body.nomineePAN || null,
//             nomineeAadhar: body.nomineeAadhar || null,
//             nomineeContact: body.nomineeContact || null,
//             nomineeAddress: body.nomineeAddress || null,
//             // Payment
//             paymentMode: body.paymentMode || null,
//             interestPayableOn: body.interestPayableOn || null,
//             // Introducer
//             introducerName: body.introducerName || null,
//             introducerCode: body.introducerCode || null,
//             introducerAddress: body.introducerAddress || null,
//           },
//         },
//       },
//       include: { customerProfile: true },
//     });

//     await prisma.auditLog.create({
//       data: {
//         userId: session.user.id,
//         action: "CUSTOMER_CREATED",
//         entity: "Customer",
//         entityId: customer.customerProfile!.id,
//         details: { name, phone, customerCode },
//       },
//     });

//     return NextResponse.json(
//       { message: "Customer created successfully", customerCode },
//       { status: 201 }
//     );
//   } catch (error) {
//     console.error("POST /api/agent/customers error:", error);
//     return NextResponse.json({ error: "Internal server error" }, { status: 500 });
//   }
// }

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { generateCustomerCode } from "@/lib/utils";

export async function GET() {
  try {
    const session = await auth();
    if (!session || session.user.role !== "AGENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const agent = await prisma.agent.findUnique({
      where: { userId: session.user.id },
    });

    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    const customers = await prisma.customer.findMany({
      where: { agentId: agent.id },
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
        loans: {
          select: {
            id: true,
            status: true,
            principalAmount: true,
            outstandingAmount: true,
          },
        },
        rdAccounts: {
          select: { id: true, accountNumber: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(customers);
  } catch (error) {
    console.error("GET /api/agent/customers error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "AGENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const agent = await prisma.agent.findUnique({
      where: { userId: session.user.id },
    });

    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    const body = await req.json();
    const {
      name,
      phone,
      email,
      title,
      fatherSpouseName,
      dateOfBirth,
      sex,
      address,
      city,
      pinCode,
      occupation,
      aadharNumber,
      panNumber,
      nomineeName,
      nomineeRelationship,
      nomineeAge,
      nomineeDOB,
      nomineePAN,
      nomineeAadhar,
      nomineeContact,
      nomineeAddress,
      paymentMode,
      interestPayableOn,
      introducerName,
      introducerCode,
      introducerAddress,
    } = body;

    if (!name || !phone) {
      return NextResponse.json(
        { error: "Name and phone are required" },
        { status: 400 }
      );
    }

    // Check if phone or email already exists
    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { phone },
          ...(email ? [{ email }] : []),
        ],
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Phone or email already registered" },
        { status: 400 }
      );
    }

    // Generate random unusable password since customer cannot login
    const randomPassword = crypto.randomBytes(32).toString("hex");
    const hashedPassword = await bcrypt.hash(randomPassword, 12);

    // Await the customer code
    const customerCode = await generateCustomerCode(prisma);

    const customer = await prisma.user.create({
      data: {
        name,
        email: email || `${phone}@sreeshyam.com`,
        phone,
        password: hashedPassword,
        role: "CUSTOMER",
        customerProfile: {
          create: {
            customerCode,
            agentId: agent.id,
            // Personal
            title: title || null,
            fatherSpouseName: fatherSpouseName || null,
            dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
            sex: sex || null,
            address: address || null,
            city: city || null,
            pinCode: pinCode || null,
            occupation: occupation || null,
            aadharNumber: aadharNumber ? aadharNumber : null,
            panNumber: panNumber || null,
            // Nominee
            nomineeName: nomineeName || null,
            nomineeRelationship: nomineeRelationship || null,
            nomineeAge: nomineeAge ? Number(nomineeAge) : null,
            nomineeDOB: nomineeDOB ? new Date(nomineeDOB) : null,
            nomineePAN: nomineePAN || null,
            nomineeAadhar: nomineeAadhar || null,
            nomineeContact: nomineeContact || null,
            nomineeAddress: nomineeAddress || null,
            // Payment
            paymentMode: paymentMode || null,
            interestPayableOn: interestPayableOn || null,
            // Introducer
            introducerName: introducerName || null,
            introducerCode: introducerCode || null,
            introducerAddress: introducerAddress || null,
          },
        },
      },
      include: {
        customerProfile: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "CUSTOMER_CREATED",
        entity: "Customer",
        entityId: customer.customerProfile!.id,
        details: {
          name,
          phone,
          customerCode,
        },
      },
    });

    return NextResponse.json(
      { message: "Customer created successfully", customerCode },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/agent/customers error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}