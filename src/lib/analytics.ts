import type { Answer, Question, Submission, User } from "@prisma/client";
import { parseJsonList } from "./format";

export type AnswerWithQuestion = Answer & { question: Question };
export type SubmissionWithDetails = Submission & {
  student: User;
  answers: AnswerWithQuestion[];
};

export function weakTopicsFromAnswers(answers: AnswerWithQuestion[]) {
  const topics = new Map<string, { misses: number; attempts: number }>();

  for (const answer of answers) {
    const tags = parseJsonList(answer.question.topicTags);
    for (const tag of tags) {
      const current = topics.get(tag) ?? { misses: 0, attempts: 0 };
      current.attempts += 1;
      if (!answer.isCorrect) current.misses += 1;
      topics.set(tag, current);
    }
  }

  return [...topics.entries()]
    .map(([topic, stats]) => ({
      topic,
      misses: stats.misses,
      attempts: stats.attempts,
      missRate: stats.attempts ? stats.misses / stats.attempts : 0,
    }))
    .filter((item) => item.misses > 0)
    .sort((a, b) => b.misses - a.misses || b.missRate - a.missRate);
}

export function nextFocus(topics: ReturnType<typeof weakTopicsFromAnswers>): string {
  if (topics.length === 0) return "No clear weak spot yet. Keep collecting results.";
  const top = topics.slice(0, 3).map((item) => item.topic).join(", ");
  return `Work next on: ${top}.`;
}

export function difficultyStatsFromAnswers(answers: AnswerWithQuestion[]) {
  const stats = {
    easy: { correct: 0, total: 0 },
    mid: { correct: 0, total: 0 },
    hard: { correct: 0, total: 0 },
  };

  for (const answer of answers) {
    const difficulty = answer.question.difficulty === "easy" || answer.question.difficulty === "hard" ? answer.question.difficulty : "mid";
    stats[difficulty].total += 1;
    if (answer.isCorrect) stats[difficulty].correct += 1;
  }

  return stats;
}
