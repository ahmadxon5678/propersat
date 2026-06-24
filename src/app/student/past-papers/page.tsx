import { StartSetForm } from "@/components/StartSetForm";
import { StudentShell } from "@/components/StudentShell";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

function paperMeta(title: string) {
  const moduleMatch = title.match(/module\s*(\d)/i);
  const yearMatch = title.match(/\b(20\d{2})\b/);
  const monthMatch = title.match(/\b(January|February|March|April|May|June|July|August|September|October|November|December)\b/i);
  const region = /int|international/i.test(title) ? "International" : "SAT";
  return {
    moduleNumber: moduleMatch?.[1] ?? "-",
    year: yearMatch?.[1] ?? "-",
    month: monthMatch?.[1] ?? "-",
    region,
  };
}

export default async function PastPapersPage({ searchParams }: { searchParams: Promise<{ q?: string; subject?: string }> }) {
  const user = await requireUser("student");
  const params = await searchParams;
  const query = String(params.q ?? "").trim().toLowerCase();
  const subject = String(params.subject ?? "all");
  const sets = await prisma.questionSet.findMany({
    where: { active: true, setType: "full_exam", questions: { some: {} } },
    include: { questions: true },
    orderBy: { createdAt: "desc" },
  });

  const filtered = sets.filter((set) => {
    const meta = paperMeta(set.title);
    if (subject !== "all" && set.module !== subject) return false;
    if (!query) return true;
    return [set.title, set.description, set.module, meta.moduleNumber, meta.month, meta.year, meta.region].some((value) => value.toLowerCase().includes(query));
  });

  return (
    <StudentShell username={user.username} title="Past Papers" subtitle="Full SAT-style modules separated from topical practice.">
      <div className="space-y-6">
        <form action="/student/past-papers" className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-[1fr_180px_auto]">
          <input name="q" defaultValue={params.q ?? ""} className="rounded-xl border border-slate-200 px-3 py-2" placeholder="Search title, subject, module, month, year" />
          <select name="subject" defaultValue={subject} className="rounded-xl border border-slate-200 px-3 py-2">
            <option value="all">All subjects</option>
            <option value="math">Math</option>
            <option value="ebrw">EBRW</option>
          </select>
          <button className="btn-primary px-4 py-2">Search</button>
        </form>

        <section className="grid gap-4 lg:grid-cols-3">
          {filtered.map((set) => {
            const meta = paperMeta(set.title);
            const locked = set.visibility === "secret" || set.hidden || set.setType === "retest";
            return (
              <article key={set.id} className="app-card p-5">
                <div className="flex flex-wrap gap-2 text-xs font-black">
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-blue-700">{set.module.toUpperCase()}</span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">Module {meta.moduleNumber}</span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">{meta.month} {meta.year}</span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">{meta.region}</span>
                </div>
                <h2 className="mt-3 text-xl font-black text-blue-950">{set.title}</h2>
                <p className="mt-2 text-sm text-slate-600">{set.description}</p>
                <p className="mt-3 text-sm font-bold text-slate-700">{set.questions.length} questions / {set.durationMinutes} minutes</p>
                <StartSetForm questionSetId={set.id} locked={locked} />
              </article>
            );
          })}
          {filtered.length === 0 ? <p className="app-card p-5 text-slate-600">No past papers yet.</p> : null}
        </section>
      </div>
    </StudentShell>
  );
}
