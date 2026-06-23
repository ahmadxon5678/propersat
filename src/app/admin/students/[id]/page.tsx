import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/AdminShell";
import { requireUser } from "@/lib/auth";
import { difficultyStatsFromAnswers, nextFocus, weakTopicsFromAnswers } from "@/lib/analytics";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/format";

export default async function AdminStudentProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const admin = await requireUser("admin");
  const { id } = await params;
  const student = await prisma.user.findFirst({
    where: { id: Number(id), role: "student" },
    include: {
      submissions: {
        orderBy: { submittedAt: "desc" },
        include: {
          liveSession: { include: { questionSet: true } },
          answers: { include: { question: true } },
        },
      },
      vocabAttempts: {
        orderBy: { attemptedAt: "desc" },
        include: { vocabItem: true },
      },
      strugglePoints: { where: { resolved: false }, orderBy: { createdAt: "desc" } },
    },
  });

  if (!student) redirect("/admin");

  const weak = weakTopicsFromAnswers(student.submissions.flatMap((submission) => submission.answers));
  const average =
    student.submissions.length === 0
      ? 0
      : Math.round(
          (student.submissions.reduce((sum, submission) => sum + submission.score / Math.max(submission.total, 1), 0) /
            student.submissions.length) *
            100,
        );
  const vocabCorrect = student.vocabAttempts.filter((attempt) => attempt.isCorrect).length;
  const vocabRate = student.vocabAttempts.length ? Math.round((vocabCorrect / student.vocabAttempts.length) * 100) : 0;

  return (
    <AdminShell username={admin.username} title={student.name || student.username} subtitle={`Student profile / @${student.username}`}>
      <div className="max-w-6xl space-y-6">
        <Link href="/admin" className="text-sm font-semibold text-blue-800 hover:underline">Back to admin</Link>
        <section className="rounded-2xl bg-blue-950 p-6 text-white">
          <p className="text-sm uppercase text-blue-200">Student profile</p>
          <h1 className="mt-1 text-3xl font-bold">{student.name || student.username}</h1>
          <p className="mt-2 text-blue-100">@{student.username}</p>
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          <Stat label="Math tests" value={student.submissions.length} />
          <Stat label="Average" value={student.submissions.length ? `${average}%` : "No tests"} />
          <Stat label="Vocab attempts" value={student.vocabAttempts.length} />
          <Stat label="Vocab accuracy" value={student.vocabAttempts.length ? `${vocabRate}%` : "No vocab"} />
        </section>

        <section className="grid gap-4 lg:grid-cols-[1fr_1fr]">
          <div className="app-card p-5">
            <h2 className="text-xl font-bold text-blue-950">Weakness summary</h2>
            <p className="mt-2 text-slate-700">{nextFocus(weak)}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {weak.length ? (
                weak.map((item) => (
                  <span key={item.topic} className="rounded-lg bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-900">
                    {item.topic}: {item.misses}/{item.attempts}
                  </span>
                ))
              ) : (
                <span className="text-sm text-slate-600">No weak topics yet.</span>
              )}
            </div>
          </div>

          <div className="app-card border-red-200 p-5">
            <h2 className="text-xl font-bold text-red-700">Struggle points</h2>
            <div className="mt-4 space-y-3">
              {student.strugglePoints.length ? (
                student.strugglePoints.map((point) => (
                  <div key={point.id} className="rounded-lg bg-red-50 p-3 text-red-900">
                    <p className="font-bold">{point.topic}</p>
                    <p className="text-sm">{point.notes || "Needs teacher review after retest."}</p>
                    <p className="text-xs text-red-700">{formatDate(point.createdAt)}</p>
                  </div>
                ))
              ) : (
                <p className="rounded-lg bg-emerald-50 p-3 text-emerald-800">No unresolved struggle points.</p>
              )}
            </div>
          </div>
        </section>

        <section className="app-card overflow-x-auto">
          <div className="border-b border-blue-100 p-5">
            <h2 className="text-xl font-bold text-blue-950">Recent math results</h2>
          </div>
          <table className="w-full text-left text-sm">
            <thead className="bg-blue-50 text-blue-950">
              <tr>
                <th className="p-3">Set</th>
                <th className="p-3">Type</th>
                <th className="p-3">Score</th>
                <th className="p-3">Difficulty</th>
                <th className="p-3">Missed topics</th>
                <th className="p-3">Submitted</th>
              </tr>
            </thead>
            <tbody>
              {student.submissions.map((submission) => {
                const submissionWeak = weakTopicsFromAnswers(submission.answers);
                const byDifficulty = difficultyStatsFromAnswers(submission.answers);
                return (
                  <tr key={submission.id} className="border-t border-blue-100">
                    <td className="p-3 font-semibold">{submission.liveSession.questionSet.title}</td>
                    <td className="p-3">{submission.liveSession.questionSet.setType.replace("_", " ")}</td>
                    <td className="p-3">{submission.score}/{submission.total}</td>
                    <td className="p-3">
                      easy {byDifficulty.easy.correct}/{byDifficulty.easy.total}, mid {byDifficulty.mid.correct}/{byDifficulty.mid.total}, hard {byDifficulty.hard.correct}/{byDifficulty.hard.total}
                    </td>
                    <td className="p-3">{submissionWeak.map((item) => item.topic).join(", ") || "None"}</td>
                    <td className="p-3">{formatDate(submission.submittedAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>

        <section className="app-card p-5">
          <h2 className="text-xl font-bold text-blue-950">Recent vocabulary</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {student.vocabAttempts.slice(0, 12).map((attempt) => (
              <div key={attempt.id} className="rounded-lg border border-blue-100 p-3 text-sm">
                <p className="font-semibold">{attempt.vocabItem.definition}</p>
                <p className="text-slate-600">Typed: {attempt.response}</p>
                <p className={attempt.isCorrect ? "text-emerald-700" : "text-red-700"}>{attempt.isCorrect ? "Correct" : "Incorrect"}</p>
              </div>
            ))}
            {student.vocabAttempts.length === 0 ? <p className="text-sm text-slate-600">No vocabulary attempts yet.</p> : null}
          </div>
        </section>
      </div>
    </AdminShell>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="app-card p-4">
      <p className="text-sm text-slate-600">{label}</p>
      <p className="mt-1 text-2xl font-bold text-blue-950">{value}</p>
    </div>
  );
}
