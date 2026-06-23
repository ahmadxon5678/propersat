import { AdminShell } from "@/components/AdminShell";
import { getSetting, updateSettingsAction } from "@/lib/actions";
import { requireUser } from "@/lib/auth";

export default async function AdminSettingsPage() {
  const user = await requireUser("admin");
  const [secretPassword, adminPassword] = await Promise.all([
    getSetting("secret_password", "retest2026"),
    getSetting("admin_password", "AhmadJohns!09"),
  ]);

  return (
    <AdminShell username={user.username} title="Settings" subtitle="Passwords and local app settings.">
      <section className="max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-black">Access passwords</h2>
        <form action={updateSettingsAction} className="mt-5 grid gap-4">
          <label className="text-sm font-bold text-slate-600">
            Global secret/retest password
            <input name="secretPassword" defaultValue={secretPassword} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" />
          </label>
          <label className="text-sm font-bold text-slate-600">
            Hidden admin password
            <input name="adminPassword" defaultValue={adminPassword} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" />
          </label>
          <button className="w-fit rounded-xl bg-blue-700 px-5 py-2 font-black text-white hover:bg-blue-800">Save settings</button>
        </form>
      </section>
    </AdminShell>
  );
}
