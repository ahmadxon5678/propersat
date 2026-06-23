"use client";

import { useActionState } from "react";
import { startSetAttemptAction } from "@/lib/actions";

export function StartSetForm({ questionSetId, locked }: { questionSetId: number; locked: boolean }) {
  const [state, action, pending] = useActionState(startSetAttemptAction, { error: "" });

  return (
    <form action={action} className="mt-4 space-y-3">
      <input type="hidden" name="questionSetId" value={questionSetId} />
      {locked ? (
        <input
          name="password"
          type="password"
          className="w-full rounded-lg border border-blue-200 px-3 py-2"
          placeholder="Enter secret/retest password"
          required
        />
      ) : null}
      {state?.error ? <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{state.error}</p> : null}
      <button disabled={pending} className="btn-primary px-4 py-2 text-sm disabled:bg-slate-400">
        {pending ? "Opening..." : locked ? "Unlock and start" : "Start"}
      </button>
    </form>
  );
}
