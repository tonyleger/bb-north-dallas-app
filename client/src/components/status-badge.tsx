import { cn } from "@/lib/utils";

const statusColors: Record<string, string> = {
  lead: "bg-slate-100 text-slate-700",
  appointment_set: "bg-blue-100 text-blue-700",
  quoted: "bg-amber-100 text-amber-700",
  follow_up: "bg-yellow-100 text-yellow-700",
  sold: "bg-emerald-100 text-emerald-700",
  ordered: "bg-cyan-100 text-cyan-700",
  received_in_full: "bg-teal-100 text-teal-700",
  install_scheduled: "bg-indigo-100 text-indigo-700",
  in_progress: "bg-orange-100 text-orange-700",
  completed: "bg-green-100 text-green-700",
  completed_with_issues: "bg-red-100 text-red-700",
  partial_install: "bg-pink-100 text-pink-700",
  open: "bg-red-100 text-red-700",
  resolved: "bg-green-100 text-green-700",
  pending: "bg-yellow-100 text-yellow-700",
  skipped: "bg-slate-100 text-slate-700",
  needed: "bg-red-100 text-red-700",
  received: "bg-teal-100 text-teal-700",
  delivered: "bg-green-100 text-green-700",
  todo: "bg-slate-100 text-slate-700",
  done: "bg-green-100 text-green-700",
  // Window statuses
  installed: "bg-green-100 text-green-700",
  issue: "bg-red-100 text-red-700",
  // Issue severity
  urgent: "bg-red-100 text-red-700",
  high: "bg-orange-100 text-orange-700",
  medium: "bg-blue-100 text-blue-700",
  low: "bg-slate-100 text-slate-700",
};

const statusLabels: Record<string, string> = {
  lead: "Lead",
  appointment_set: "Appt Set",
  quoted: "Quoted",
  follow_up: "Follow-up",
  sold: "Sold",
  ordered: "Ordered",
  received_in_full: "Received in Full",
  install_scheduled: "Install Sched.",
  in_progress: "In Progress",
  completed: "Completed",
  completed_with_issues: "Completed w/ Issues",
  partial_install: "Partial Install",
  open: "Open",
  resolved: "Resolved",
  pending: "Pending",
  skipped: "Skipped",
  needed: "Needed",
  received: "Received",
  delivered: "Delivered",
  todo: "To Do",
  done: "Done",
  installed: "Installed",
  issue: "Issue",
  urgent: "Urgent",
  high: "High",
  medium: "Medium",
  low: "Low",
  day1_thank_you: "Day 1",
  day3_checkin: "Day 3",
  day7_value: "Day 7",
  day14_final: "Day 14",
  custom: "Custom",
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const colorClass = statusColors[status] || "bg-slate-100 text-slate-600";
  const label = statusLabels[status] || status.replace(/_/g, " ");
  return (
    <span
      data-testid={`status-badge-${status}`}
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        colorClass,
        className
      )}
    >
      {label}
    </span>
  );
}
