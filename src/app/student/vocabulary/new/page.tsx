import { StudentShell } from "@/components/StudentShell";
import { VocabSetBuilder } from "@/components/VocabSetBuilder";
import { requireUser } from "@/lib/auth";

export default async function NewStudentVocabSetPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const user = await requireUser("student");
  const params = await searchParams;
  return (
    <StudentShell username={user.username} title="Create Vocabulary Set" subtitle="Private by default. You can make it public.">
      <VocabSetBuilder mode="create" error={params.error} />
    </StudentShell>
  );
}
