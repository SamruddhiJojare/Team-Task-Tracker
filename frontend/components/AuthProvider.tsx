"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { apiFetch, clearTokens, hasSession } from "@/lib/api";
import type { User } from "@/lib/types";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const publicPaths = new Set(["/login", "/register"]);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let active = true;
    async function restore() {
      if (!hasSession()) {
        if (!publicPaths.has(pathname)) router.replace("/login");
        if (active) setLoading(false);
        return;
      }
      try {
        const profile = await apiFetch<User>("/auth/me/");
        if (active) setUser(profile);
        if (publicPaths.has(pathname)) router.replace("/dashboard");
      } catch {
        clearTokens();
        if (!publicPaths.has(pathname)) router.replace("/login");
      } finally {
        if (active) setLoading(false);
      }
    }
    restore();
    return () => {
      active = false;
    };
  }, [pathname, router]);

  function logout() {
    clearTokens();
    setUser(null);
    router.replace("/login");
  }

  const value = useMemo(() => ({ user, loading, setUser, logout }), [user, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}

export function Protected({ children }: { children: React.ReactNode }) {
  const { loading, user } = useAuth();
  if (loading || !user) {
    return (
      <main className="grid min-h-screen place-items-center bg-paper">
        <div className="flex items-center gap-3 text-sm font-semibold text-slate-500">
          <span className="h-3 w-3 animate-pulse rounded-full bg-accent" /> Loading workspace
        </div>
      </main>
    );
  }
  return <>{children}</>;
}
