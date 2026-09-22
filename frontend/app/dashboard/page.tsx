"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";

import { AppShell } from "@/components/AppShell";
import { Protected, useAuth } from "@/components/AuthProvider";
import { apiFetch } from "@/lib/api";
import type { Team } from "@/lib/types";

export default function DashboardPage() {
  return (
    <Protected>
      <AppShell><Dashboard /></AppShell>
    </Protected>
  );
}

function Dashboard() {
  const { user } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [form, setForm] = useState({ name: "", description: "" });
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const loadTeams = useCallback(async () => {
    try {
      setTeams(await apiFetch<Team[]>("/teams/"));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not load teams.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadTeams(); }, [loadTeams]);

  async function createTeam(event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      const team = await apiFetch<Team>("/teams/", { method: "POST", body: JSON.stringify(form) });
      setTeams([team, ...teams]);
      setForm({ name: "", description: "" });
      setShowForm(false);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not create team.");
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-5 py-10 lg:px-8 lg:py-14">
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
          <p className="eyebrow">Workspace</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">Good to see you, {user?.name.split(" ")[0]}.</h1>
          <p className="mt-3 max-w-2xl text-slate-500">Choose a team to review its work, people, and latest movement.</p>
        </div>
        {user?.role === "admin" && (
          <button className="btn-primary" onClick={() => setShowForm(!showForm)}>{showForm ? "Close" : "+ New team"}</button>
        )}
      </div>

      {error && <p className="mt-6 rounded-2xl bg-red-50 p-4 text-sm font-medium text-red-700">{error}</p>}

      {showForm && (
        <form onSubmit={createTeam} className="card mt-8 grid gap-4 md:grid-cols-[1fr_1.6fr_auto] md:items-end">
          <label><span className="label">Team name</span><input className="field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Product Launch" required /></label>
          <label><span className="label">Description</span><input className="field" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What this team is working toward" /></label>
          <button className="btn-primary">Create team</button>
        </form>
      )}

      <section className="mt-10">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-bold">Your teams</h2>
          <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-500">{teams.length} total</span>
        </div>
        {loading ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{[1, 2, 3].map((item) => <div key={item} className="h-56 animate-pulse rounded-3xl bg-white/70" />)}</div>
        ) : teams.length ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {teams.map((team, index) => (
              <Link key={team.id} href={`/teams/${team.id}`} className="card group flex min-h-56 flex-col transition hover:-translate-y-1 hover:border-accent/25">
                <div className="flex items-start justify-between">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-accent/10 font-black text-accent">{team.name.slice(0, 2).toUpperCase()}</span>
                  <span className="text-xs font-semibold text-slate-400">0{index + 1}</span>
                </div>
                <h3 className="mt-7 text-xl font-bold group-hover:text-accent">{team.name}</h3>
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">{team.description || "A focused place for this team's work."}</p>
                <div className="mt-auto flex items-center justify-between pt-6 text-xs font-semibold text-slate-500">
                  <span>{team.member_count} {team.member_count === 1 ? "member" : "members"}</span>
                  <span className="text-accent">Open team →</span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="card py-16 text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-accent/10 text-2xl">◎</div>
            <h3 className="mt-5 text-xl font-bold">No teams yet</h3>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">{user?.role === "admin" ? "Create the first team and invite people to get moving." : "Ask an admin to invite your email to a team."}</p>
          </div>
        )}
      </section>
    </main>
  );
}
