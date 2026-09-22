"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { AuthArtwork } from "@/components/AuthArtwork";
import { useAuth } from "@/components/AuthProvider";
import { authenticate } from "@/lib/api";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { setUser } = useAuth();
  const router = useRouter();

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const data = await authenticate("login", { email, password });
      setUser(data.user);
      router.push("/dashboard");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not sign in.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="grid min-h-screen lg:grid-cols-[1.1fr_0.9fr]">
      <AuthArtwork />
      <section className="flex items-center justify-center bg-paper px-6 py-14">
        <div className="w-full max-w-md">
          <p className="eyebrow">Welcome back</p>
          <h2 className="mt-3 text-4xl font-black tracking-tight">Sign in to your workspace</h2>
          <p className="mt-3 text-slate-500">Pick up where your team left off.</p>
          <form onSubmit={submit} className="mt-9 space-y-5">
            <label className="block">
              <span className="label">Email address</span>
              <input className="field" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@company.com" required />
            </label>
            <label className="block">
              <span className="label">Password</span>
              <input className="field" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 8 characters" required />
            </label>
            {error && <p className="rounded-xl bg-red-50 p-3 text-sm font-medium text-red-700">{error}</p>}
            <button className="btn-primary w-full" disabled={submitting}>{submitting ? "Signing in..." : "Sign in"}</button>
          </form>
          <p className="mt-7 text-center text-sm text-slate-500">
            New to Teamtrack? <Link className="font-bold text-accent hover:underline" href="/register">Create an account</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
