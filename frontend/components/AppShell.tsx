"use client";

import Link from "next/link";

import { useAuth } from "./AuthProvider";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  return (
    <div className="min-h-screen bg-paper text-ink">
      <header className="border-b border-slate-200/80 bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
          <Link href="/dashboard" className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-ink text-sm font-black text-white">TT</span>
            <div>
              <p className="font-bold tracking-tight">Teamtrack</p>
              <p className="text-xs text-slate-500">Make progress visible</p>
            </div>
          </Link>
          <div className="flex items-center gap-4">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold">{user?.name}</p>
              <p className="text-xs capitalize text-slate-500">{user?.role}</p>
            </div>
            <button onClick={logout} className="btn-secondary px-4 py-2 text-sm">Sign out</button>
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}
