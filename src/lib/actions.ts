"use server";

import { revalidatePath } from "next/cache";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { redirect } from "next/navigation";
import { clearLoginCookie, currentUser, requireUser, setLoginCookie } from "./auth";
import { prisma } from "./db";
import { listToJson, parseJsonList } from "./format";
import { gradeAnswer, isCloseVocabAnswer, isVocabCorrect } from "./grading";

const DEFAULT_ADMIN_PASSWORD = "AhmadJohns!09";
const DEFAULT_SECRET_PASSWORD = "retest2026";
const RETEST_THRESHOLD = 0.7;
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);
const DIFFICULTIES = new Set(["easy", "mid", "hard"]);

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function adminPath(pathname = "") {
  revalidatePath("/admin");
  if (pathname) revalidatePath(pathname);
}

function difficulty(formData: FormData) {
  const value = text(formData, "difficulty");
  return DIFFICULTIES.has(value) ? value : "mid";
}

function createAccessCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

async function createUniqueAccessCode() {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const code = createAccessCode();
    const existing = await prisma.questionSet.findFirst({ where: { accessCode: code } });
    if (!existing) return code;
  }
  return `${Date.now()}`.slice(-6);
}

function isLockedSet(set: { visibility: string; hidden: boolean; setType: string }) {
  return set.visibility === "secret" || set.hidden || set.setType === "retest";
}

async function saveQuestionImage(formData: FormData): Promise<string | null> {
  const file = formData.get("imageFile");
  if (!(file instanceof File) || file.size === 0) return null;
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    throw new Error("Only PNG, JPG, and WebP screenshots are supported.");
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error("Screenshot must be 5MB or smaller.");
  }

  const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const uploadDir = path.join(process.cwd(), "public", "uploads", "questions");
  await mkdir(uploadDir, { recursive: true });
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;
  await writeFile(path.join(uploadDir, fileName), Buffer.from(await file.arrayBuffer()));
  return `/uploads/questions/${fileName}`;
}

async function requireManager() {
  const user = await currentUser();
  if (!user) redirect("/login");
  if (user.role !== "admin" && user.role !== "teacher") redirect("/student");
  return user;
}

export async function getSetting(key: string, fallback: string) {
  const setting = await prisma.appSetting.findUnique({ where: { key } });
  return setting?.value || fallback;
}

export async function loginAction(_: unknown, formData: FormData) {
  const username = text(formData, "username");
  const password = text(formData, "password");
  const user = await prisma.user.findUnique({ where: { username } });

  if (!user || user.password !== password || user.role === "admin") {
    return { error: "Invalid username or password." };
  }

  await setLoginCookie(user.id);
  redirect(user.role === "teacher" ? "/teacher" : "/student");
}

export async function founderLoginAction(_: unknown, formData: FormData) {
  const password = text(formData, "founderPassword");
  const adminPassword = await getSetting("admin_password", DEFAULT_ADMIN_PASSWORD);

  if (password !== adminPassword) {
    return { error: "Wrong admin password." };
  }

  const user = await prisma.user.upsert({
    where: { username: "founder" },
    update: { password, role: "admin", name: "Admin" },
    create: { username: "founder", password, role: "admin", name: "Admin" },
  });

  await setLoginCookie(user.id);
  redirect("/admin");
}

export async function registerAction(_: unknown, formData: FormData) {
  const name = text(formData, "name");
  const username = text(formData, "username");
  const password = text(formData, "password");

  if (!name || !username || !password) {
    return { error: "Name, username, and password are required." };
  }

  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) {
    return { error: "That username is already taken." };
  }

  const user = await prisma.user.create({
    data: { name, username, password, role: "student" },
  });

  await setLoginCookie(user.id);
  redirect("/student");
}

export async function logoutAction() {
  await clearLoginCookie();
  redirect("/login");
}

export async function updateSettingsAction(formData: FormData) {
  await requireManager();
  const secretPassword = text(formData, "secretPassword") || DEFAULT_SECRET_PASSWORD;
  const adminPassword = text(formData, "adminPassword");

  await prisma.appSetting.upsert({
    where: { key: "secret_password" },
    update: { value: secretPassword },
    create: { key: "secret_password", value: secretPassword },
  });

  if (adminPassword) {
    await prisma.appSetting.upsert({
      where: { key: "admin_password" },
      update: { value: adminPassword },
      create: { key: "admin_password", value: adminPassword },
    });
  }

  adminPath("/admin/settings");
}

