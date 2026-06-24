import Link from "next/link";
import { BookOpen, Plus } from "lucide-react";
import { AdminShell } from "@/components/AdminShell";
import { ConfirmButton } from "@/components/ConfirmButton";
import { deleteVocabSetAction, publishVocabSetAction } from "@/lib/actions";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { parseJsonList } from "@/lib/format";

export default async function VocaQuizMakerPage() {
  const user = await requireUser("admin");
  const vocabSets = await prisma.vocabSet.findMany({
    orderBy: [{ isOfficial: "desc" }, { updatedAt: "desc" }],
    include: { items: { orderBy: [{ order: "asc" }, { word: "asc" }] }, owner: true },
  });

  return (
    <AdminShell username={user.username} title="VocaQuiz Maker" subtitle="Create and manage official vocabulary sets with the card builder.">
      <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-blue-50 p-3 text-blue-700"><BookOpen className="h-5 w-5" /></div>
          <div>
            <h2 className="text-xl font-black text-slate-950">Vocabulary sets</h2>
            <p className="mt-1 text-sm text-slate-500">Use the Quizlet-style builder for title, description, import, aliases, and card ordering.</p>
          </div>
        </div>
        <Link href="/admin/vocaquiz/new" className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-5 py-3 text-sm font-black text-white hover:bg-blue-800">
          <Plus className="h-4 w-4" /> Create vocabulary set
        </Link>
      </section>

      <section className="mt-6 space-y-4">
        {vocabSets.map((set) => (
          <article key={set.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap gap-2 text-xs font-black">
                  {set.isOfficial ? <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">Official</span> : <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">Student set</span>}
                  <span className={`rounded-full px-3 py-1 ${set.active ? "bg-blue-50 text-blue-700" : "bg-amber-50 text-amber-700"}`}>{set.active ? "Published" : "Draft"}</span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">{set.visibility}</span>
                </div>
                <p className="mt-3 text-xl font-black text-slate-950">{set.title}</p>
                <p className="mt-1 text-sm text-slate-500">{set.items.length} words / owner: {set.isOfficial ? "Proper SAT Prep" : set.owner?.username ?? "Unknown"}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link href={`/admin/vocaquiz/${set.id}/edit`} className="rounded-xl border border-blue-200 bg-white px-4 py-2 text-sm font-black text-blue-700">Edit</Link>
                {!set.active ? (
                  <form action={publishVocabSetAction}>
                    <input type="hidden" name="id" value={set.id} />
                    <button className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-black text-white">Publish</button>
                  </form>
                ) : null}
                <form action={deleteVocabSetAction}>
                  <input type="hidden" name="id" value={set.id} />
                  <ConfirmButton message={`Delete "${set.title}" and all words?`} className="rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-black text-red-700">
                    Delete
                  </ConfirmButton>
                </form>
              </div>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {set.items.slice(0, 6).map((item) => (
                <div key={item.id} className="rounded-xl bg-slate-50 p-3 text-sm">
                  <p className="font-black">{item.word}</p>
                  <p className="mt-1 text-slate-600">{item.definition}</p>
                  <p className="mt-1 text-xs text-slate-400">Aliases: {parseJsonList(item.aliases).join(", ") || "none"}</p>
                </div>
              ))}
              {set.items.length === 0 ? <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">No words added yet.</p> : null}
            </div>
          </article>
        ))}
        {vocabSets.length === 0 ? <p className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-500">No VocaQuiz sets yet.</p> : null}
      </section>
    </AdminShell>
  );
}
