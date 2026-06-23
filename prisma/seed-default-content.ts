import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const json = (items: string[]) => JSON.stringify(items);

async function createQuestionSetIfMissing({
  title,
  description,
  module,
  setType,
  accessCode,
  questions,
}: {
  title: string;
  description: string;
  module: "math" | "ebrw";
  setType: "topical" | "retest";
  accessCode?: string;
  questions: Array<{
    text: string;
    answerType: "numeric" | "multiple_choice";
    correctAnswer: string;
    choices?: string[];
    difficulty: "easy" | "mid" | "hard";
    topicTags?: string[];
  }>;
}) {
  const existing = await prisma.questionSet.findFirst({ where: { title } });
  if (existing) return;

  const locked = setType === "retest";
  await prisma.questionSet.create({
    data: {
      title,
      description,
      durationMinutes: locked ? 12 : 15,
      active: true,
      hidden: locked,
      module,
      setType,
      visibility: locked ? "secret" : "public",
      accessCode: locked ? accessCode : null,
      questions: {
        create: questions.map((question, index) => ({
          order: index + 1,
          text: question.text,
          answerType: question.answerType,
          choices: json(question.choices ?? []),
          correctAnswer: question.correctAnswer,
          difficulty: question.difficulty,
          topicTags: json(question.topicTags ?? []),
        })),
      },
    },
  });
}

async function createVocabSetIfMissing(title: string, description: string, items: Array<{ word: string; definition: string; aliases?: string[] }>) {
  const existing = await prisma.vocabSet.findFirst({ where: { title } });
  if (existing) return;

  await prisma.vocabSet.create({
    data: {
      title,
      description,
      active: true,
      items: {
        create: items.map((item) => ({
          word: item.word,
          definition: item.definition,
          aliases: json(item.aliases ?? []),
        })),
      },
    },
  });
}

