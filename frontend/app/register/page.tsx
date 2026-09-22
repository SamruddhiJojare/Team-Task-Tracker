"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { AuthArtwork } from "@/components/AuthArtwork";
import { useAuth } from "@/components/AuthProvider";
import { authenticate } from "@/lib/api";
import type { Role } from "@/lib/types";

export default function RegisterPage() {
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "member" as Role });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { setUser } = useAuth();
  const router = useRouter();

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const data = await authenticate("register", form);
      setUser(data.user);
      router.push("/dashboard");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not create your account.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="grid min-h-screen lg:grid-cols-[1.1fr_0.9fr]">
      <AuthArtwork />
      <section className="flex items-center justify-center bg-paper px-6 py-14">
        <div className="w-full max-w-md">
          <p className="eyebrow">Start together</p>
          <h2 className="mt-3 text-4xl font-black tracking-tight">Create your account</h2>
          <p className="mt-3 text-slate-500">Admins create teams; members join through invitations.</p>
          <form onSubmit={submit} className="mt-8 space-y-4">
            <label className="block">
              <span className="label">Full name</span>
              <input className="field" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Asha Rao" required />
            </label>
            <label className="block">
              <span className="label">Email address</span>
              <input className="field" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="you@company.com" required />
            </label>
            <div className="grid grid-cols-[1fr_140px] gap-3">
              <label className="block">
                <span className="label">Password</span>
                <input className="field" type="password" minLength={8} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder="8+ characters" required />
              </label>
              <label className="block">
                <span className="label">Role</span>
                <select className="field" value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value as Role })}>
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
              </label>
            </div>
            {error && <p className="rounded-xl bg-red-50 p-3 text-sm font-medium text-red-700">{error}</p>}
            <button className="btn-primary w-full" disabled={submitting}>{submitting ? "Creating account..." : "Create account"}</button>
          </form>
          <p className="mt-6 text-center text-sm text-slate-500">
            Already have an account? <Link className="font-bold text-accent hover:underline" href="/login">Sign in</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
