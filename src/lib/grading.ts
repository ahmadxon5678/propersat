import { normalizeAnswer } from "./format";

function numericValue(value: string): number | null {
  const normalized = value.trim().replace(/,/g, "");
  if (/^-?\d+(\.\d+)?$/.test(normalized)) return Number(normalized);

  const fraction = normalized.match(/^(-?\d+)\/(-?\d+)$/);
  if (fraction) {
    const denominator = Number(fraction[2]);
    if (denominator !== 0) return Number(fraction[1]) / denominator;
  }

  return null;
}

export function gradeAnswer(answerType: string, response: string, correctAnswer: string): boolean {
  const normalizedResponse = normalizeAnswer(response);
  const normalizedCorrect = normalizeAnswer(correctAnswer);

  if (answerType === "numeric") {
    const responseNumber = numericValue(response);
    const correctNumber = numericValue(correctAnswer);
    if (responseNumber !== null && correctNumber !== null) {
      return Math.abs(responseNumber - correctNumber) < 0.000001;
    }
  }

  return normalizedResponse === normalizedCorrect;
}

export function isVocabCorrect(response: string, word: string, aliases: string[]): boolean {
  const accepted = [word, ...aliases].map(normalizeAnswer);
  return accepted.includes(normalizeAnswer(response));
}

function editDistance(a: string, b: string): number {
  const matrix = Array.from({ length: a.length + 1 }, (_, row) =>
    Array.from({ length: b.length + 1 }, (_, column) => (row === 0 ? column : column === 0 ? row : 0)),
  );

  for (let row = 1; row <= a.length; row += 1) {
    for (let column = 1; column <= b.length; column += 1) {
      const cost = a[row - 1] === b[column - 1] ? 0 : 1;
      matrix[row][column] = Math.min(
        matrix[row - 1][column] + 1,
        matrix[row][column - 1] + 1,
        matrix[row - 1][column - 1] + cost,
      );
    }
  }

  return matrix[a.length][b.length];
}

export function isCloseVocabAnswer(response: string, word: string, aliases: string[]): boolean {
  const normalized = normalizeAnswer(response).replace(/\s/g, "");
  if (normalized.length < 4) return false;
  return [word, ...aliases]
    .map((item) => normalizeAnswer(item).replace(/\s/g, ""))
    .some((accepted) => accepted.length >= 4 && editDistance(normalized, accepted) <= 2);
}
