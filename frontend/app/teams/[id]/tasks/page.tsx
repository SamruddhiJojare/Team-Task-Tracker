"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { AppShell } from "@/components/AppShell";
import { Protected } from "@/components/AuthProvider";
import { StatusBadge } from "@/components/StatusBadge";
import { TeamNav } from "@/components/TeamNav";
import { apiFetch } from "@/lib/api";
import type { Comment, Task, TaskStatus, Team } from "@/lib/types";

const statusLabels: Record<TaskStatus, string> = {
  pending: "Pending",
  in_progress: "In progress",
  done: "Done",
};

export default function TasksPage() {
  return <Protected><AppShell><TaskManagement /></AppShell></Protected>;
}

function TaskManagement() {
  const { id } = useParams<{ id: string }>();
  const [team, setTeam] = useState<Team | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<"all" | TaskStatus>("all");
  const [showCreate, setShowCreate] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentBody, setCommentBody] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState({ title: "", description: "", assigned_to: "", status: "pending" as TaskStatus });

  const load = useCallback(async () => {
    try {
      const suffix = filter === "all" ? "" : `?status=${filter}`;
      const [teamData, taskData] = await Promise.all([
        apiFetch<Team>(`/teams/${id}/`),
        apiFetch<Task[]>(`/teams/${id}/tasks/${suffix}`),
      ]);
      setTeam(teamData);
      setTasks(taskData);
      if (!form.assigned_to && teamData.members[0]) {
        setForm((current) => ({ ...current, assigned_to: teamData.members[0].id }));
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not load tasks.");
    }
  }, [filter, form.assigned_to, id]);

  useEffect(() => { load(); }, [load]);

  async function createTask(event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      const task = await apiFetch<Task>(`/teams/${id}/tasks/`, { method: "POST", body: JSON.stringify(form) });
      setTasks((current) => [task, ...current]);
      setForm((current) => ({ title: "", description: "", assigned_to: current.assigned_to, status: "pending" }));
      setShowCreate(false);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not create task.");
    }
  }

  async function changeStatus(task: Task, status: TaskStatus) {
    const previous = tasks;
    setTasks((current) => current.map((item) => item.id === task.id ? { ...item, status } : item));
    if (selectedTask?.id === task.id) setSelectedTask({ ...selectedTask, status });
    try {
      const updated = await apiFetch<Task>(`/tasks/${task.id}/`, { method: "PATCH", body: JSON.stringify({ status }) });
      setTasks((current) => current.map((item) => item.id === task.id ? updated : item));
      if (selectedTask?.id === task.id) setSelectedTask(updated);
    } catch (caught) {
      setTasks(previous);
      setError(caught instanceof Error ? caught.message : "Could not update status.");
    }
  }

  async function openTask(task: Task) {
    setSelectedTask(task);
    try {
      setComments(await apiFetch<Comment[]>(`/tasks/${task.id}/comments/`));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not load comments.");
    }
  }

  async function addComment(event: FormEvent) {
    event.preventDefault();
    if (!selectedTask || !commentBody.trim()) return;
    try {
      const comment = await apiFetch<Comment>(`/tasks/${selectedTask.id}/comments/`, { method: "POST", body: JSON.stringify({ body: commentBody }) });
      setComments((current) => [...current, comment]);
      setCommentBody("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not add comment.");
    }
  }

  async function deleteTask(task: Task) {
    if (!window.confirm(`Delete "${task.title}"?`)) return;
    try {
      await apiFetch(`/tasks/${task.id}/`, { method: "DELETE" });
      setTasks((current) => current.filter((item) => item.id !== task.id));
      if (selectedTask?.id === task.id) setSelectedTask(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not delete task.");
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-5 py-9 lg:px-8 lg:py-12">
      <Link href={`/teams/${id}`} className="text-sm font-semibold text-slate-500 hover:text-accent">← Team overview</Link>
      <header className="mt-7 flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
          <p className="eyebrow">{team?.name ?? "Team"}</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">Task management</h1>
          <p className="mt-3 text-slate-500">Plan the work, shift its status, and keep decisions close by.</p>
        </div>
        <TeamNav teamId={id} active="tasks" />
      </header>

      {error && <div className="mt-6 flex items-center justify-between rounded-2xl bg-red-50 p-4 text-sm font-medium text-red-700"><span>{error}</span><button onClick={() => setError("")}>×</button></div>}

      <section className="mt-8 flex flex-col justify-between gap-4 rounded-2xl bg-white p-3 shadow-sm md:flex-row md:items-center">
        <div className="flex flex-wrap gap-1">
          {(["all", "pending", "in_progress", "done"] as const).map((value) => (
            <button key={value} onClick={() => setFilter(value)} className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${filter === value ? "bg-ink text-white" : "text-slate-500 hover:bg-slate-50"}`}>
              {value === "all" ? "All tasks" : statusLabels[value]}
            </button>
          ))}
        </div>
        <button className="btn-primary px-4 py-2 text-sm" onClick={() => setShowCreate(!showCreate)}>{showCreate ? "Close" : "+ Add task"}</button>
      </section>

      {showCreate && team && (
        <form onSubmit={createTask} className="card mt-5 grid gap-4 lg:grid-cols-2">
          <label><span className="label">Task title</span><input className="field" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Design API endpoints" required /></label>
          <label><span className="label">Assignee</span><select className="field" value={form.assigned_to} onChange={(e) => setForm({ ...form, assigned_to: e.target.value })}>{team.members.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}</select></label>
          <label className="lg:col-span-2"><span className="label">Description</span><textarea className="field min-h-24 resize-y" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Add context, expectations, and a clear outcome." /></label>
          <label><span className="label">Starting status</span><select className="field" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as TaskStatus })}>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <div className="flex items-end justify-end"><button className="btn-primary w-full lg:w-auto">Create task</button></div>
        </form>
      )}

      <div className="mt-6 grid gap-5 xl:grid-cols-[1fr_360px]">
        <section className="grid content-start gap-4 md:grid-cols-2">
          {tasks.map((task) => (
            <article key={task.id} className={`card cursor-pointer transition hover:-translate-y-0.5 ${selectedTask?.id === task.id ? "ring-2 ring-accent" : ""}`} onClick={() => openTask(task)}>
              <div className="flex items-start justify-between gap-3"><StatusBadge status={task.status} /><button onClick={(event) => { event.stopPropagation(); deleteTask(task); }} className="text-lg text-slate-300 hover:text-red-500" title="Delete task">×</button></div>
              <h2 className="mt-5 text-lg font-bold">{task.title}</h2>
              <p className="mt-2 line-clamp-3 min-h-[60px] text-sm leading-5 text-slate-500">{task.description || "No description added."}</p>
              <div className="mt-6 flex items-center justify-between border-t pt-4">
                <div><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Assigned to</p><p className="mt-1 text-sm font-semibold">{task.assigned_to.name}</p></div>
                <select value={task.status} onClick={(e) => e.stopPropagation()} onChange={(e) => changeStatus(task, e.target.value as TaskStatus)} className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-2 text-xs font-semibold">
                  {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </div>
            </article>
          ))}
          {!tasks.length && <div className="card col-span-full py-16 text-center"><p className="text-3xl">✓</p><h2 className="mt-4 text-lg font-bold">Nothing in this view</h2><p className="mt-2 text-sm text-slate-500">Create a task or choose another status filter.</p></div>}
        </section>

        <aside className="card h-fit xl:sticky xl:top-6">
          {selectedTask ? (
            <>
              <div className="flex items-start justify-between gap-3"><div><p className="eyebrow">Task conversation</p><h2 className="mt-2 text-xl font-bold">{selectedTask.title}</h2></div><button className="text-xl text-slate-400" onClick={() => setSelectedTask(null)}>×</button></div>
              <div className="mt-6 max-h-80 space-y-3 overflow-y-auto pr-1">
                {comments.map((comment) => (
                  <div key={comment.id} className="rounded-2xl bg-slate-50 p-4"><div className="flex justify-between gap-3"><p className="text-xs font-bold">{comment.author.name}</p><time className="text-[10px] text-slate-400">{new Intl.DateTimeFormat("en", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(comment.created_at))}</time></div><p className="mt-2 text-sm leading-6 text-slate-600">{comment.body}</p></div>
                ))}
                {!comments.length && <p className="py-8 text-center text-sm text-slate-400">No comments yet.</p>}
              </div>
              <form onSubmit={addComment} className="mt-5"><textarea className="field min-h-24 resize-y" value={commentBody} onChange={(e) => setCommentBody(e.target.value)} placeholder="Add an update or question..." required /><button className="btn-primary mt-3 w-full py-2.5 text-sm">Post comment</button></form>
            </>
          ) : (
            <div className="py-10 text-center"><div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-accent/10 text-xl text-accent">↗</div><h2 className="mt-4 font-bold">Open a task</h2><p className="mt-2 text-sm leading-6 text-slate-500">Select a task to see its conversation and add a comment.</p></div>
          )}
        </aside>
      </div>
    </main>
  );
}
