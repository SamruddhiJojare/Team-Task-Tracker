import Link from "next/link";

export function TeamNav({ teamId, active }: { teamId: string; active: "overview" | "tasks" }) {
  return (
    <nav className="flex gap-1 rounded-xl bg-slate-100 p-1 text-sm font-semibold">
      <Link href={`/teams/${teamId}`} className={`rounded-lg px-4 py-2 ${active === "overview" ? "bg-white text-ink shadow-sm" : "text-slate-500"}`}>Overview</Link>
      <Link href={`/teams/${teamId}/tasks`} className={`rounded-lg px-4 py-2 ${active === "tasks" ? "bg-white text-ink shadow-sm" : "text-slate-500"}`}>Tasks</Link>
    </nav>
  );
}
