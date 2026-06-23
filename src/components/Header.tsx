"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { founderLoginAction, logoutAction } from "@/lib/actions";
import { BrandLogo } from "./BrandLogo";
import { ThemeToggle } from "./ThemeToggle";

export function Header({ role, username }: { role: string; username: string }) {
  const [clicks, setClicks] = useState(0);
  const [state, action, pending] = useActionState(founderLoginAction, { error: "" });
  const unlocked = clicks >= 5;

  return (
    <header className="border-b border-blue-100 bg-white/95 shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setClicks((value) => value + 1)}
            className="rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
            aria-label="Proper SAT Prep logo"
          >
            <BrandLogo size={44} showText={false} />
          </button>
          <div>
            <Link href="/" className="text-lg font-bold text-blue-950">
              Proper SAT Prep
            </Link>
            <p className="text-sm text-slate-600">
              {role} / {username}
            </p>
          </div>
        </div>
        <form action={logoutAction}>
          <button className="rounded-lg border border-blue-200 px-3 py-2 text-sm font-medium text-blue-950 hover:bg-blue-50">
            Log out
          </button>
        </form>
      </div>

      {unlocked ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-blue-950/50 px-4">
          <form action={action} className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-4">
              <p className="text-lg font-bold text-blue-950">Admin access</p>
              <p className="text-sm text-slate-600">Enter the hidden panel password.</p>
            </div>
            {state?.error ? <p className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{state.error}</p> : null}
            <input
              name="founderPassword"
              type="password"
              className="w-full rounded-lg border border-blue-200 px-3 py-2 outline-none focus:border-blue-500"
              placeholder="Admin password"
              required
            />
            <div className="mt-4 flex gap-2">
              <button
                disabled={pending}
                className="flex-1 rounded-lg bg-blue-900 px-4 py-2 font-semibold text-white disabled:bg-slate-400"
              >
                {pending ? "Opening..." : "Open admin"}
              </button>
              <button
                type="button"
                onClick={() => setClicks(0)}
                className="rounded-lg border border-blue-200 px-4 py-2 font-semibold text-blue-950 hover:bg-blue-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </header>
  );
}