export async function createStudentAction(formData: FormData) {
  await requireManager();
  const username = text(formData, "username");
  const password = text(formData, "password");
  const name = text(formData, "name") || username;
  if (!username || !password) return;

  await prisma.user.create({
    data: { name, username, password, role: "student" },
  });
  adminPath("/admin/students");
  revalidatePath("/teacher");
}

export async function createQuestionSetAction(formData: FormData) {
  await requireManager();
  const title = text(formData, "title");
  if (!title) return;
  const visibility = text(formData, "visibility") || (formData.get("hidden") === "on" ? "secret" : "public");
  const setType = text(formData, "setType") || "topical";
  const hidden = visibility === "secret" || setType === "retest";
  const questionModule = text(formData, "module") || "math";

  await prisma.questionSet.create({
    data: {
      title,
      description: text(formData, "description"),
      durationMinutes: Number(text(formData, "durationMinutes")) || 25,
      active: formData.get("publish") === "on" || formData.get("active") === "on",
      hidden,
      module: questionModule,
      setType,
      visibility: hidden ? "secret" : visibility,
      accessCode: hidden ? await createUniqueAccessCode() : null,
    },
  });
  adminPath("/admin/math");
  adminPath("/admin/ebrw");
  adminPath("/admin/question-sets");
  revalidatePath("/teacher");
  revalidatePath("/student");
}

export async function updateQuestionSetAction(formData: FormData) {
  await requireManager();
  const id = Number(formData.get("id"));
  if (!id) return;
  const visibility = text(formData, "visibility") || (formData.get("hidden") === "on" ? "secret" : "public");
  const setType = text(formData, "setType") || "topical";
  const hidden = visibility === "secret" || setType === "retest";
  const current = await prisma.questionSet.findUnique({ where: { id } });
  if (!current) return;

  await prisma.questionSet.update({
    where: { id },
    data: {
      title: text(formData, "title"),
      description: text(formData, "description"),
      durationMinutes: Number(text(formData, "durationMinutes")) || 25,
      active: formData.get("active") === "on",
      hidden,
      setType,
      visibility: hidden ? "secret" : visibility,
      accessCode: hidden ? current.accessCode || await createUniqueAccessCode() : null,
    },
  });
  adminPath("/admin/question-sets");
  adminPath("/admin/math");
  adminPath("/admin/ebrw");
  revalidatePath("/teacher");
  revalidatePath("/student");
}

export async function addQuestionAction(formData: FormData) {
  await requireManager();
  const questionSetId = Number(formData.get("questionSetId"));
  const questionText = text(formData, "text");
  if (!questionSetId || !questionText) return;

  const count = await prisma.question.count({ where: { questionSetId } });
  const uploadedImage = await saveQuestionImage(formData);
  await prisma.question.create({
    data: {
      questionSetId,
      text: questionText,
      imageUrl: uploadedImage || text(formData, "imageUrl") || null,
      answerType: text(formData, "answerType") || "multiple_choice",
      choices: listToJson(formData.get("choices")),
      correctAnswer: text(formData, "correctAnswer"),
      topicTags: listToJson(formData.get("topicTags")),
      difficulty: difficulty(formData),
      notes: text(formData, "notes") || null,
      order: count + 1,
    },
  });
  adminPath("/admin/math");
  adminPath("/admin/ebrw");
  adminPath("/admin/question-sets");
  revalidatePath("/teacher");
}

export async function updateQuestionAction(formData: FormData) {
  await requireManager();
  const id = Number(formData.get("id"));
  if (!id) return;

  const uploadedImage = await saveQuestionImage(formData);
  const existingImage = text(formData, "existingImageUrl");
  const removeImage = formData.get("removeImage") === "on";
  await prisma.question.update({
    where: { id },
    data: {
      text: text(formData, "text"),
      imageUrl: removeImage ? null : uploadedImage || existingImage || text(formData, "imageUrl") || null,
      answerType: text(formData, "answerType") || "multiple_choice",
      choices: listToJson(formData.get("choices")),
      correctAnswer: text(formData, "correctAnswer"),
      topicTags: listToJson(formData.get("topicTags")),
      difficulty: difficulty(formData),
      notes: text(formData, "notes") || null,
    },
  });
  adminPath("/admin/question-sets");
  adminPath("/admin/math");
  adminPath("/admin/ebrw");
  revalidatePath("/teacher");
}

