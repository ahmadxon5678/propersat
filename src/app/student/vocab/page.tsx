import Link from "next/link";
import { Header } from "@/components/Header";
import { VocabPractice } from "@/components/VocabPractice";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function StudentVocabPage({ searchParams }: { searchParams: Promise<{ set?: string }> }) {
  const user = await requireUser("student");
  const params = await searchParams;
  const selectedSetId = Number(params.set) || null;
  const [sets, selectedSet, items] = await Promise.all([
    prisma.vocabSet.findMany({ where: { active: true, items: { some: {} } }, include: { items: true }, orderBy: { createdAt: "desc" } }),
    selectedSetId ? prisma.vocabSet.findFirst({ where: { id: selectedSetId, active: true } }) : null,
    prisma.vocabularyItem.findMany({
      where: selectedSetId ? { vocabSetId: selectedSetId, vocabSet: { active: true } } : { OR: [{ vocabSetId: null }, { vocabSet: { active: true } }] },
      orderBy: { word: "asc" },
    }),
  ]);

  return (
    <div className="min-h-screen">
      <Header role="Student" username={user.username} />
      <main className="mx-auto max-w-4xl space-y-5 px-6 py-6">
        <Link href="/student" className="text-sm font-semibold text-blue-800 hover:underline">Back to dashboard</Link>
        <section className="rounded-2xl bg-blue-950 p-6 text-white">
          <p className="text-sm uppercase text-blue-200">Vocabulary mastery</p>
          <h1 className="mt-1 text-3xl font-bold">{selectedSet?.title ?? "All vocabulary"}</h1>
          <p className="mt-2 text-blue-100">Use flashcards first, then typed answers to lock spelling.</p>
        </section>

        <div className="flex flex-wrap gap-2">
          <Link href="/student/vocab" className={`rounded-lg px-3 py-2 text-sm font-bold ${!selectedSetId ? "bg-blue-900 text-white" : "border border-blue-200 bg-white text-blue-950"}`}>
            All words
          </Link>
          {sets.map((set) => (
            <Link
              key={set.id}
              href={`/student/vocab?set=${set.id}`}
              className={`rounded-lg px-3 py-2 text-sm font-bold ${selectedSetId === set.id ? "bg-blue-900 text-white" : "border border-blue-200 bg-white text-blue-950"}`}
            >
              {set.title}
            </Link>
          ))}
        </div>

        <VocabPractice items={items} />
      </main>
    </div>
  );
}
