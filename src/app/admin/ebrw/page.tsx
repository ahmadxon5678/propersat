import { AdminShell } from "@/components/AdminShell";
import { AdminTestMaker } from "@/components/AdminTestMaker";
import { requireUser } from "@/lib/auth";

export default async function EbrwTestMakerPage() {
  const user = await requireUser("admin");

  return (
    <AdminShell username={user.username} title="EBRW Test Maker" subtitle="Create EBRW sets, add questions, publish, and copy locked-set codes.">
      <AdminTestMaker module="ebrw" title="EBRW Test" subtitle="Same workflow as math: optional image/tags/notes, required difficulty." />
    </AdminShell>
  );
}