export async function deleteQuestionAction(formData: FormData) {
  await requireManager();
  const id = Number(formData.get("id"));
  if (!id) return;
  await prisma.question.delete({ where: { id } });
  adminPath("/admin/question-sets");
  adminPath("/admin/math");
  adminPath("/admin/ebrw");
  revalidatePath("/teacher");
}

export async function deleteQuestionSetAction(formData: FormData) {
  await requireManager();
  const id = Number(formData.get("id"));
  if (!id) return;
  await prisma.questionSet.delete({ where: { id } });
  adminPath("/admin/question-sets");
  adminPath("/admin/math");
  adminPath("/admin/ebrw");
  revalidatePath("/teacher");
  revalidatePath("/student");
}

export async function startSessionAction(formData: FormData) {
  await requireManager();
  const questionSetId = Number(formData.get("questionSetId"));
  const studentIds = formData.getAll("studentIds").map(Number).filter(Boolean);
  if (!questionSetId || studentIds.length === 0) return;

  await prisma.liveSession.create({
    data: {
      questionSetId,
      status: "ACTIVE",
      assigned: {
        create: studentIds.map((studentId) => ({ studentId })),
      },
    },
  });
  revalidatePath("/admin");
  revalidatePath("/teacher");
  revalidatePath("/student");
}

export async function endSessionAction(formData: FormData) {
  await requireManager();
  const id = Number(formData.get("id"));
  if (!id) return;

  await prisma.liveSession.update({
    where: { id },
    data: { status: "CLOSED", endedAt: new Date() },
  });
  revalidatePath("/admin");
  revalidatePath("/teacher");
  revalidatePath("/student");
}

export async function startSetAttemptAction(_: unknown, formData: FormData) {
  const user = await requireUser("student");
  const questionSetId = Number(formData.get("questionSetId"));
  const password = text(formData, "password");
  const set = await prisma.questionSet.findFirst({
    where: { id: questionSetId, active: true, questions: { some: {} } },
  });
  if (!set) return { error: "This test is not available." };

  if (isLockedSet(set)) {
    const secretPassword = await getSetting("secret_password", DEFAULT_SECRET_PASSWORD);
    if (password !== (set.accessCode || secretPassword)) return { error: "Wrong test password." };
  }

  const session = await prisma.liveSession.create({
    data: {
      questionSetId: set.id,
      status: "ACTIVE",
      assigned: { create: { studentId: user.id } },
    },
  });

  redirect(`/student/test/${session.id}`);
}

export async function submitTestAction(formData: FormData) {
  const user = await requireUser("student");
  const liveSessionId = Number(formData.get("liveSessionId"));
  if (!liveSessionId) redirect("/student");

  const session = await prisma.liveSession.findFirst({
    where: {
      id: liveSessionId,
      status: "ACTIVE",
      assigned: { some: { studentId: user.id } },
    },
    include: {
      questionSet: { include: { questions: { orderBy: { order: "asc" } } } },
      submissions: { where: { studentId: user.id } },
    },
  });

  if (!session || session.submissions.length > 0) redirect("/student");

  let score = 0;
  const answers = session.questionSet.questions.map((question) => {
    const response = text(formData, `question_${question.id}`);
    const isCorrect = gradeAnswer(question.answerType, response, question.correctAnswer);
    if (isCorrect) score += 1;
    return { questionId: question.id, response, isCorrect };
  });

  const submission = await prisma.submission.create({
    data: {
      liveSessionId,
      studentId: user.id,
      score,
      total: session.questionSet.questions.length,
      answers: { create: answers },
    },
  });

  await prisma.liveSession.update({
    where: { id: liveSessionId },
    data: { status: "CLOSED", endedAt: new Date() },
  });

  const ratio = session.questionSet.questions.length ? score / session.questionSet.questions.length : 0;
  if (session.questionSet.setType === "retest" && ratio < RETEST_THRESHOLD) {
    const missedTopics = new Set<string>();
    for (const answer of answers) {
      if (!answer.isCorrect) {
        const question = session.questionSet.questions.find((item) => item.id === answer.questionId);
        parseJsonList(question?.topicTags).forEach((tag) => missedTopics.add(tag));
      }
    }
    for (const topic of missedTopics) {
      await prisma.strugglePoint.upsert({
        where: { studentId_topic_source: { studentId: user.id, topic, source: "failed_retest" } },
        update: { resolved: false, notes: `Failed retest: ${session.questionSet.title}` },
        create: {
          studentId: user.id,
          topic,
          source: "failed_retest",
          notes: `Failed retest: ${session.questionSet.title}`,
        },
      });
    }
  }

  revalidatePath("/student");
  revalidatePath("/admin");
  revalidatePath("/teacher");
  redirect(`/student/results/${submission.id}`);
}

