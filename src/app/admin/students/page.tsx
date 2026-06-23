import Link from "next/link";
import { AdminShell } from "@/components/AdminShell";
import { createStudentAction } from "@/lib/actions";
import { requireUser } from "@/lib/auth";
import { weakTopicsFromAnswers } from "@/lib/analytics";
import { prisma } from "@/lib/db";

export default async function AdminStudentsPage() {
  const user = await requireUser("admin");
  const students = await prisma.user.findMany({
    where: { role: "student" },
    orderBy: { username: "asc" },
    include: {
      submissions: { include: { answers: { include: { question: true } } } },
      vocabAttempts: true,
      strugglePoints: { where: { resolved: false } },
    },
  });

  return (
    <AdminShell username={user.username} title="Students" subtitle="Create students and open individual learning profiles.">
      <form action={createStudentAction} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-black">Create student</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto]">
          <input name="name" className="rounded-xl border border-slate-200 px-3 py-2" placeholder="Name" />
          <input name="username" className="rounded-xl border border-slate-200 px-3 py-2" placeholder="Username" required />
          <input name="password" className="rounded-xl border border-slate-200 px-3 py-2" placeholder="Password" required />
          <button className="rounded-xl bg-blue-700 px-5 py-2 font-black text-white hover:bg-blue-800">Create</button>
        </div>
      </form>

      <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-700">
            <tr>
              <th className="p-4">Student</th>
              <th className="p-4">Tests</th>
              <th className="p-4">Vocab attempts</th>
              <th className="p-4">Weak tags</th>
              <th className="p-4">Struggle points</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student) => {
              const weak = weakTopicsFromAnswers(student.submissions.flatMap((submission) => submission.answers));
              return (
                <tr key={student.id} className="border-t border-slate-100">
                  <td className="p-4">
                    <Link href={`/admin/students/${student.id}`} className="font-black text-blue-700 hover:underline">
                      {student.name || student.username}
                    </Link>
                    <p className="text-xs text-slate-500">@{student.username}</p>
                  </td>
                  <td className="p-4">{student.submissions.length}</td>
                  <td className="p-4">{student.vocabAttempts.length}</td>
                  <td className="p-4">{weak.length ? weak.slice(0, 4).map((item) => item.topic).join(", ") : "None yet"}</td>
                  <td className="p-4 text-red-700">{student.strugglePoints.map((point) => point.topic).join(", ") || "None"}</td>
                </tr>
              );
            })}
            {students.length === 0 ? (
              <tr><td colSpan={5} className="p-5 text-slate-500">No students yet.</td></tr>
            ) : null}
          </tbody>
        </table>
      </section>
    </AdminShell>
  );
}
