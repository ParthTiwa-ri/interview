import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const dummyUserId = "user-123";
  const dummyUserName = "John Doe";

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { id: dummyUserId },
  });

  if (!existingUser) {
    const user = await prisma.user.create({
      data: {
        id: dummyUserId,
        name: dummyUserName,
        email: "john.doe@example.com", // Optional: Add if you want an email
      },
    });
    console.log("Created dummy user:", user);
  } else {
    console.log("User already exists:", existingUser);
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
