import Link from "next/link";
import { AlertTriangle, BookOpen, CheckCircle2, ClipboardCheck, FileQuestion, Target, Users } from "lucide-react";
import { AdminShell, AdminStatCard } from "@/components/AdminShell";
import { requireUser } from "@/lib/auth";
import { buildStudentAlerts, RETEST_THRESHOLD } from "@/lib/admin";
import { prisma } from "@/lib/db";

export default async function AdminDashboardPage() {
  const user = await requireUser("admin");
  const [students, questionSets, submissions, vocabAttempts, activeVocabSets] = await Promise.all([
    prisma.user.findMany({
      where: { role: "student" },
      orderBy: { username: "asc" },
      include: {
        submissions: {
          include: {
            liveSession: { include: { questionSet: true } },
            answers: { include: { question: true } },
          },
        },
        strugglePoints: { where: { resolved: false } },
      },
    }),
    prisma.questionSet.findMany({ include: { questions: true } }),
    prisma.submission.findMany(),
    prisma.vocabAttempt.count(),
    prisma.vocabSet.count({ where: { active: true } }),
  ]);

  const activeSets = questionSets.filter((set) => set.active).length + activeVocabSets;
  const averageScore = submissions.length
    ? Math.round((submissions.reduce((sum, submission) => sum + submission.score / Math.max(submission.total, 1), 0) / submissions.length) * 100)
    : 0;
  const alerts = buildStudentAlerts(students);
  const lowScores = submissions.filter((submission) => submission.score / Math.max(submission.total, 1) < RETEST_THRESHOLD).length;
  const hasContent = questionSets.length > 0 || activeVocabSets > 0;

  return (
    <AdminShell username={user.username} title="Umumiy ko'rinish" subtitle="Learning stats, urgent student alerts, and setup progress.">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <AdminStatCard label="Students" value={students.length} icon={<Users className="h-5 w-5" />} />
        <AdminStatCard label="Active sets" value={activeSets} icon={<BookOpen className="h-5 w-5" />} />
        <AdminStatCard label="Completed tests" value={submissions.length} icon={<ClipboardCheck className="h-5 w-5" />} />
        <AdminStatCard label="Avg score" value={submissions.length ? `${averageScore}%` : "0%"} icon={<Target className="h-5 w-5" />} />
        <AdminStatCard label="Retakes needed" value={alerts.length} tone={alerts.length ? "red" : "green"} icon={<AlertTriangle className="h-5 w-5" />} />
        <AdminStatCard label="Vocab attempts" value={vocabAttempts} tone="orange" icon={<FileQuestion className="h-5 w-5" />} />
      </section>

      {!hasContent ? (
        <section className="mt-6 rounded-2xl border border-blue-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black text-slate-950">Setup checklist</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <SetupStep href="/admin/students" label="Create students" done={students.length > 0} />
            <SetupStep href="/admin/vocaquiz" label="Create VocaQuiz" done={activeVocabSets > 0} />
            <SetupStep href="/admin/math" label="Create Math Test" done={questionSets.length > 0} />
            <SetupStep href="/admin/question-sets" label="Publish first set" done={activeSets > 0} />
          </div>
        </section>
      ) : null}

      <section className="mt-6 grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-slate-950">Student alerts</h2>
              <p className="mt-1 text-sm text-slate-500">Student first, reason second. Click through when action is needed.</p>
            </div>
            <span className="rounded-full bg-red-50 px-3 py-1 text-sm font-black text-red-700">{alerts.length}</span>
          </div>
          <div className="mt-5 space-y-3">
            {alerts.length ? (
              alerts.map((alert, index) => (
                <Link
                  key={`${alert.studentId}-${alert.detail}-${index}`}
                  href={`/admin/students/${alert.studentId}`}
                  className="flex items-center justify-between gap-4 rounded-xl border border-red-200 bg-red-50 p-4 hover:bg-red-100"
                >
                  <div>
                    <p className="font-black text-red-900">{alert.studentName}</p>
                    <p className="mt-1 text-sm text-red-700">{alert.reason}: {alert.detail}</p>
                  </div>
                  <span className="rounded-lg bg-white px-3 py-2 text-sm font-black text-red-700">Open profile</span>
                </Link>
              ))
            ) : (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
                No urgent student alerts right now.
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black text-slate-950">Quick status</h2>
          <div className="mt-5 space-y-3 text-sm">
            <StatusLine label="Low-score submissions" value={lowScores} tone={lowScores ? "red" : "green"} />
            <StatusLine label="Draft math sets" value={questionSets.filter((set) => !set.active).length} />
            <StatusLine label="Published math sets" value={questionSets.filter((set) => set.active).length} />
          </div>
        </div>
      </section>
    </AdminShell>
  );
}

function SetupStep({ href, label, done }: { href: string; label: string; done: boolean }) {
  return (
    <Link href={href} className="rounded-xl border border-blue-100 bg-blue-50 p-4 hover:bg-blue-100">
      <CheckCircle2 className={`h-5 w-5 ${done ? "text-emerald-600" : "text-blue-400"}`} />
      <p className="mt-3 font-black text-blue-950">{label}</p>
      <p className="text-sm text-slate-500">{done ? "Done" : "Not yet"}</p>
    </Link>
  );
}

function StatusLine({ label, value, tone = "blue" }: { label: string; value: number; tone?: "blue" | "red" | "green" }) {
  const colors = tone === "red" ? "text-red-700" : tone === "green" ? "text-emerald-700" : "text-blue-700";
  return (
    <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
      <span className="font-bold text-slate-600">{label}</span>
      <span className={`text-lg font-black ${colors}`}>{value}</span>
    </div>
  );
}
