import { PrismaClient } from "@prisma/client";
import { DEFAULT_ADMIN_PASSWORD, DEFAULT_SECRET_PASSWORD } from "../src/lib/config";

const prisma = new PrismaClient();

const json = (items: string[]) => JSON.stringify(items);

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
  await prisma.appSetting.deleteMany();
  await prisma.user.deleteMany();

  await prisma.appSetting.createMany({
    data: [
      { key: "admin_password", value: DEFAULT_ADMIN_PASSWORD || "change-me" },
      { key: "secret_password", value: DEFAULT_SECRET_PASSWORD },
    ],
  });

  await prisma.user.createMany({
    data: [
      { name: "Teacher", username: "teacher", password: "teacher123", role: "teacher" },
      { name: "Ahmadxon", username: "founder", password: DEFAULT_ADMIN_PASSWORD || "change-me", role: "admin" },
      { name: "Ali", username: "ali", password: "student123", role: "student" },
      { name: "Sara", username: "sara", password: "student123", role: "student" },
      { name: "Timur", username: "timur", password: "student123", role: "student" },
    ],
  });

  await prisma.questionSet.create({
    data: {
      title: "SAT Math Diagnostic A",
      description: "Mixed algebra and problem-solving set for weak-spot detection.",
      durationMinutes: 25,
      active: true,
      module: "math",
      setType: "topical",
      visibility: "public",
      questions: {
        create: [
          {
            order: 1,
            text: "If 3x + 7 = 22, what is the value of x?",
            answerType: "numeric",
            correctAnswer: "5",
            topicTags: json(["linear equations"]),
          },
          {
            order: 2,
            text: "A line has slope 2 and passes through (1, 5). Which equation represents the line?",
            answerType: "multiple_choice",
            choices: json(["y = 2x + 3", "y = 2x + 5", "y = 3x + 2", "y = x + 4"]),
            correctAnswer: "y = 2x + 3",
            topicTags: json(["linear equations", "functions"]),
          },
          {
            order: 3,
            text: "If x + y = 10 and x - y = 4, what is x?",
            answerType: "numeric",
            correctAnswer: "7",
            topicTags: json(["systems of equations"]),
          },
          {
            order: 4,
            text: "A jacket originally costs $80 and is discounted by 25%. What is the sale price?",
            answerType: "numeric",
            correctAnswer: "60",
            topicTags: json(["percentages", "word problems"]),
          },
          {
            order: 5,
            text: "The function f is defined by f(x) = x^2 - 4. What is f(5)?",
            answerType: "numeric",
            correctAnswer: "21",
            topicTags: json(["functions", "quadratics"]),
          },
        ],
      },
    },
  });

  await prisma.questionSet.create({
    data: {
      title: "SAT Math Diagnostic B",
      description: "Geometry, ratios, data, and advanced algebra practice.",
      durationMinutes: 25,
      active: true,
      module: "math",
      setType: "topical",
      visibility: "public",
      questions: {
        create: [
          {
            order: 1,
            text: "A right triangle has legs of length 6 and 8. What is the hypotenuse?",
            answerType: "numeric",
            correctAnswer: "10",
            topicTags: json(["geometry"]),
          },
          {
            order: 2,
            text: "If 4 notebooks cost $18, at the same rate how much do 10 notebooks cost?",
            answerType: "numeric",
            correctAnswer: "45",
            topicTags: json(["ratios", "word problems"]),
          },
          {
            order: 3,
            text: "Which expression is equivalent to (x + 3)(x - 3)?",
            answerType: "multiple_choice",
            choices: json(["x^2 - 9", "x^2 + 9", "x^2 - 6", "2x - 9"]),
            correctAnswer: "x^2 - 9",
            topicTags: json(["advanced algebra", "quadratics"]),
          },
          {
            order: 4,
            text: "The mean of 6, 8, 10, and k is 9. What is k?",
            answerType: "numeric",
            correctAnswer: "12",
            topicTags: json(["data analysis"]),
          },
          {
            order: 5,
            text: "For the function g(x) = 3x - 2, what input x gives g(x) = 13?",
            answerType: "numeric",
            correctAnswer: "5",
            topicTags: json(["functions", "linear equations"]),
          },
        ],
      },
    },
  });

  await prisma.questionSet.create({
    data: {
      title: "Triangles Retest",
      description: "Secret retest sample for students who need a second check.",
      durationMinutes: 12,
      active: true,
      hidden: true,
      module: "math",
      setType: "retest",
      visibility: "secret",
      questions: {
        create: [
          {
            order: 1,
            text: "A right triangle has one leg of length 5 and hypotenuse 13. What is the length of the other leg?",
            answerType: "numeric",
            correctAnswer: "12",
            topicTags: json(["geometry", "triangles"]),
          },
          {
            order: 2,
            text: "The angles of a triangle are x, 2x, and 3x degrees. What is x?",
            answerType: "numeric",
            correctAnswer: "30",
            topicTags: json(["geometry", "triangles"]),
          },
        ],
      },
    },
  });

  await prisma.questionSet.create({
    data: {
      title: "SAT Math Full Exam Mini",
      description: "Small Bluebook-style demo exam.",
      durationMinutes: 20,
      active: true,
      module: "math",
      setType: "full_exam",
      visibility: "public",
      questions: {
        create: [
          {
            order: 1,
            text: "If 2(x - 4) = 18, what is x?",
            answerType: "numeric",
            correctAnswer: "13",
            topicTags: json(["linear equations"]),
          },
          {
            order: 2,
            text: "Which value of x satisfies x^2 = 49?",
            answerType: "multiple_choice",
            choices: json(["-7 only", "7 only", "-7 and 7", "49"]),
            correctAnswer: "-7 and 7",
            topicTags: json(["quadratics"]),
          },
        ],
      },
    },
  });

  const vocabSet = await prisma.vocabSet.create({
    data: {
      title: "Core SAT Vocabulary",
      description: "Demo VocaQuiz set for flashcards and typed practice.",
    },
  });

  await prisma.vocabularyItem.createMany({
    data: [
      { vocabSetId: vocabSet.id, word: "abate", definition: "To become less intense or widespread.", aliases: json(["lessen", "subside"]), difficulty: "medium", tag: "common SAT" },
      { vocabSetId: vocabSet.id, word: "ambiguous", definition: "Open to more than one interpretation.", aliases: json(["unclear"]), difficulty: "medium", tag: "precision" },
      { vocabSetId: vocabSet.id, word: "bolster", definition: "To support or strengthen.", aliases: json(["strengthen", "support"]), difficulty: "medium", tag: "verbs" },
      { vocabSetId: vocabSet.id, word: "candid", definition: "Truthful and straightforward.", aliases: json(["honest", "frank"]), difficulty: "easy", tag: "tone" },
      { vocabSetId: vocabSet.id, word: "concede", definition: "To admit that something is true after first denying it.", aliases: json(["admit"]), difficulty: "medium", tag: "argument" },
      { vocabSetId: vocabSet.id, word: "elicit", definition: "To draw out a response or reaction.", aliases: json(["evoke"]), difficulty: "hard", tag: "verbs" },
      { vocabSetId: vocabSet.id, word: "mitigate", definition: "To make less severe or serious.", aliases: json(["reduce", "alleviate"]), difficulty: "hard", tag: "common SAT" },
      { vocabSetId: vocabSet.id, word: "novel", definition: "New, original, or unusual.", aliases: json(["new", "original"]), difficulty: "easy", tag: "description" },
      { vocabSetId: vocabSet.id, word: "pragmatic", definition: "Practical and focused on results.", aliases: json(["practical"]), difficulty: "medium", tag: "description" },
      { vocabSetId: vocabSet.id, word: "scrutinize", definition: "To examine closely and carefully.", aliases: json(["examine", "inspect"]), difficulty: "medium", tag: "verbs" },
    ],
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
