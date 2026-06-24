import Link from "next/link";
import { StudentShell } from "@/components/StudentShell";
import { difficultyStatsFromAnswers, weakTopicsFromAnswers } from "@/lib/analytics";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatDate, parseJsonList } from "@/lib/format";

export default async function StudentAnalyticsPage({ searchParams }: { searchParams: Promise<{ set?: string }> }) {
  const user = await requireUser("student");
  const params = await searchParams;
  const selectedSetId = Number(params.set) || null;
  const submissions = await prisma.submission.findMany({
    where: { studentId: user.id },
    include: {
      liveSession: { include: { questionSet: true } },
      answers: { include: { question: true } },
    },
    orderBy: { submittedAt: "desc" },
  });

  const allAnswers = submissions.flatMap((submission) => submission.answers);
  const missedAnswers = allAnswers.filter((answer) => !answer.isCorrect);
  const average = submissions.length ? Math.round((submissions.reduce((sum, submission) => sum + submission.score / Math.max(submission.total, 1), 0) / submissions.length) * 100) : 0;
  const best = submissions.length ? Math.max(...submissions.map((submission) => Math.round((submission.score / Math.max(submission.total, 1)) * 100))) : 0;
  const weakTopics = weakTopicsFromAnswers(allAnswers);
  const setIds = [...new Set(submissions.map((submission) => submission.liveSession.questionSet.id))];
  const selectedSet = selectedSetId ? submissions.find((submission) => submission.liveSession.questionSet.id === selectedSetId)?.liveSession.questionSet : submissions[0]?.liveSession.questionSet;
  const selectedSubmissions = selectedSet ? submissions.filter((submission) => submission.liveSession.questionSet.id === selectedSet.id) : [];
  const selectedAnswers = selectedSubmissions.flatMap((submission) => submission.answers);
  const selectedDifficulty = difficultyStatsFromAnswers(selectedAnswers);
  const selectedMissed = selectedAnswers.filter((answer) => !answer.isCorrect);
  const selectedWeakTopics = weakTopicsFromAnswers(selectedAnswers);
  const latest = selectedSubmissions[0];
  const selectedAverage = selectedSubmissions.length ? Math.round((selectedSubmissions.reduce((sum, submission) => sum + submission.score / Math.max(submission.total, 1), 0) / selectedSubmissions.length) * 100) : 0;
  const selectedBest = selectedSubmissions.length ? Math.max(...selectedSubmissions.map((submission) => Math.round((submission.score / Math.max(submission.total, 1)) * 100))) : 0;

  return (
    <StudentShell username={user.username} title="My Analytics" subtitle="Free performance analytics based only on your own submissions.">
      {submissions.length === 0 ? (
        <section className="app-card p-6 text-slate-600">No analytics yet. Complete a question set to see your results.</section>
      ) : (
        <div className="space-y-6">
          <section className="grid gap-3 md:grid-cols-5">
            <Metric label="Completed sets" value={submissions.length} />
            <Metric label="Average" value={`${average}%`} />
            <Metric label="Best" value={`${best}%`} />
            <Metric label="Attempted" value={allAnswers.length} />
            <Metric label="Missed" value={missedAnswers.length} />
          </section>

          <section className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
            <div className="app-card overflow-hidden">
              <div className="border-b border-blue-100 p-5">
                <h2 className="text-xl font-black text-blue-950">Recent attempts</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-blue-50 text-blue-950">
                    <tr>
                      <th className="p-3">Set</th>
                      <th className="p-3">Score</th>
                      <th className="p-3">Subject</th>
                      <th className="p-3">Submitted</th>
                      <th className="p-3">Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submissions.slice(0, 12).map((submission) => {
                      const percent = Math.round((submission.score / Math.max(submission.total, 1)) * 100);
                      return (
                        <tr key={submission.id} className="border-t border-blue-100">
                          <td className="p-3 font-bold">{submission.liveSession.questionSet.title}</td>
                          <td className="p-3">{submission.score}/{submission.total} ({percent}%)</td>
                          <td className="p-3">{submission.liveSession.questionSet.module.toUpperCase()} / {submission.liveSession.questionSet.setType.replace("_", " ")}</td>
                          <td className="p-3">{formatDate(submission.submittedAt)}</td>
                          <td className="p-3">
                            <Link href={`/student/analytics?set=${submission.liveSession.questionSet.id}`} className="font-black text-blue-700 hover:underline">View</Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="app-card p-5">
              <h2 className="text-xl font-black text-blue-950">Topic weakness</h2>
              <div className="mt-4 space-y-2">
                {weakTopics.slice(0, 8).map((topic) => (
                  <div key={topic.topic} className="rounded-xl border border-red-100 bg-red-50 p-3 text-sm">
                    <p className="font-black text-red-800">{topic.topic}</p>
                    <p className="text-red-700">{topic.misses}/{topic.attempts} missed ({Math.round(topic.missRate * 100)}%)</p>
                  </div>
                ))}
                {weakTopics.length === 0 ? <p className="text-sm text-slate-600">No weak topic pattern yet.</p> : null}
              </div>
            </div>
          </section>

          {selectedSet ? (
            <section className="space-y-4 rounded-2xl border border-blue-200 bg-blue-50 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-black text-blue-700">Per-question-set analytics</p>
                  <h2 className="text-2xl font-black text-blue-950">{selectedSet.title}</h2>
                </div>
                <form action="/student/analytics">
                  <select name="set" defaultValue={selectedSet.id} className="rounded-xl border border-blue-200 px-3 py-2">
                    {setIds.map((setId) => {
                      const set = submissions.find((submission) => submission.liveSession.questionSet.id === setId)?.liveSession.questionSet;
                      return set ? <option key={set.id} value={set.id}>{set.title}</option> : null;
                    })}
                  </select>
                  <button className="ml-2 rounded-xl bg-blue-700 px-4 py-2 text-sm font-black text-white">Open</button>
                </form>
              </div>

              <div className="grid gap-3 md:grid-cols-5">
                <Metric label="Latest" value={latest ? `${Math.round((latest.score / Math.max(latest.total, 1)) * 100)}%` : "-"} />
                <Metric label="Best" value={`${selectedBest}%`} />
                <Metric label="Average" value={`${selectedAverage}%`} />
                <Metric label="Attempts" value={selectedSubmissions.length} />
                <Metric label="Most missed" value={selectedWeakTopics[0]?.topic ?? "None"} />
              </div>

              <div className="grid gap-6 xl:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <h3 className="text-lg font-black text-blue-950">Mistakes</h3>
                  <div className="mt-4 space-y-3">
                    {selectedMissed.map((answer) => (
                      <article key={`${answer.submissionId}-${answer.questionId}`} className="rounded-xl border border-red-100 bg-red-50 p-3 text-sm">
                        <p className="font-black text-red-900">Q{answer.question.order || answer.questionId}</p>
                        <p className="mt-1 text-red-800">Your answer: {answer.response || "blank"}</p>
                        <p className="text-emerald-700">Correct: {answer.question.correctAnswer}</p>
                        <p className="mt-1 text-slate-600">Topics: {parseJsonList(answer.question.topicTags).join(", ") || "none"}</p>
                      </article>
                    ))}
                    {selectedMissed.length === 0 ? <p className="text-sm text-slate-600">No missed questions for this set.</p> : null}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <h3 className="text-lg font-black text-blue-950">Difficulty breakdown</h3>
                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    <Metric label="Easy" value={`${selectedDifficulty.easy.correct}/${selectedDifficulty.easy.total}`} />
                    <Metric label="Mid" value={`${selectedDifficulty.mid.correct}/${selectedDifficulty.mid.total}`} />
                    <Metric label="Hard" value={`${selectedDifficulty.hard.correct}/${selectedDifficulty.hard.total}`} />
                  </div>
                  <h3 className="mt-6 text-lg font-black text-blue-950">Missed topics</h3>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {selectedWeakTopics.map((topic) => <span key={topic.topic} className="rounded-lg bg-red-50 px-3 py-2 text-sm font-bold text-red-700">{topic.topic}: {topic.misses}</span>)}
                    {selectedWeakTopics.length === 0 ? <p className="text-sm text-slate-600">No missed topics.</p> : null}
                  </div>
                </div>
              </div>
            </section>
          ) : null}
        </div>
      )}
    </StudentShell>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-blue-100 bg-white px-4 py-3">
      <p className="text-xs font-bold uppercase text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-black text-blue-950">{value}</p>
    </div>
  );
}
