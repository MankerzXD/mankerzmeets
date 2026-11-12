import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Initializing production seed for Mankerz Meet...");

  const superAdminEmail = (
    process.env.SUPERADMIN_EMAIL || "sanchezmanuel397@gmail.com"
  )
    .trim()
    .toLowerCase();

  const superAdmin = await prisma.user.upsert({
    where: { email: superAdminEmail },
    update: { role: "SUPERADMIN" },
    create: {
      email: superAdminEmail,
      role: "SUPERADMIN",
    },
  });

  console.log(`SuperAdmin ready: ${superAdmin.email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
