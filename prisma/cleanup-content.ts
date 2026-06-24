import { PrismaClient } from "@prisma/client";
import { DEFAULT_ADMIN_PASSWORD, DEFAULT_SECRET_PASSWORD } from "../src/lib/config";

const prisma = new PrismaClient();

async function main() {
  if (process.env.WIPE_CONTENT !== "YES") {
    throw new Error("Refusing to delete content. Run with WIPE_CONTENT=YES only when you intentionally want to remove all tests, vocab, submissions, and struggle records.");
  }

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
    create: { key: "admin_password", value: DEFAULT_ADMIN_PASSWORD || "change-me" },
  });
  await prisma.appSetting.upsert({
    where: { key: "secret_password" },
    update: {},
    create: { key: "secret_password", value: DEFAULT_SECRET_PASSWORD },
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