export async function createVocabSetAction(formData: FormData) {
  await requireManager();
  const title = text(formData, "title");
  if (!title) return;

  await prisma.vocabSet.create({
    data: {
      title,
      description: text(formData, "description"),
      active: formData.get("publish") === "on",
    },
  });
  adminPath("/admin/vocaquiz");
  adminPath("/admin/question-sets");
  revalidatePath("/student/vocab");
}

export async function createVocabAction(formData: FormData) {
  await requireManager();
  const word = text(formData, "word");
  const definition = text(formData, "definition");
  if (!word || !definition) return;

  const vocabSetId = Number(formData.get("vocabSetId")) || null;
  await prisma.vocabularyItem.create({
    data: {
      vocabSetId,
      word,
      definition,
      aliases: listToJson(formData.get("aliases")),
      difficulty: null,
      tag: null,
    },
  });
  adminPath("/admin/vocaquiz");
  adminPath("/admin/question-sets");
  revalidatePath("/teacher");
  revalidatePath("/student/vocab");
}

export async function submitVocabAction(_: unknown, formData: FormData) {
  const user = await requireUser("student");
  const vocabItemId = Number(formData.get("vocabItemId"));
  const response = text(formData, "response");
  const item = await prisma.vocabularyItem.findUnique({ where: { id: vocabItemId } });
  if (!item) return { message: "Vocabulary item not found.", correct: false, close: false };

  const aliases = parseJsonList(item.aliases);
  const correct = isVocabCorrect(response, item.word, aliases);
  const close = !correct && isCloseVocabAnswer(response, item.word, aliases);
  await prisma.vocabAttempt.create({
    data: {
      studentId: user.id,
      vocabItemId,
      response,
      isCorrect: correct,
    },
  });

  revalidatePath("/student/vocab");
  revalidatePath("/admin");
  return {
    message: correct
      ? "Correct."
      : close
        ? "Incorrect, but close spelling. Check the letters carefully."
        : `Incorrect. Correct word: ${item.word}`,
    correct,
    close,
  };
}

export async function publishQuestionSetAction(formData: FormData) {
  await requireManager();
  const id = Number(formData.get("id"));
  if (!id) return;
  await prisma.questionSet.update({ where: { id }, data: { active: true } });
  adminPath("/admin/math");
  adminPath("/admin/question-sets");
  revalidatePath("/student");
}

export async function publishVocabSetAction(formData: FormData) {
  await requireManager();
  const id = Number(formData.get("id"));
  if (!id) return;
  await prisma.vocabSet.update({ where: { id }, data: { active: true } });
  adminPath("/admin/vocaquiz");
  adminPath("/admin/question-sets");
  revalidatePath("/student");
  revalidatePath("/student/vocab");
}

export async function updateStudentAccountAction(_: unknown, formData: FormData) {
  const user = await requireUser("student");
  const username = text(formData, "username");
  const password = text(formData, "password");

  if (!username) return { error: "Username is required.", success: "" };

  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing && existing.id !== user.id) {
    return { error: "That username is already taken.", success: "" };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      username,
      ...(password ? { password } : {}),
    },
  });

  revalidatePath("/student");
  return { error: "", success: "Account updated." };
}
