import { BookOpen, EyeOff } from "lucide-react";
import { AdminShell } from "@/components/AdminShell";
import { createVocabAction, createVocabSetAction, publishVocabSetAction } from "@/lib/actions";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { parseJsonList } from "@/lib/format";

export default async function VocaQuizMakerPage() {
  const user = await requireUser("admin");
  const vocabSets = await prisma.vocabSet.findMany({
    orderBy: { createdAt: "desc" },
    include: { items: { orderBy: { word: "asc" } } },
  });

  return (
    <AdminShell username={user.username} title="VocaQuiz Maker" subtitle="Build vocabulary sets as drafts, add words, then publish when ready.">
      <section className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <form action={createVocabSetAction} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-50 p-3 text-blue-700"><BookOpen className="h-5 w-5" /></div>
            <h2 className="text-xl font-black">Create VocaQuiz draft</h2>
          </div>
          <div className="mt-5 space-y-3">
            <input name="title" className="w-full rounded-xl border border-slate-200 px-3 py-2" placeholder="Set name" required />
            <textarea name="description" className="min-h-28 w-full rounded-xl border border-slate-200 px-3 py-2" placeholder="Description" />
            <label className="flex items-center gap-2 text-sm font-bold text-slate-600">
              <input name="publish" type="checkbox" />
              Publish immediately
            </label>
            <button className="rounded-xl bg-blue-700 px-5 py-2 font-black text-white hover:bg-blue-800">Create set</button>
          </div>
        </form>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black">Add word to a set</h2>
          <form action={createVocabAction} className="mt-5 grid gap-3 md:grid-cols-2">
            <select name="vocabSetId" className="rounded-xl border border-slate-200 px-3 py-2" required>
              <option value="">Choose VocaQuiz set</option>
              {vocabSets.map((set) => (
                <option key={set.id} value={set.id}>{set.title}</option>
              ))}
            </select>
            <input name="word" className="rounded-xl border border-slate-200 px-3 py-2" placeholder="Word" required />
            <input name="definition" className="rounded-xl border border-slate-200 px-3 py-2 md:col-span-2" placeholder="Definition" required />
            <input name="aliases" className="rounded-xl border border-slate-200 px-3 py-2 md:col-span-2" placeholder="Accepted forms, optional: beutiful, beatiful" />
            <button className="rounded-xl bg-blue-700 px-5 py-2 font-black text-white hover:bg-blue-800 md:w-fit">Add word</button>
          </form>
        </div>
      </section>

      <section className="mt-6 space-y-4">
        <h2 className="text-2xl font-black">Quizzes made</h2>
        {vocabSets.map((set) => (
          <article key={set.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xl font-black">{set.title}</p>
                <p className="text-sm text-slate-500">{set.items.length} words / {set.active ? "Published" : "Draft"}</p>
              </div>
              {!set.active ? (
                <form action={publishVocabSetAction}>
                  <input type="hidden" name="id" value={set.id} />
                  <button className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-black text-white">Publish</button>
                </form>
              ) : (
                <span className="rounded-xl bg-emerald-50 px-3 py-2 text-sm font-black text-emerald-700">Published</span>
              )}
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {set.items.map((item) => (
                <div key={item.id} className="rounded-xl bg-slate-50 p-3 text-sm">
                  <p className="font-black">{item.word}</p>
                  <p className="mt-1 text-slate-600">{item.definition}</p>
                  <p className="mt-1 text-xs text-slate-400">Aliases: {parseJsonList(item.aliases).join(", ") || "none"}</p>
                </div>
              ))}
              {set.items.length === 0 ? (
                <div className="flex items-center gap-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
                  <EyeOff className="h-4 w-4" /> No words added yet.
                </div>
              ) : null}
            </div>
          </article>
        ))}
        {vocabSets.length === 0 ? <p className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-500">No VocaQuiz sets yet.</p> : null}
      </section>
    </AdminShell>
  );
}
