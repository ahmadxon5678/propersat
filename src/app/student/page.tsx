import Link from "next/link";
import { Header } from "@/components/Header";
import { StartSetForm } from "@/components/StartSetForm";
import { StudentAccountForm } from "@/components/StudentAccountForm";
import { difficultyStatsFromAnswers } from "@/lib/analytics";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/format";

export default async function StudentPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const user = await requireUser("student");
  const params = await searchParams;
  const query = String(params.q ?? "").trim().toLowerCase();
  const [availableSessions, questionSets, submissions, vocabSets, vocabAttempts] = await Promise.all([
    prisma.liveSession.findMany({
      where: {
        status: "ACTIVE",
        assigned: { some: { studentId: user.id } },
        submissions: { none: { studentId: user.id } },
      },
      include: { questionSet: { include: { questions: true } } },
      orderBy: { startedAt: "desc" },
    }),
    prisma.questionSet.findMany({
      where: {
        active: true,
        questions: { some: {} },
      },
      include: { questions: true },
      orderBy: [{ setType: "asc" }, { createdAt: "desc" }],
    }),
    prisma.submission.findMany({
      where: { studentId: user.id },
      include: {
        liveSession: { include: { questionSet: true } },
        answers: { include: { question: true } },
      },
      orderBy: { submittedAt: "desc" },
    }),
    prisma.vocabSet.findMany({
      where: { active: true, items: { some: {} } },
      include: { items: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.vocabAttempt.findMany({
      where: { studentId: user.id },
      include: { vocabItem: true },
      orderBy: { attemptedAt: "desc" },
      take: 8,
    }),
  ]);
  const filteredQuestionSets = questionSets.filter((set) => {
    if (!query) return true;
    return [set.title, set.description, set.module, set.setType].some((value) => value.toLowerCase().includes(query));
  });

  return (
    <div className="min-h-screen">
      <Header role="Student" username={user.username} />
      <main className="mx-auto max-w-6xl space-y-8 px-6 py-6">
        <section className="rounded-2xl bg-blue-950 p-6 text-white">
          <p className="text-sm uppercase text-blue-200">Student dashboard</p>
          <h1 className="mt-1 text-3xl font-bold">Practice, test, improve</h1>
          <p className="mt-2 text-blue-100">Use vocab anytime. Public sets are open; secret/retest sets need your teacher&apos;s access code.</p>
        </section>

        {availableSessions.length ? (
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-blue-950">Live tests opened for you</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {availableSessions.map((session) => (
                <article key={session.id} className="app-card border-emerald-200 p-5">
                  <p className="text-sm font-bold text-emerald-700">Live now</p>
                  <h3 className="mt-1 text-xl font-bold text-blue-950">{session.questionSet.title}</h3>
                  <p className="mt-2 text-sm text-slate-600">{session.questionSet.questions.length} questions / {session.questionSet.durationMinutes} min</p>
                  <Link href={`/student/test/${session.id}`} className="btn-primary mt-4 inline-block px-4 py-2 text-sm">
                    Start live test
                  </Link>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        <section className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-2xl font-bold text-blue-950">Vocabulary</h2>
            <Link href="/student/vocab" className="btn-primary px-4 py-2 text-sm">
              Practice all vocab
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {vocabSets.map((set) => (
              <Link key={set.id} href={`/student/vocab?set=${set.id}`} className="app-card p-5 hover:bg-blue-50">
                <p className="text-lg font-bold text-blue-950">{set.title}</p>
                <p className="mt-2 text-sm text-slate-600">{set.items.length} words</p>
              </Link>
            ))}
            {vocabSets.length === 0 ? <p className="app-card p-5 text-slate-700">No vocabulary sets yet.</p> : null}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-blue-950">Practice and exams</h2>
          <form action="/student" className="grid gap-3 rounded-xl border border-blue-100 bg-white p-4 md:grid-cols-[1fr_auto]">
            <input
              name="q"
              defaultValue={params.q ?? ""}
              className="rounded-lg border border-blue-200 px-3 py-2"
              placeholder="Search tests by title, module, type, or description"
            />
            <button className="btn-primary px-4 py-2">Search</button>
          </form>
          <div className="grid gap-4 lg:grid-cols-3">
            {filteredQuestionSets.map((set) => {
              const locked = set.visibility === "secret" || set.hidden || set.setType === "retest";
              return (
                <article key={set.id} className={`app-card p-5 ${locked ? "border-amber-200" : ""}`}>
                  <p className={`text-sm font-bold ${locked ? "text-amber-700" : "text-blue-700"}`}>
                    {set.module.toUpperCase()} / {set.setType.replace("_", " ")} / {locked ? "Password required" : "Public"}
                  </p>
                  <h3 className="mt-1 text-xl font-bold text-blue-950">{set.title}</h3>
                  <p className="mt-2 text-sm text-slate-600">{set.description}</p>
                  <p className="mt-3 text-sm font-semibold text-slate-700">
                    {set.questions.length} questions / {set.durationMinutes} minutes
                  </p>
                  <StartSetForm questionSetId={set.id} locked={locked} />
                </article>
              );
            })}
            {filteredQuestionSets.length === 0 ? <p className="app-card p-5 text-slate-700">No matching practice sets.</p> : null}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
          <div className="app-card overflow-x-auto">
            <div className="border-b border-blue-100 p-5">
              <h2 className="text-xl font-bold text-blue-950">Past results</h2>
            </div>
            <table className="w-full text-left text-sm">
              <thead className="bg-blue-50 text-blue-950">
                <tr>
                  <th className="p-3">Test</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Score</th>
                  <th className="p-3">Difficulty</th>
                  <th className="p-3">Submitted</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((submission) => {
                  const byDifficulty = difficultyStatsFromAnswers(submission.answers);
                  return (
                    <tr key={submission.id} className="border-t border-blue-100">
                      <td className="p-3 font-semibold">{submission.liveSession.questionSet.title}</td>
                      <td className="p-3">{submission.liveSession.questionSet.setType.replace("_", " ")}</td>
                      <td className="p-3">{submission.score}/{submission.total}</td>
                      <td className="p-3">
                        easy {byDifficulty.easy.correct}/{byDifficulty.easy.total}, mid {byDifficulty.mid.correct}/{byDifficulty.mid.total}, hard {byDifficulty.hard.correct}/{byDifficulty.hard.total}
                      </td>
                      <td className="p-3">{formatDate(submission.submittedAt)}</td>
                    </tr>
                  );
                })}
                {submissions.length === 0 ? (
                  <tr><td className="p-3 text-slate-600" colSpan={5}>No submitted tests yet.</td></tr>
                ) : null}
              </tbody>
            </table>
          </div>

          <div className="app-card p-5">
            <h2 className="text-xl font-bold text-blue-950">Recent vocabulary</h2>
            <div className="mt-4 space-y-3">
              {vocabAttempts.map((attempt) => (
                <div key={attempt.id} className="rounded-lg border border-blue-100 p-3 text-sm">
                  <p className="font-semibold">{attempt.vocabItem.definition}</p>
                  <p className="text-slate-600">You typed: {attempt.response}</p>
                  <p className={attempt.isCorrect ? "text-emerald-700" : "text-red-700"}>
                    {attempt.isCorrect ? "Correct" : "Incorrect"}
                  </p>
                </div>
              ))}
              {vocabAttempts.length === 0 ? <p className="text-sm text-slate-600">No vocabulary attempts yet.</p> : null}
            </div>
          </div>
        </section>

        <StudentAccountForm username={user.username} />
      </main>
    </div>
  );
}
