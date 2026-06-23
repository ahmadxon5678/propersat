import Link from "next/link";
import type { Answer, Question } from "@prisma/client";
import { AdminShell } from "@/components/AdminShell";
import { requireUser } from "@/lib/auth";
import { difficultyStatsFromAnswers, weakTopicsFromAnswers } from "@/lib/analytics";
import { prisma } from "@/lib/db";
import { formatDate, parseJsonList } from "@/lib/format";

type SearchParams = Promise<{ set?: string; student?: string; q?: string }>;
type ResultAnswer = Answer & { question: Question };
type ResultSubmission = {
  id: number;
  studentId: number;
  score: number;
  total: number;
  submittedAt: Date;
  student: { name: string | null; username: string };
  answers: ResultAnswer[];
};
type ResultSet = {
  id: number;
  title: string;
  module: string;
  setType: string;
  questions: Question[];
};

export default async function AdminResultsPage({ searchParams }: { searchParams: SearchParams }) {
  const user = await requireUser("admin");
  const params = await searchParams;
  const query = String(params.q ?? "").trim().toLowerCase();
  const selectedSetId = Number(params.set) || null;
  const selectedStudentId = Number(params.student) || null;

  const questionSets = await prisma.questionSet.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      questions: { orderBy: { order: "asc" } },
      sessions: {
        include: {
          submissions: {
            include: {
              student: true,
              answers: { include: { question: true } },
            },
          },
        },
      },
    },
  });

  const filteredSets = questionSets.filter((set) => {
    if (!query) return true;
    return [set.title, set.description, set.module, set.setType].some((value) => value.toLowerCase().includes(query));
  });

  const selectedSet = selectedSetId ? questionSets.find((set) => set.id === selectedSetId) : null;
  const selectedSubmissions = selectedSet
    ? selectedSet.sessions
        .flatMap((session) => session.submissions)
        .sort((a, b) => a.score / Math.max(a.total, 1) - b.score / Math.max(b.total, 1))
    : [];
  const selectedStudentSubmission = selectedStudentId
    ? selectedSubmissions.find((submission) => submission.studentId === selectedStudentId)
    : null;

  return (
    <AdminShell username={user.username} title="Results" subtitle="Pick a set first, then inspect patterns and individual mistakes.">
      <form action="/admin/results" className="mb-6 grid gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-[1fr_auto]">
        {selectedSetId ? <input type="hidden" name="set" value={selectedSetId} /> : null}
        <input
          name="q"
          defaultValue={params.q ?? ""}
          className="rounded-xl border border-slate-200 px-3 py-2"
          placeholder="Search sets by title, module, type, or description"
        />
        <button className="rounded-xl bg-blue-700 px-5 py-2 font-black text-white">Search</button>
      </form>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredSets.map((set) => {
          const submissions = set.sessions.flatMap((session) => session.submissions);
          const average = submissions.length
            ? Math.round((submissions.reduce((sum, submission) => sum + submission.score / Math.max(submission.total, 1), 0) / submissions.length) * 100)
            : 0;
          const selected = selectedSetId === set.id;
          return (
            <Link
              key={set.id}
              href={`/admin/results?set=${set.id}${params.q ? `&q=${encodeURIComponent(params.q)}` : ""}`}
              className={`rounded-2xl border p-5 shadow-sm hover:bg-blue-50 ${selected ? "border-blue-500 bg-blue-50" : "border-slate-200 bg-white"}`}
            >
              <p className="text-sm font-black text-blue-700">{set.module.toUpperCase()} / {set.setType.replace("_", " ")}</p>
              <h2 className="mt-1 text-xl font-black text-slate-950">{set.title}</h2>
              <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
                <Metric label="Questions" value={set.questions.length} />
                <Metric label="Results" value={submissions.length} />
                <Metric label="Avg" value={submissions.length ? `${average}%` : "-"} />
              </div>
            </Link>
          );
        })}
        {filteredSets.length === 0 ? <p className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-500">No matching sets.</p> : null}
      </section>

      {selectedSet ? (
        <SelectedSetResults
          set={selectedSet}
          submissions={selectedSubmissions}
          selectedStudentId={selectedStudentId}
          selectedStudentSubmission={selectedStudentSubmission ?? null}
          query={params.q ?? ""}
        />
      ) : (
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 text-slate-600">
          Select a set card to open detailed results.
        </section>
      )}
    </AdminShell>
  );
}