async function main() {
  await createQuestionSetIfMissing({
    title: "Default Math Coordinate Algebra",
    description: "Simple coordinate algebra check.",
    module: "math",
    setType: "topical",
    questions: [
      { text: "If 3x + 6 = 12, what is x?", answerType: "numeric", correctAnswer: "2", difficulty: "easy", topicTags: ["coordinate algebra", "linear equations"] },
      { text: "A line has slope 2 and y-intercept 3. What is y when x = 4?", answerType: "numeric", correctAnswer: "11", difficulty: "easy", topicTags: ["coordinate algebra", "functions"] },
      { text: "Which point is on the line y = x + 5?", answerType: "multiple_choice", correctAnswer: "(2, 7)", choices: ["(2, 7)", "(2, 5)", "(5, 2)", "(7, 2)"], difficulty: "mid", topicTags: ["coordinate algebra"] },
      { text: "The line y = 4x - 1 crosses the y-axis at what value?", answerType: "numeric", correctAnswer: "-1", difficulty: "mid", topicTags: ["coordinate algebra"] },
      { text: "If a line passes through (0, 2) and (3, 8), what is its slope?", answerType: "numeric", correctAnswer: "2", difficulty: "hard", topicTags: ["coordinate algebra", "slope"] },
    ],
  });

  await createQuestionSetIfMissing({
    title: "Default Math Coordinate Algebra Retest",
    description: "Locked retest for coordinate algebra.",
    module: "math",
    setType: "retest",
    accessCode: "MATH42",
    questions: [
      { text: "If 5x + 10 = 25, what is x?", answerType: "numeric", correctAnswer: "3", difficulty: "easy", topicTags: ["coordinate algebra", "linear equations"] },
      { text: "For y = 3x + 1, what is y when x = 5?", answerType: "numeric", correctAnswer: "16", difficulty: "easy", topicTags: ["coordinate algebra", "functions"] },
      { text: "Which point is on y = 2x - 3?", answerType: "multiple_choice", correctAnswer: "(4, 5)", choices: ["(4, 5)", "(4, 8)", "(5, 4)", "(3, 2)"], difficulty: "mid", topicTags: ["coordinate algebra"] },
      { text: "A line has slope -1 and y-intercept 6. What is y when x = 2?", answerType: "numeric", correctAnswer: "4", difficulty: "mid", topicTags: ["coordinate algebra"] },
      { text: "A line passes through (1, 4) and (5, 12). What is the slope?", answerType: "numeric", correctAnswer: "2", difficulty: "hard", topicTags: ["coordinate algebra", "slope"] },
    ],
  });

  await createQuestionSetIfMissing({
    title: "Default EBRW Words in Context",
    description: "Simple EBRW practice set.",
    module: "ebrw",
    setType: "topical",
    questions: [
      { text: "In the sentence 'The result was unexpected,' which word is closest to unexpected?", answerType: "multiple_choice", correctAnswer: "surprising", choices: ["ordinary", "surprising", "planned", "minor"], difficulty: "easy", topicTags: ["words in context"] },
      { text: "Choose the best transition: 'The evidence was limited. ___, the claim remained plausible.'", answerType: "multiple_choice", correctAnswer: "Nevertheless", choices: ["For example", "Nevertheless", "Similarly", "Therefore"], difficulty: "mid", topicTags: ["transitions"] },
      { text: "Which word best means 'careful and exact'?", answerType: "multiple_choice", correctAnswer: "precise", choices: ["vague", "precise", "rapid", "casual"], difficulty: "easy", topicTags: ["vocabulary"] },
      { text: "What is the main purpose of a topic sentence?", answerType: "multiple_choice", correctAnswer: "To introduce the paragraph's main idea", choices: ["To cite a source", "To introduce the paragraph's main idea", "To end an essay", "To add a title"], difficulty: "mid", topicTags: ["rhetorical purpose"] },
      { text: "Which choice best improves concision: 'due to the fact that'?", answerType: "multiple_choice", correctAnswer: "because", choices: ["because", "in regard to", "for the purpose of", "at this point"], difficulty: "hard", topicTags: ["standard English"] },
    ],
  });

  await createQuestionSetIfMissing({
    title: "Default EBRW Retest",
    description: "Locked EBRW retake check.",
    module: "ebrw",
    setType: "retest",
    accessCode: "EBRW42",
    questions: [
      { text: "Which word is closest to 'brief'?", answerType: "multiple_choice", correctAnswer: "short", choices: ["short", "loud", "late", "wide"], difficulty: "easy", topicTags: ["vocabulary"] },
      { text: "Best transition: 'The plan was risky. ___, it succeeded.'", answerType: "multiple_choice", correctAnswer: "However", choices: ["However", "Because", "For instance", "Likewise"], difficulty: "mid", topicTags: ["transitions"] },
      { text: "Which phrase is most concise: 'in order to improve'?", answerType: "multiple_choice", correctAnswer: "to improve", choices: ["to improve", "for improving of", "with improvement", "in a way to improve"], difficulty: "easy", topicTags: ["standard English"] },
      { text: "A paragraph mainly explains causes. What kind of question is this?", answerType: "multiple_choice", correctAnswer: "Structure", choices: ["Structure", "Punctuation", "Calculation", "Graphing"], difficulty: "mid", topicTags: ["rhetorical structure"] },
      { text: "Which word suggests uncertainty?", answerType: "multiple_choice", correctAnswer: "perhaps", choices: ["certainly", "always", "perhaps", "exactly"], difficulty: "hard", topicTags: ["tone"] },
    ],
  });

  await createVocabSetIfMissing("Default Vocab 1", "Short starter words.", [
    { word: "beautiful", definition: "Pleasing to look at or hear.", aliases: ["beutiful", "beatiful"] },
    { word: "rapid", definition: "Very quick." },
    { word: "calm", definition: "Not excited or upset." },
  ]);

  await createVocabSetIfMissing("Default Vocab 2", "Core SAT verbs.", [
    { word: "analyze", definition: "To examine carefully." },
    { word: "support", definition: "To back up an idea with evidence.", aliases: ["bolster"] },
    { word: "reduce", definition: "To make smaller or less.", aliases: ["lessen"] },
  ]);

  await createVocabSetIfMissing("Default Vocab 3", "Common academic words.", [
    { word: "precise", definition: "Exact and accurate." },
    { word: "contrast", definition: "A difference between things." },
    { word: "claim", definition: "A statement that needs support." },
  ]);
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
