"use client";

import { useActionState } from "react";
import { updateStudentAccountAction } from "@/lib/actions";

export function StudentAccountForm({ username }: { username: string }) {
  const [state, action, pending] = useActionState(updateStudentAccountAction, { error: "", success: "" });

  return (
    <form action={action} className="app-card p-5">
      <h2 className="text-xl font-bold text-blue-950">Account settings</h2>
      <div className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_auto]">
        <input name="username" defaultValue={username} className="rounded-lg border border-blue-200 px-3 py-2" placeholder="Username" required />
        <input name="password" type="password" className="rounded-lg border border-blue-200 px-3 py-2" placeholder="New password, optional" />
        <button disabled={pending} className="btn-primary px-4 py-2 disabled:bg-slate-400">
          {pending ? "Saving..." : "Save"}
        </button>
      </div>
      {state?.error ? <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{state.error}</p> : null}
      {state?.success ? <p className="mt-3 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{state.success}</p> : null}
    </form>
  );
}