function SelectedSetResults({
  set,
  submissions,
  selectedStudentId,
  selectedStudentSubmission,
  query,
}: {
  set: ResultSet;
  submissions: ResultSubmission[];
  selectedStudentId: number | null;
  selectedStudentSubmission: ResultSubmission | null;
  query: string;
}) {
  const allAnswers = submissions.flatMap((submission) => submission.answers);
  const average = submissions.length
    ? Math.round((submissions.reduce((sum, submission) => sum + submission.score / Math.max(submission.total, 1), 0) / submissions.length) * 100)
    : 0;
  const lowScores = submissions.filter((submission) => submission.score / Math.max(submission.total, 1) < 0.7).length;
  const difficulty = difficultyStatsFromAnswers(allAnswers);
  const weakTopics = weakTopicsFromAnswers(allAnswers);
  const questionStats = set.questions
    .map((question, index) => {
      const answers = allAnswers.filter((answer) => answer.question.id === question.id);
      const correct = answers.filter((answer) => answer.isCorrect).length;
      return {
        question,
        questionNumber: question.order || index + 1,
        attempts: answers.length,
        correct,
        missed: answers.length - correct,
        correctRate: answers.length ? correct / answers.length : 0,
      };
    })
    .sort((a, b) => b.missed - a.missed || a.correctRate - b.correctRate || a.questionNumber - b.questionNumber);

  const selectedMisses = selectedStudentSubmission?.answers.filter((answer) => !answer.isCorrect) ?? [];

  return (
    <section className="mt-8 space-y-6">
      <div className="rounded-2xl border border-blue-200 bg-blue-50 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-black text-blue-700">Selected set</p>
            <h2 className="mt-1 text-2xl font-black text-blue-950">{set.title}</h2>
            <p className="mt-1 text-sm text-slate-600">{set.module.toUpperCase()} / {set.setType.replace("_", " ")} / {set.questions.length} questions</p>
          </div>
          <Link href="/admin/question-sets" className="rounded-xl border border-blue-200 bg-white px-4 py-2 text-sm font-black text-blue-700">
            Edit question sets
          </Link>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-5">
          <Metric label="Submissions" value={submissions.length} />
          <Metric label="Average" value={submissions.length ? `${average}%` : "-"} />
          <Metric label="Under 70%" value={lowScores} />
          <Metric label="Hard" value={`${difficulty.hard.correct}/${difficulty.hard.total}`} />
          <Metric label="Weak topics" value={weakTopics.length} />
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-xl font-black text-slate-950">Question misses</h3>
          <p className="mt-1 text-sm text-slate-500">Question number - students incorrect</p>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {questionStats.map((item) => (
              <div key={item.question.id} className={`rounded-xl border px-4 py-3 text-center ${item.missed ? "border-red-200 bg-red-50 text-red-800" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}>
                <span className="text-lg font-black">{item.questionNumber} - {item.missed}</span>
              </div>
            ))}
            {questionStats.length === 0 ? <p className="text-sm text-slate-500">No questions in this set.</p> : null}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-xl font-black text-slate-950">Topic pattern</h3>
          <div className="mt-4 flex flex-wrap gap-2">
            {weakTopics.slice(0, 8).map((topic) => (
              <span key={topic.topic} className="rounded-lg bg-red-50 px-3 py-2 text-sm font-bold text-red-700">
                {topic.topic}: {topic.misses}/{topic.attempts}
              </span>
            ))}
            {weakTopics.length === 0 ? <p className="text-sm text-slate-500">No weak topic pattern yet.</p> : null}
          </div>
          <div className="mt-5 grid grid-cols-3 gap-2 text-sm">
            <Metric label="Easy" value={`${difficulty.easy.correct}/${difficulty.easy.total}`} />
            <Metric label="Mid" value={`${difficulty.mid.correct}/${difficulty.mid.total}`} />
            <Metric label="Hard" value={`${difficulty.hard.correct}/${difficulty.hard.total}`} />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-5">
          <h3 className="text-xl font-black text-slate-950">Student results, lowest to highest</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-700">
              <tr>
                <th className="p-4">Student</th>
                <th className="p-4">Score</th>
                <th className="p-4">Difficulty</th>
                <th className="p-4">Missed topics</th>
                <th className="p-4">Submitted</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((submission) => {
                const byDifficulty = difficultyStatsFromAnswers(submission.answers);
                const weak = weakTopicsFromAnswers(submission.answers);
                return (
                  <tr key={submission.id} className={`border-t border-slate-100 ${selectedStudentId === submission.studentId ? "bg-blue-50" : ""}`}>
                    <td className="p-4">
                      <Link
                        href={`/admin/results?set=${set.id}&student=${submission.studentId}${query ? `&q=${encodeURIComponent(query)}` : ""}`}
                        className="font-black text-blue-700 hover:underline"
                      >
                        {submission.student.name || submission.student.username}
                      </Link>
                    </td>
                    <td className="p-4 font-black">{submission.score}/{submission.total}</td>
                    <td className="p-4">easy {byDifficulty.easy.correct}/{byDifficulty.easy.total}, mid {byDifficulty.mid.correct}/{byDifficulty.mid.total}, hard {byDifficulty.hard.correct}/{byDifficulty.hard.total}</td>
                    <td className="p-4">{weak.map((item) => item.topic).join(", ") || "None"}</td>
                    <td className="p-4">{formatDate(submission.submittedAt)}</td>
                  </tr>
                );
              })}
              {submissions.length === 0 ? <tr><td colSpan={5} className="p-5 text-slate-500">No submissions for this set yet.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </div>

      {selectedStudentSubmission ? (
        <div className="rounded-2xl border border-red-200 bg-white p-5 shadow-sm">
          <h3 className="text-xl font-black text-red-700">
            Incorrect answers: {selectedStudentSubmission.student.name || selectedStudentSubmission.student.username}
          </h3>
          <div className="mt-4 space-y-4">
            {selectedMisses.map((answer) => (
              <article key={answer.question.id} className="rounded-xl border border-red-100 bg-red-50 p-4">
                <p className="font-black text-red-950">{answer.question.text}</p>
                <p className="mt-2 text-sm text-red-800">Difficulty: {answer.question.difficulty}</p>
                <p className="mt-1 text-sm text-red-800">Student answer: {answer.response || "blank"}</p>
                <p className="mt-1 text-sm font-black text-emerald-700">Correct answer: {answer.question.correctAnswer}</p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  {parseJsonList(answer.question.choices).map((choice) => (
                    <span key={choice} className={`rounded-full px-3 py-1 font-bold ${choice === answer.question.correctAnswer ? "bg-emerald-100 text-emerald-800" : "bg-white text-slate-700"}`}>
                      {choice}
                    </span>
                  ))}
                  {parseJsonList(answer.question.topicTags).map((tag) => (
                    <span key={tag} className="rounded-full bg-blue-100 px-3 py-1 font-bold text-blue-800">{tag}</span>
                  ))}
                </div>
              </article>
            ))}
            {selectedMisses.length === 0 ? <p className="rounded-xl bg-emerald-50 p-4 text-emerald-800">No incorrect answers for this submission.</p> : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-blue-100 bg-white px-3 py-3">
      <p className="text-xs font-bold uppercase text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-black text-blue-950">{value}</p>
    </div>
  );
}
