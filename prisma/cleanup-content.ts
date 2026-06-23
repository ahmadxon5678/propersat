import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.answer.deleteMany();
  await prisma.submission.deleteMany();
  await prisma.liveSessionStudent.deleteMany();
  await prisma.liveSession.deleteMany();
  await prisma.question.deleteMany();
  await prisma.questionSet.deleteMany();
  await prisma.vocabAttempt.deleteMany();
  await prisma.vocabularyItem.deleteMany();
  await prisma.vocabSet.deleteMany();
  await prisma.strugglePoint.deleteMany();

  await prisma.appSetting.upsert({
    where: { key: "admin_password" },
    update: {},
    create: { key: "admin_password", value: "AhmadJohns!09" },
  });
  await prisma.appSetting.upsert({
    where: { key: "secret_password" },
    update: {},
    create: { key: "secret_password", value: "retest2026" },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
