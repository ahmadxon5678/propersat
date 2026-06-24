import { redirect } from "next/navigation";
import { StudentShell } from "@/components/StudentShell";
import { VocabSetBuilder } from "@/components/VocabSetBuilder";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { parseJsonList } from "@/lib/format";

export default async function EditStudentVocabSetPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  const user = await requireUser("student");
  const routeParams = await params;
  const query = await searchParams;
  const id = Number(routeParams.id);
  const set = await prisma.vocabSet.findUnique({
    where: { id },
    include: { items: { orderBy: [{ order: "asc" }, { word: "asc" }] } },
  });
  if (!set || set.ownerId !== user.id) redirect("/student/vocabulary");

  return (
    <StudentShell username={user.username} title="Edit Vocabulary Set" subtitle="Only you can edit this set.">
      <VocabSetBuilder
        mode="edit"
        error={query.error}
        initial={{
          id: set.id,
          title: set.title,
          description: set.description,
          visibility: set.visibility,
          cards: set.items.map((item) => ({ word: item.word, definition: item.definition, aliases: parseJsonList(item.aliases) })),
        }}
      />
    </StudentShell>
  );
}
