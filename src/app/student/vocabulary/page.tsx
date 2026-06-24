import Link from "next/link";
import { Plus } from "lucide-react";
import { ConfirmButton } from "@/components/ConfirmButton";
import { StudentShell } from "@/components/StudentShell";
import { VocabPractice } from "@/components/VocabPractice";
import { deleteVocabSetAction } from "@/lib/actions";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function StudentVocabularyPage({ searchParams }: { searchParams: Promise<{ q?: string; set?: string }> }) {
  const user = await requireUser("student");
  const params = await searchParams;
  const query = String(params.q ?? "").trim().toLowerCase();
  const selectedSetId = Number(params.set) || null;

  const sets = await prisma.vocabSet.findMany({
    where: {
      active: true,
      items: { some: {} },
      OR: [{ isOfficial: true }, { visibility: "public" }, { ownerId: user.id }],
    },
    include: { items: { orderBy: [{ order: "asc" }, { word: "asc" }] }, owner: true },
    orderBy: [{ isOfficial: "desc" }, { updatedAt: "desc" }],
  });

  const filteredSets = sets.filter((set) => {
    if (!query) return true;
    return [set.title, set.description, set.visibility, set.isOfficial ? "official" : "", set.owner?.username ?? ""].some((value) => value.toLowerCase().includes(query));
  });
  const selectedSet = selectedSetId ? sets.find((set) => set.id === selectedSetId) : null;
  const mySets = filteredSets.filter((set) => set.ownerId === user.id);
  const officialSets = filteredSets.filter((set) => set.isOfficial);
  const publicSets = filteredSets.filter((set) => !set.isOfficial && set.visibility === "public" && set.ownerId !== user.id);

  return (
    <StudentShell username={user.username} title="Vocabulary" subtitle="Create, share, and practice vocabulary sets.">
      <div className="space-y-6">
        <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-blue-950 p-6 text-white">
          <div>
            <p className="text-sm font-black uppercase text-blue-200">Vocab builder</p>
            <h2 className="mt-1 text-3xl font-black">Build SAT vocabulary sets</h2>
            <p className="mt-2 text-blue-100">Private sets stay yours. Public sets are visible to other students.</p>
          </div>
          <Link href="/student/vocabulary/new" className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-black text-blue-950 hover:bg-blue-50">
            <Plus className="h-4 w-4" /> Create vocabulary set
          </Link>
        </section>

        <form action="/student/vocabulary" className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-[1fr_auto]">
          <input name="q" defaultValue={params.q ?? ""} className="rounded-xl border border-slate-200 px-3 py-2" placeholder="Search vocabulary sets" />
          <button className="btn-primary px-4 py-2">Search</button>
        </form>

        {selectedSet ? (
          <section className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-black text-blue-950">Practice: {selectedSet.title}</h2>
                <p className="text-sm text-slate-600">{selectedSet.items.length} words</p>
              </div>
              <Link href="/student/vocabulary" className="rounded-xl border border-blue-200 bg-white px-4 py-2 text-sm font-black text-blue-800">Back to sets</Link>
            </div>
            <VocabPractice items={selectedSet.items} />
          </section>
        ) : null}

        <VocabSection title="My vocabulary sets" sets={mySets} currentUserId={user.id} />
        <VocabSection title="Official vocabulary sets" sets={officialSets} currentUserId={user.id} />
        <VocabSection title="Public vocabulary sets" sets={publicSets} currentUserId={user.id} />
      </div>
    </StudentShell>
  );
}

type VocabSetCard = Awaited<ReturnType<typeof prisma.vocabSet.findMany>>[number] & {
  items: { id: number }[];
  owner: { username: string; name: string | null } | null;
};

function VocabSection({ title, sets, currentUserId }: { title: string; sets: VocabSetCard[]; currentUserId: number }) {
  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-black text-blue-950">{title}</h2>
      <div className="grid gap-4 lg:grid-cols-3">
        {sets.map((set) => {
          const canManage = set.ownerId === currentUserId;
          return (
            <article key={set.id} className="app-card p-5">
              <div className="flex flex-wrap gap-2 text-xs font-black">
                {set.isOfficial ? <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">Official</span> : null}
                <span className={`rounded-full px-3 py-1 ${set.visibility === "public" ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-700"}`}>{set.visibility}</span>
              </div>
              <h3 className="mt-3 text-xl font-black text-blue-950">{set.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{set.description || "No description."}</p>
              <p className="mt-3 text-sm font-bold text-slate-700">{set.items.length} words</p>
              <p className="mt-1 text-xs font-bold text-slate-500">Owner: {set.isOfficial ? "Proper SAT Prep" : set.owner?.name || set.owner?.username || "Unknown"}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link href={`/student/vocabulary?set=${set.id}`} className="btn-primary px-4 py-2 text-sm">Practice</Link>
                {canManage ? <Link href={`/student/vocabulary/${set.id}/edit`} className="rounded-lg border border-blue-200 bg-white px-4 py-2 text-sm font-black text-blue-800">Edit</Link> : null}
                {canManage ? (
                  <form action={deleteVocabSetAction}>
                    <input type="hidden" name="id" value={set.id} />
                    <ConfirmButton message={`Delete "${set.title}"?`} className="rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-black text-red-700">Delete</ConfirmButton>
                  </form>
                ) : null}
              </div>
            </article>
          );
        })}
        {sets.length === 0 ? <p className="app-card p-5 text-slate-600">No vocabulary sets yet.</p> : null}
      </div>
    </section>
  );
}
