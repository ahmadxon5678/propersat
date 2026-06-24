"use client";

import Link from "next/link";
import type React from "react";
import { usePathname } from "next/navigation";
import { BarChart3, BookOpen, FileText, Home, Layers, LogOut } from "lucide-react";
import { logoutAction } from "@/lib/actions";
import { BrandLogo } from "./BrandLogo";
import { ThemeToggle } from "./ThemeToggle";

const navItems = [
  { href: "/student", label: "Dashboard", icon: Home },
  { href: "/student/topical", label: "Topical Questions", icon: Layers },
  { href: "/student/past-papers", label: "Past Papers", icon: FileText },
  { href: "/student/vocabulary", label: "Vocabulary", icon: BookOpen },
  { href: "/student/analytics", label: "My Analytics", icon: BarChart3 },
];

export function StudentShell({
  username,
  title,
  subtitle,
  children,
}: {
  username: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-slate-100 text-slate-950">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 flex-col border-r border-blue-100 bg-white shadow-xl lg:flex">
        <div className="flex h-20 items-center border-b border-blue-100 px-6">
          <BrandLogo size={44} textClassName="text-blue-950 text-xl" subtitle="Student workspace" />
        </div>
        <div className="border-b border-blue-100 px-6 py-5">
          <p className="text-xs font-black uppercase text-blue-700">Signed in</p>
          <p className="mt-1 font-black text-slate-950">{username}</p>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = item.href === "/student" ? pathname === "/student" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-black ${
                  active ? "bg-blue-900 text-white shadow-sm" : "text-slate-700 hover:bg-blue-50 hover:text-blue-950"
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
            <div className="flex min-w-0 items-start gap-3">
              <ThemeToggle />
              <div className="min-w-0">
                <div className="mb-2 lg:hidden">
                  <BrandLogo size={34} textClassName="text-blue-950" />
                </div>
                <h1 className="text-2xl font-black text-slate-950">{title}</h1>
                {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
              </div>
            </div>
            <form action={logoutAction}>
              <button className="flex items-center gap-2 rounded-xl bg-blue-950 px-4 py-2 text-sm font-bold text-white hover:bg-blue-800">
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </form>
          </div>
          <nav className="flex gap-2 overflow-x-auto border-t border-slate-100 px-5 py-3 lg:hidden">
            {navItems.map((item) => {
              const active = item.href === "/student" ? pathname === "/student" : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`shrink-0 rounded-lg border px-3 py-2 text-xs font-bold ${
                    active ? "border-blue-900 bg-blue-900 text-white" : "border-blue-100 bg-blue-50 text-blue-950"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </header>
        <main className="mx-auto max-w-7xl px-5 py-6 lg:px-10">{children}</main>
      </div>
    </div>
  );
}
