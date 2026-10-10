import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // ─── Create Admin ───────────────────────────────────────
  const hashedPassword = await bcrypt.hash("Admin@123", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@sreeshyam.com" },
    update: {},
    create: {
      name: "Super Admin",
      email: "admin@shreeshyam.com",
      phone: "9999999999",
      password: hashedPassword,
      role: Role.ADMIN,
      isActive: true,
    },
  });

  console.log("✅ Admin created:", admin.email);
  console.log("📧 Email    : admin@sreeshyam.com");
  console.log("🔑 Password : Admin@123");
  console.log("⚠️  Change this password after first login!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });