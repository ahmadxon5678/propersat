import { parseJsonList } from "./format";

export const RETEST_THRESHOLD = 0.7;

export type StudentAlertSource = {
  id: number;
  username: string;
  name: string | null;
  submissions: Array<{
    id: number;
    score: number;
    total: number;
    liveSession: { questionSet: { title: string; setType: string } };
    answers: Array<{ isCorrect: boolean; question: { topicTags: string } }>;
  }>;
  strugglePoints: Array<{ topic: string }>;
};

export function buildStudentAlerts(students: StudentAlertSource[]) {
  return students.flatMap((student) => {
    const retestTopics = new Set(
      student.submissions
        .filter((submission) => submission.liveSession.questionSet.setType === "retest")
        .flatMap((submission) => submission.answers.flatMap((answer) => parseJsonList(answer.question.topicTags))),
    );
    const struggleTopics = new Set(student.strugglePoints.map((point) => point.topic));

    return student.submissions
      .filter((submission) => submission.liveSession.questionSet.setType === "topical")
      .filter((submission) => submission.score / Math.max(submission.total, 1) < RETEST_THRESHOLD)
      .flatMap((submission) => {
        const topics = [
          ...new Set(
            submission.answers
              .filter((answer) => !answer.isCorrect)
              .flatMap((answer) => parseJsonList(answer.question.topicTags)),
          ),
        ];
        return topics
          .filter((topic) => !retestTopics.has(topic) && !struggleTopics.has(topic))
          .map((topic) => ({
            studentId: student.id,
            studentName: student.name || student.username,
            reason: "Retake needed",
            detail: `${topic} after ${submission.score}/${submission.total} on ${submission.liveSession.questionSet.title}`,
            tone: "red" as const,
          }));
      });
  });
}
