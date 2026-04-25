import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO, isValid } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(cents: number | null | undefined): string {
  if (cents == null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export function formatDate(dateStr: string | null | undefined, fmt = "MMM d, yyyy"): string {
  if (!dateStr) return "—";
  try {
    const date = parseISO(dateStr);
    if (!isValid(date)) return dateStr;
    return format(date, fmt);
  } catch {
    return dateStr;
  }
}

export function formatPhone(phone: string | null | undefined): string {
  if (!phone) return "—";
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return phone;
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    lead: "Lead",
    appointment_set: "Appt Set",
    quoted: "Quoted",
    follow_up: "Follow-up",
    sold: "Sold",
    ordered: "Ordered",
    received_in_full: "Received",
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
    in_progress_task: "In Progress",
    done: "Done",
    day1_thank_you: "Day 1 - Thank You",
    day3_checkin: "Day 3 - Check-in",
    day7_value: "Day 7 - Value",
    day14_final: "Day 14 - Final",
    custom: "Custom",
  };
  return labels[status] || status.replace(/_/g, " ");
}
