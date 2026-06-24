import { AdminShell } from "@/components/AdminShell";
import { VocabSetBuilder } from "@/components/VocabSetBuilder";
import { requireUser } from "@/lib/auth";

export default async function NewAdminVocabSetPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const user = await requireUser("admin");
  const params = await searchParams;
  return (
    <AdminShell username={user.username} title="Create Vocabulary Set" subtitle="Official vocabulary sets are visible to students.">
      <VocabSetBuilder mode="create" isAdmin error={params.error} />
    </AdminShell>
  );
}
