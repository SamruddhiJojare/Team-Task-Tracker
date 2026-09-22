"use client";

import type { Activity } from "@/lib/types";

function relativeTime(value: string) {
  const seconds = Math.floor((Date.now() - new Date(value).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(value));
}

const colors: Record<string, string> = {
  task_created: "bg-accent",
  task_updated: "bg-blue-500",
  task_commented: "bg-mint",
  task_deleted: "bg-red-400",
  team_created: "bg-amber-400",
  member_invited: "bg-violet-400",
  member_joined: "bg-emerald-500",
};

export function Timeline({ activities }: { activities: Activity[] }) {
  if (!activities.length) return <p className="py-10 text-center text-sm text-slate-500">No activity yet. Create a task to start the story.</p>;
  return (
    <ol className="space-y-1">
      {activities.map((activity, index) => (
        <li key={activity.id} className="relative grid grid-cols-[24px_1fr] gap-3 pb-6">
          {index < activities.length - 1 && <span className="absolute left-[7px] top-4 h-full w-px bg-slate-200" />}
          <span className={`relative mt-1.5 h-4 w-4 rounded-full border-4 border-white ${colors[activity.action] ?? "bg-slate-400"}`} />
          <div>
            <p className="text-sm leading-6 text-slate-700">{activity.message}</p>
            <p className="mt-1 text-xs font-medium text-slate-400">{relativeTime(activity.created_at)}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
