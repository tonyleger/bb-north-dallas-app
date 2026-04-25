export const EVENT_TYPES = [
  { value: "sales_design_appt", label: "Sales/Design Appointment" },
  { value: "virtual_sales_design_appt", label: "Virtual Sales/Design Appointment" },
  { value: "final_measurements", label: "Final Measurements" },
  { value: "installation", label: "Installation" },
  { value: "service", label: "Service" },
  { value: "follow_up", label: "Follow-up" },
  { value: "personal", label: "Personal" },
  { value: "vacation", label: "Vacation" },
  { value: "holiday", label: "Holiday" },
  { value: "meeting_training", label: "Meeting/Training" },
  { value: "time_block", label: "Time Block" },
] as const;

// GM is always allowed for any event type.
// For "everyone" event types, all roles are allowed.
export function getAllowedAttendeeRoles(eventType: string): string[] | "all" {
  switch (eventType) {
    case "sales_design_appt":
    case "virtual_sales_design_appt":
      return ["Sales Consultant", "GM"];
    case "final_measurements":
    case "follow_up":
      return ["Sales Consultant", "Installer", "GM"];
    case "installation":
    case "service":
      return ["Installer", "GM"];
    case "personal":
    case "vacation":
    case "holiday":
    case "meeting_training":
    case "time_block":
      return "all";
    default:
      return ["GM"];
  }
}

export function getEventTypeLabel(value: string): string {
  return EVENT_TYPES.find((t) => t.value === value)?.label ?? value;
}

// Color scheme for event type badges
export const eventTypeColors: Record<string, string> = {
  sales_design_appt: "bg-blue-100 text-blue-700",
  virtual_sales_design_appt: "bg-cyan-100 text-cyan-700",
  final_measurements: "bg-purple-100 text-purple-700",
  installation: "bg-indigo-100 text-indigo-700",
  service: "bg-orange-100 text-orange-700",
  follow_up: "bg-yellow-100 text-yellow-700",
  personal: "bg-pink-100 text-pink-700",
  vacation: "bg-green-100 text-green-700",
  holiday: "bg-red-100 text-red-700",
  meeting_training: "bg-slate-100 text-slate-700",
  time_block: "bg-gray-100 text-gray-700",
};
