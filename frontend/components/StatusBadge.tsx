import type { TaskStatus } from "@/lib/types";

const labels: Record<TaskStatus, string> = {
  pending: "Pending",
  in_progress: "In progress",
  done: "Done",
};

export function StatusBadge({ status }: { status: TaskStatus }) {
  return <span className={`status status-${status}`}>{labels[status]}</span>;
}
