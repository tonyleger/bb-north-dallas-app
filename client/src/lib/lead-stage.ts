import type { Client, FollowUp, ContactLog } from "@shared/schema";

const STAGE_SEQUENCE = [
  { day: 0, label: "Day 0" },
  { day: 1, label: "Day 1" },
  { day: 3, label: "Day 3" },
  { day: 7, label: "Day 7" },
  { day: 30, label: "Day 30" },
  { day: 44, label: "Day 44" },
  { day: 58, label: "Day 58" },
  { day: 72, label: "Day 72" },
  { day: 86, label: "Day 86" },
];

export function getCurrentStage(
  followUps: FollowUp[]
): {
  label: string;
  dayNumber: number;
  isOverdue: boolean;
  nextAction?: { label: string; type: string; scheduledDate: string };
} {
  if (followUps.length === 0) {
    return { label: "Day 0", dayNumber: 0, isOverdue: false };
  }

  // Find the latest completed follow-up
  const sorted = [...followUps].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const completed = sorted.find((f) => f.status === "completed");
  const lastCompletedIndex = completed
    ? STAGE_SEQUENCE.findIndex(
        (s) =>
          s.label.toLowerCase() ===
          getFollowupTypeDayLabel(completed.type).toLowerCase()
      )
    : -1;

  // Find next pending follow-up
  const nextPending = sorted.find((f) => f.status === "pending");

  if (!nextPending) {
    return { label: "Caught up", dayNumber: 999, isOverdue: false };
  }

  const nextLabel = getFollowupTypeDayLabel(nextPending.type);
  const dayNum = extractDayNumber(nextLabel);
  const now = new Date().toISOString().split("T")[0];
  const isOverdue = nextPending.scheduledDate < now;

  return {
    label: nextLabel,
    dayNumber: dayNum,
    isOverdue,
    nextAction: {
      label: nextLabel,
      type: nextPending.type,
      scheduledDate: nextPending.scheduledDate,
    },
  };
}

export function isHotLead(client: Client): boolean {
  const created = new Date(client.createdAt).getTime();
  const now = new Date().getTime();
  const oneHourMs = 60 * 60 * 1000;
  return now - created < oneHourMs;
}

export function isStuckLead(
  client: Client,
  contactLogs: ContactLog[]
): boolean {
  if (client.status !== "lead") return false;

  const created = new Date(client.createdAt).getTime();
  const now = new Date().getTime();
  const fourteenDaysMs = 14 * 24 * 60 * 60 * 1000;

  // Created > 14 days ago
  if (now - created < fourteenDaysMs) return false;

  // No outbound contact logs
  const hasOutboundContact = contactLogs.some(
    (l) => l.clientId === client.id && l.direction === "outbound"
  );

  return !hasOutboundContact;
}

function getFollowupTypeDayLabel(type: string): string {
  const dayMatch = type.match(/day(\d+)/);
  if (dayMatch) {
    return `Day ${dayMatch[1]}`;
  }
  return type;
}

function extractDayNumber(label: string): number {
  const match = label.match(/Day (\d+)/);
  if (match) {
    return parseInt(match[1], 10);
  }
  return 0;
}
