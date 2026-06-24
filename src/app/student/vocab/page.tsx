import { redirect } from "next/navigation";

export default async function StudentVocabRedirect({ searchParams }: { searchParams: Promise<{ set?: string }> }) {
  const params = await searchParams;
  redirect(`/student/vocabulary${params.set ? `?set=${params.set}` : ""}`);
}
