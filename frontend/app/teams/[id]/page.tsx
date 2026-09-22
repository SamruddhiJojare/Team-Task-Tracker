"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { AppShell } from "@/components/AppShell";
import { Protected, useAuth } from "@/components/AuthProvider";
import { TeamNav } from "@/components/TeamNav";
import { Timeline } from "@/components/Timeline";
import { apiFetch } from "@/lib/api";
import type { Activity, Team } from "@/lib/types";

export default function TeamPage() {
  return <Protected><AppShell><TeamOverview /></AppShell></Protected>;
}

function TeamOverview() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [team, setTeam] = useState<Team | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const [teamData, activityData] = await Promise.all([
        apiFetch<Team>(`/teams/${id}/`),
        apiFetch<Activity[]>(`/teams/${id}/activities/`),
      ]);
      setTeam(teamData);
      setActivities(activityData);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not load this team.");
    }
  }, [id]);

  useEffect(() => {
    load();
    const timer = window.setInterval(load, 5000);
    return () => window.clearInterval(timer);
  }, [load]);

  async function invite(event: FormEvent) {
    event.preventDefault();
    setError("");
    setNotice("");
    try {
      const result = await apiFetch<{ status: string }>(`/teams/${id}/invite/`, {
        method: "POST",
        body: JSON.stringify({ email: inviteEmail }),
      });
      setNotice(result.status === "accepted" ? "Member added to the team." : "Invitation recorded. They will join when they register.");
      setInviteEmail("");
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not send invitation.");
    }
  }

  if (!team && !error) return <main className="grid min-h-[70vh] place-items-center text-sm font-semibold text-slate-500">Loading team...</main>;

  return (
    <main className="mx-auto max-w-7xl px-5 py-9 lg:px-8 lg:py-12">
      <Link href="/dashboard" className="text-sm font-semibold text-slate-500 hover:text-accent">← All teams</Link>
      {error && <p className="mt-5 rounded-2xl bg-red-50 p-4 text-sm font-medium text-red-700">{error}</p>}
      {team && (
        <>
          <header className="mt-7 flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <div className="flex items-center gap-3">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-accent text-sm font-black text-white">{team.name.slice(0, 2).toUpperCase()}</span>
                <p className="eyebrow">Team workspace</p>
              </div>
              <h1 className="mt-5 text-4xl font-black tracking-tight md:text-5xl">{team.name}</h1>
              <p className="mt-3 max-w-2xl text-slate-500">{team.description || "A focused place for this team's work."}</p>
            </div>
            <TeamNav teamId={id} active="overview" />
          </header>

          <div className="mt-10 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="space-y-6">
              <section className="card">
                <div className="flex items-center justify-between">
                  <div><p className="eyebrow">People</p><h2 className="mt-2 text-xl font-bold">Team members</h2></div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">{team.member_count}</span>
                </div>
                <div className="mt-6 space-y-3">
                  {team.members.map((member) => (
                    <div key={member.id} className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3">
                      <span className="grid h-10 w-10 place-items-center rounded-xl bg-white text-sm font-bold text-accent shadow-sm">{member.name.slice(0, 2).toUpperCase()}</span>
                      <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{member.name}</p><p className="truncate text-xs text-slate-500">{member.email}</p></div>
                      <span className="text-xs font-semibold capitalize text-slate-400">{member.role}</span>
                    </div>
                  ))}
                </div>
              </section>

              {user?.role === "admin" && (
                <section className="card">
                  <p className="eyebrow">Invite</p>
                  <h2 className="mt-2 text-xl font-bold">Add a teammate</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-500">Existing users join now. New users join automatically when they register with this email.</p>
                  <form onSubmit={invite} className="mt-5 flex gap-2">
                    <input className="field" type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="teammate@company.com" required />
                    <button className="btn-primary px-4">Invite</button>
                  </form>
                  {notice && <p className="mt-3 text-sm font-medium text-emerald-700">{notice}</p>}
                </section>
              )}
            </div>

            <section className="card">
              <div className="flex items-start justify-between">
                <div><p className="eyebrow">Live feed</p><h2 className="mt-2 text-xl font-bold">Activity timeline</h2><p className="mt-1 text-xs text-slate-400">Refreshes every 5 seconds</p></div>
                <Link href={`/teams/${id}/tasks`} className="btn-secondary px-4 py-2 text-sm">Manage tasks</Link>
              </div>
              <div className="mt-7"><Timeline activities={activities} /></div>
            </section>
          </div>
        </>
      )}
    </main>
  );
}
