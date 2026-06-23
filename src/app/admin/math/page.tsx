import { AdminShell } from "@/components/AdminShell";
import { AdminTestMaker } from "@/components/AdminTestMaker";
import { requireUser } from "@/lib/auth";

export default async function MathTestMakerPage() {
  const user = await requireUser("admin");

  return (
    <AdminShell username={user.username} title="Math Test Maker" subtitle="Create math sets, add questions, publish, and copy locked-set codes.">
      <AdminTestMaker module="math" title="Math Test" subtitle="Images, topic tags, and teacher notes are optional. Difficulty is required." />
    </AdminShell>
  );
}
