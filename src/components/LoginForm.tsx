"use client";

import { useActionState, useState } from "react";
import { BookOpenCheck, Lock, Sparkles } from "lucide-react";
import { founderLoginAction, loginAction, registerAction } from "@/lib/actions";
import { BrandLogo } from "./BrandLogo";

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, { error: "" });
  const [registerState, registerSubmit, registerPending] = useActionState(registerAction, { error: "" });
  const [founderState, founderAction, founderPending] = useActionState(founderLoginAction, { error: "" });
  const [mode, setMode] = useState<"login" | "register">("login");
  const [titleClicks, setTitleClicks] = useState(0);
  const founderUnlocked = titleClicks >= 5;

  return (
    <div className="grid min-h-screen w-full bg-slate-950 lg:grid-cols-[1fr_460px]">
      <section className="relative hidden overflow-hidden p-10 text-white lg:block">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,#2563eb_0,transparent_30%),radial-gradient(circle_at_80%_10%,#38bdf8_0,transparent_28%),linear-gradient(135deg,#020617,#0f172a_55%,#1e3a8a)]" />
        <div className="relative z-10 flex h-full flex-col justify-between">
          <button
            type="button"
            onClick={() => setTitleClicks((value) => value + 1)}
            className="flex w-fit items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-left backdrop-blur"
            aria-label="Proper SAT Prep Login"
          >
            <BrandLogo size={54} textClassName="text-white text-2xl" subtitle="Math diagnostics and vocabulary mastery" />
          </button>
          <div className="max-w-2xl">
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-bold text-blue-100">
              <Sparkles className="h-4 w-4" />
              Built for support teaching
            </p>
            <h1 className="text-5xl font-black leading-tight">Find weak spots. Fix them faster.</h1>
            <p className="mt-5 max-w-xl text-lg text-blue-100">
              Students practice vocabulary and SAT math while the admin panel keeps your next teaching actions clear.
            </p>
          </div>
        </div>
      </section>

      <section className="flex items-center justify-center bg-slate-100 px-5 py-10">
        <div className="w-full max-w-md">
          <button
            type="button"
            onClick={() => setTitleClicks((value) => value + 1)}
            className="mx-auto mb-6 flex items-center gap-3 lg:hidden"
            aria-label="Proper SAT Prep Login"
          >
            <BrandLogo size={52} textClassName="text-blue-950 text-2xl" />
          </button>

          <div className="rounded-3xl border border-blue-100 bg-white p-7 shadow-xl">
            <div className="mb-6 text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                <BookOpenCheck className="h-7 w-7" />
              </div>
              <h2 className="text-2xl font-black text-slate-950">{mode === "login" ? "Welcome back" : "Create student account"}</h2>
              <p className="mt-1 text-sm text-slate-500">Login or register to continue practice.</p>
            </div>

            <div className="mb-5 grid grid-cols-2 rounded-xl bg-slate-100 p-1 text-sm font-black">
              <button type="button" onClick={() => setMode("login")} className={`rounded-lg px-3 py-2 ${mode === "login" ? "bg-blue-700 text-white shadow-sm" : "text-slate-600"}`}>
                Login
              </button>
              <button type="button" onClick={() => setMode("register")} className={`rounded-lg px-3 py-2 ${mode === "register" ? "bg-blue-700 text-white shadow-sm" : "text-slate-600"}`}>
                Register
              </button>
            </div>

            {mode === "login" ? (
              <form action={action} className="space-y-4">
                {state?.error ? <p className="rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">{state.error}</p> : null}
                <label className="block text-sm font-bold text-slate-700">
                  Username
                  <input name="username" className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-3 outline-none focus:border-blue-500" required />
                </label>
                <label className="block text-sm font-bold text-slate-700">
                  Password
                  <input name="password" type="password" className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-3 outline-none focus:border-blue-500" required />
                </label>
                <button disabled={pending} className="w-full rounded-xl bg-blue-700 px-4 py-3 font-black text-white shadow-lg shadow-blue-700/20 hover:bg-blue-800 disabled:bg-slate-400">
                  {pending ? "Signing in..." : "Sign in"}
                </button>
              </form>
            ) : (
              <form action={registerSubmit} className="space-y-4">
                {registerState?.error ? <p className="rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">{registerState.error}</p> : null}
                <label className="block text-sm font-bold text-slate-700">
                  Name
                  <input name="name" className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-3 outline-none focus:border-blue-500" required />
                </label>
                <label className="block text-sm font-bold text-slate-700">
                  Username
                  <input name="username" className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-3 outline-none focus:border-blue-500" required />
                </label>
                <label className="block text-sm font-bold text-slate-700">
                  Password
                  <input name="password" type="password" className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-3 outline-none focus:border-blue-500" required />
                </label>
                <button disabled={registerPending} className="w-full rounded-xl bg-blue-700 px-4 py-3 font-black text-white shadow-lg shadow-blue-700/20 hover:bg-blue-800 disabled:bg-slate-400">
                  {registerPending ? "Creating account..." : "Create account"}
                </button>
              </form>
            )}
          </div>

          {founderUnlocked ? (
            <form action={founderAction} className="mt-5 space-y-3 rounded-2xl border border-blue-100 bg-white p-5 shadow-lg">
              <p className="flex items-center gap-2 text-sm font-black text-blue-950">
                <Lock className="h-4 w-4" />
                Hidden admin access
              </p>
              {founderState?.error ? <p className="rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">{founderState.error}</p> : null}
              <input name="founderPassword" type="password" className="w-full rounded-xl border border-slate-200 px-3 py-3" placeholder="Admin password" required />
              <button disabled={founderPending} className="w-full rounded-xl bg-slate-950 px-4 py-3 font-black text-white disabled:bg-slate-400">
                {founderPending ? "Opening..." : "Open admin dashboard"}
              </button>
            </form>
          ) : null}
        </div>
      </section>
    </div>
  );
}
