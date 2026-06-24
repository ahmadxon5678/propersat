import { StartSetForm } from "@/components/StartSetForm";
import { StudentShell } from "@/components/StudentShell";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { parseJsonList } from "@/lib/format";

export default async function TopicalQuestionsPage({ searchParams }: { searchParams: Promise<{ q?: string; subject?: string; difficulty?: string; topic?: string }> }) {
  const user = await requireUser("student");
  const params = await searchParams;
  const query = String(params.q ?? "").trim().toLowerCase();
  const subject = String(params.subject ?? "all");
  const difficulty = String(params.difficulty ?? "all");
  const topic = String(params.topic ?? "all");

  const sets = await prisma.questionSet.findMany({
    where: { active: true, setType: "topical", questions: { some: {} } },
    include: { questions: { orderBy: { order: "asc" } } },
    orderBy: { createdAt: "desc" },
  });

  const topics = [...new Set(sets.flatMap((set) => set.questions.flatMap((question) => parseJsonList(question.topicTags))))].sort();
  const filtered = sets.filter((set) => {
    const setTopics = set.questions.flatMap((question) => parseJsonList(question.topicTags));
    const difficulties = set.questions.map((question) => question.difficulty);
    if (subject !== "all" && set.module !== subject) return false;
    if (difficulty !== "all" && !difficulties.includes(difficulty)) return false;
    if (topic !== "all" && !setTopics.includes(topic)) return false;
    if (!query) return true;
    return [set.title, set.description, set.module, set.setType, ...setTopics, ...difficulties].some((value) => value.toLowerCase().includes(query));
  });

  return (
    <StudentShell username={user.username} title="Topical Questions" subtitle="Focused practice sets only.">
      <div className="space-y-6">
        <form action="/student/topical" className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:grid-cols-[1fr_150px_150px_190px_auto]">
          <input name="q" defaultValue={params.q ?? ""} className="rounded-xl border border-slate-200 px-3 py-2" placeholder="Search topical sets, topics, module, difficulty" />
          <select name="subject" defaultValue={subject} className="rounded-xl border border-slate-200 px-3 py-2">
            <option value="all">All subjects</option>
            <option value="math">Math</option>
            <option value="ebrw">EBRW</option>
          </select>
          <select name="difficulty" defaultValue={difficulty} className="rounded-xl border border-slate-200 px-3 py-2">
            <option value="all">All difficulty</option>
            <option value="easy">Easy</option>
            <option value="mid">Mid</option>
            <option value="hard">Hard</option>
          </select>
          <select name="topic" defaultValue={topic} className="rounded-xl border border-slate-200 px-3 py-2">
            <option value="all">All topics</option>
            {topics.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <button className="btn-primary px-4 py-2">Search</button>
        </form>

        <section className="grid gap-4 lg:grid-cols-3">
          {filtered.map((set) => {
            const locked = set.visibility === "secret" || set.hidden || set.setType === "retest";
            const setTopics = [...new Set(set.questions.flatMap((question) => parseJsonList(question.topicTags)))];
            return (
              <article key={set.id} className="app-card p-5">
                <div className="flex flex-wrap gap-2 text-xs font-black">
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-blue-700">{set.module.toUpperCase()}</span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">Topical</span>
                  {locked ? <span className="rounded-full bg-amber-50 px-3 py-1 text-amber-700">Locked</span> : <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">Public</span>}
                </div>
                <h2 className="mt-3 text-xl font-black text-blue-950">{set.title}</h2>
                <p className="mt-2 text-sm text-slate-600">{set.description}</p>
                <p className="mt-3 text-sm font-bold text-slate-700">{set.questions.length} questions / {set.durationMinutes} minutes</p>
                <p className="mt-2 text-sm text-slate-500">{setTopics.slice(0, 4).join(", ") || "No topic tags"}</p>
                <StartSetForm questionSetId={set.id} locked={locked} />
              </article>
            );
          })}
          {filtered.length === 0 ? <p className="app-card p-5 text-slate-600">No topical questions yet.</p> : null}
        </section>
      </div>
    </StudentShell>
  );
}
