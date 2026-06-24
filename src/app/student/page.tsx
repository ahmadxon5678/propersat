import Link from "next/link";
import type React from "react";
import { BarChart3, BookOpen, FileText, Layers } from "lucide-react";
import { StartSetForm } from "@/components/StartSetForm";
import { StudentAccountForm } from "@/components/StudentAccountForm";
import { StudentShell } from "@/components/StudentShell";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/format";

export default async function StudentPage() {
  const user = await requireUser("student");
  const [availableSessions, recentSubmissions, recentVocabSets] = await Promise.all([
    prisma.liveSession.findMany({
      where: {
        status: "ACTIVE",
        assigned: { some: { studentId: user.id } },
        submissions: { none: { studentId: user.id } },
      },
      include: { questionSet: { include: { questions: true } } },
      orderBy: { startedAt: "desc" },
    }),
    prisma.submission.findMany({
      where: { studentId: user.id },
      include: { liveSession: { include: { questionSet: true } } },
      orderBy: { submittedAt: "desc" },
      take: 5,
    }),
    prisma.vocabSet.findMany({
      where: {
        active: true,
        items: { some: {} },
        OR: [{ isOfficial: true }, { visibility: "public" }, { ownerId: user.id }],
      },
      include: { items: true },
      orderBy: { updatedAt: "desc" },
      take: 3,
    }),
  ]);

  return (
    <StudentShell username={user.username} title="Dashboard" subtitle="Your SAT practice home.">
      <div className="space-y-8">
        <section className="rounded-2xl bg-blue-950 p-6 text-white">
          <p className="text-sm font-black uppercase text-blue-200">Student dashboard</p>
          <h2 className="mt-1 text-3xl font-black">Practice, review, improve</h2>
          <p className="mt-2 max-w-2xl text-blue-100">Jump into assigned tests, topical work, past papers, vocabulary, or your analytics without crowding this page.</p>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <QuickLink href="/student/topical" title="Topical Questions" detail="Focused practice sets" icon={<Layers className="h-5 w-5" />} />
          <QuickLink href="/student/past-papers" title="Past Papers" detail="Full SAT-style modules" icon={<FileText className="h-5 w-5" />} />
          <QuickLink href="/student/vocabulary" title="Vocabulary" detail="Build and practice sets" icon={<BookOpen className="h-5 w-5" />} />
          <QuickLink href="/student/analytics" title="My Analytics" detail="Scores and weak topics" icon={<BarChart3 className="h-5 w-5" />} />
        </section>

        {availableSessions.length ? (
          <section className="space-y-4">
            <h2 className="text-2xl font-black text-blue-950">Live tests opened for you</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {availableSessions.map((session) => {
                const locked = session.questionSet.visibility === "secret" || session.questionSet.hidden || session.questionSet.setType === "retest";
                return (
                  <article key={session.id} className="app-card border-emerald-200 p-5">
                    <p className="text-sm font-black text-emerald-700">Live now</p>
                    <h3 className="mt-1 text-xl font-black text-blue-950">{session.questionSet.title}</h3>
                    <p className="mt-2 text-sm text-slate-600">{session.questionSet.questions.length} questions / {session.questionSet.durationMinutes} min</p>
                    <StartSetForm questionSetId={session.questionSet.id} locked={locked} />
                  </article>
                );
              })}
            </div>
          </section>
        ) : null}

        <section className="grid gap-6 xl:grid-cols-[1fr_0.8fr]">
          <div className="app-card overflow-hidden">
            <div className="border-b border-blue-100 p-5">
              <h2 className="text-xl font-black text-blue-950">Recent results</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-blue-50 text-blue-950">
                  <tr>
                    <th className="p-3">Set</th>
                    <th className="p-3">Score</th>
                    <th className="p-3">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentSubmissions.map((submission) => (
                    <tr key={submission.id} className="border-t border-blue-100">
                      <td className="p-3 font-bold">{submission.liveSession.questionSet.title}</td>
                      <td className="p-3">{submission.score}/{submission.total}</td>
                      <td className="p-3">{formatDate(submission.submittedAt)}</td>
                    </tr>
                  ))}
                  {recentSubmissions.length === 0 ? <tr><td colSpan={3} className="p-4 text-slate-600">No submitted tests yet.</td></tr> : null}
                </tbody>
              </table>
            </div>
          </div>

          <div className="app-card p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-black text-blue-950">Continue vocabulary</h2>
              <Link href="/student/vocabulary" className="text-sm font-black text-blue-700 hover:underline">Open all</Link>
            </div>
            <div className="mt-4 space-y-3">
              {recentVocabSets.map((set) => (
                <Link key={set.id} href={`/student/vocabulary?set=${set.id}`} className="block rounded-xl border border-blue-100 p-4 hover:bg-blue-50">
                  <p className="font-black text-blue-950">{set.title}</p>
                  <p className="mt-1 text-sm text-slate-600">{set.items.length} words</p>
                </Link>
              ))}
              {recentVocabSets.length === 0 ? <p className="text-sm text-slate-600">No vocabulary sets yet.</p> : null}
            </div>
          </div>
        </section>

        <StudentAccountForm username={user.username} />
      </div>
    </StudentShell>
  );
}

function QuickLink({ href, title, detail, icon }: { href: string; title: string; detail: string; icon: React.ReactNode }) {
  return (
    <Link href={href} className="app-card p-5 hover:bg-blue-50">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700">{icon}</div>
      <p className="mt-4 text-lg font-black text-blue-950">{title}</p>
      <p className="mt-1 text-sm text-slate-600">{detail}</p>
    </Link>
  );
}
