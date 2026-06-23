"use client";

import Link from "next/link";
import type React from "react";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  BookOpen,
  ClipboardList,
  FileQuestion,
  Home,
  LogOut,
  Settings,
  Shield,
  Users,
} from "lucide-react";
import { logoutAction } from "@/lib/actions";
import { BrandLogo } from "./BrandLogo";
import { ThemeToggle } from "./ThemeToggle";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: Home },
  { href: "/admin/students", label: "Students", icon: Users },
  { href: "/admin/vocaquiz", label: "VocaQuiz Maker", icon: BookOpen },
  { href: "/admin/math", label: "Math Test Maker", icon: FileQuestion },
  { href: "/admin/ebrw", label: "EBRW Test Maker", icon: ClipboardList },
  { href: "/admin/question-sets", label: "Question Sets", icon: ClipboardList },
  { href: "/admin/results", label: "Results", icon: BarChart3 },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminShell({
  username,
  children,
  title,
  subtitle,
}: {
  username: string;
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-slate-100 text-slate-950">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 flex-col bg-slate-950 text-white shadow-xl lg:flex">
        <div className="flex h-20 items-center gap-3 border-b border-white/10 px-6">
          <BrandLogo size={46} textClassName="text-white text-xl" subtitle="Admin workspace" />
        </div>

        <div className="border-b border-white/10 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-blue-400/40 bg-blue-500/10">
              <Shield className="h-5 w-5 text-blue-200" />
            </div>
            <div>
              <p className="font-bold">Admin Panel</p>
              <p className="text-sm text-slate-400">{username}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold ${
                  active
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-950/30"
                    : "text-slate-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
          <div className="flex min-h-20 items-center justify-between gap-4 px-5 lg:px-10">
            <div className="flex items-start gap-3">
              <ThemeToggle />
              <div>
                <div className="mb-2 flex items-center gap-2 lg:hidden">
                <BrandLogo size={36} textClassName="text-blue-950" />
                </div>
                <h1 className="text-2xl font-black text-slate-950">{title}</h1>
                {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
              </div>
            </div>
            <form action={logoutAction}>
              <button className="flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2 text-sm font-bold text-white hover:bg-blue-900">
                <LogOut className="h-4 w-4" />
                Chiqish
              </button>
            </form>
          </div>
          <nav className="flex gap-2 overflow-x-auto border-t border-slate-100 px-5 py-3 lg:hidden">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className="shrink-0 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs font-bold text-blue-950">
                {item.label}
              </Link>
            ))}
          </nav>
        </header>
        <main className="px-5 py-6 lg:px-10">{children}</main>
      </div>
    </div>
  );
}

export function AdminStatCard({
  label,
  value,
  tone = "blue",
  icon,
}: {
  label: string;
  value: string | number;
  tone?: "blue" | "green" | "red" | "orange";
  icon?: React.ReactNode;
}) {
  const tones = {
    blue: "border-blue-200 bg-blue-50 text-blue-700",
    green: "border-emerald-200 bg-emerald-50 text-emerald-700",
    red: "border-red-200 bg-red-50 text-red-700",
    orange: "border-orange-200 bg-orange-50 text-orange-600",
  };
  return (
    <div className={`rounded-2xl border p-5 ${tones[tone]}`}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-slate-600">{label}</p>
        {icon}
      </div>
      <p className="mt-3 text-4xl font-black">{value}</p>
    </div>
  );
}
