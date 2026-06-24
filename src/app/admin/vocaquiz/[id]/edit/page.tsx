import { redirect } from "next/navigation";
import { AdminShell } from "@/components/AdminShell";
import { VocabSetBuilder } from "@/components/VocabSetBuilder";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { parseJsonList } from "@/lib/format";

export default async function EditAdminVocabSetPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  const user = await requireUser("admin");
  const routeParams = await params;
  const query = await searchParams;
  const id = Number(routeParams.id);
  const set = await prisma.vocabSet.findUnique({
    where: { id },
    include: { items: { orderBy: [{ order: "asc" }, { word: "asc" }] } },
  });
  if (!set) redirect("/admin/vocaquiz");

  return (
    <AdminShell username={user.username} title="Edit Vocabulary Set" subtitle="Admins can manage any vocabulary set.">
      <VocabSetBuilder
        mode="edit"
        isAdmin
        error={query.error}
        initial={{
          id: set.id,
          title: set.title,
          description: set.description,
          visibility: set.visibility,
          cards: set.items.map((item) => ({ word: item.word, definition: item.definition, aliases: parseJsonList(item.aliases) })),
        }}
      />
    </AdminShell>
  );
}
