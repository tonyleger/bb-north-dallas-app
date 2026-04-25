import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { EVENT_TYPES, getAllowedAttendeeRoles, getEventTypeLabel, eventTypeColors } from "@/lib/event-types";
import { X, Trash2 } from "lucide-react";
import type { Event, Client, User } from "@shared/schema";

// Enriched event type returned by the API (includes joined data)
interface EnrichedEvent extends Event {
  attendeeIds?: number[];
  attendeeNames?: string[];
  clientName?: string | null;
  projectName?: string | null;
}

interface EventDialogProps {
  open: boolean;
  onClose: () => void;
  event?: EnrichedEvent | null;
  defaultFrom?: string;
  defaultClientId?: number | null;
  defaultEventType?: string;
}

const reminderOptions = [
  { value: "none", label: "No reminder" },
  { value: "5", label: "5 minutes before" },
  { value: "15", label: "15 minutes before" },
  { value: "30", label: "30 minutes before" },
  { value: "60", label: "1 hour before" },
  { value: "1440", label: "1 day before" },
];

const recurringOptions = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

export function EventDialog({ open, onClose, event, defaultFrom, defaultClientId, defaultEventType }: EventDialogProps) {
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const titleEditedRef = useRef(false);

  // Form state
  const [title, setTitle] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [eventType, setEventType] = useState("");
  const [location, setLocation] = useState("");
  const [selectedAttendees, setSelectedAttendees] = useState<number[]>([]);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [allDay, setAllDay] = useState(false);
  const [reminderMinutes, setReminderMinutes] = useState("15");
  const [message, setMessage] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringPattern, setRecurringPattern] = useState("daily");
  const [clientId, setClientId] = useState<number | null>(null);
  const [projectId, setProjectId] = useState<number | null>(null);
  const [showAttendeeDropdown, setShowAttendeeDropdown] = useState(false);

  const { data: clients = [] } = useQuery({
    queryKey: ["/api/clients"],
    queryFn: () => apiRequest<Client[]>("/api/clients"),
  });

  const { data: users = [] } = useQuery({
    queryKey: ["/api/users"],
    queryFn: () => apiRequest<User[]>("/api/users"),
  });

  const { data: projects = [] } = useQuery({
    queryKey: ["/api/projects"],
    queryFn: () => apiRequest<any[]>("/api/projects"),
  });

  // Initialize form from event or defaults
  useEffect(() => {
    if (event) {
      setTitle(event.title);
      setIsPrivate(Boolean(event.isPrivate));
      setEventType(event.eventType);
      setLocation(event.location || "");
      setSelectedAttendees(event.attendeeIds || []);
      setFromDate(event.fromDate);
      setToDate(event.toDate);
      setAllDay(Boolean(event.allDay));
      setReminderMinutes(event.reminderMinutes?.toString() || "15");
      setMessage(event.message || "");
      setIsRecurring(Boolean(event.isRecurring));
      setRecurringPattern(event.recurringPattern || "daily");
      setClientId(event.clientId || null);
      setProjectId(event.projectId || null);
      titleEditedRef.current = true;
    } else {
      setTitle("");
      setIsPrivate(false);
      setEventType(defaultEventType || "");
      setLocation("");
      setSelectedAttendees([]);
      setFromDate(defaultFrom || "");
      setToDate(defaultFrom || "");
      setAllDay(false);
      setReminderMinutes("15");
      setMessage("");
      setIsRecurring(false);
      setRecurringPattern("daily");
      setClientId(defaultClientId ?? null);
      setProjectId(null);
      titleEditedRef.current = false;
    }
  }, [event, defaultFrom, defaultClientId, defaultEventType, open]);

  // Auto-title logic
  useEffect(() => {
    if (!titleEditedRef.current && clientId && eventType) {
      const client = clients.find(c => c.id === clientId);
      if (client) {
        const typeLabel = getEventTypeLabel(eventType);
        setTitle(`${client.firstName} ${client.lastName} - ${typeLabel}`);
      }
    }
  }, [clientId, eventType, clients]);

  // Filter attendees based on event type
  const allowedRoles = getAllowedAttendeeRoles(eventType);
  const allowedUsers = allowedRoles === "all"
    ? users
    : users.filter(u => allowedRoles.includes(u.role));

  // Show warning if attendees are removed due to type change
  useEffect(() => {
    if (eventType && selectedAttendees.length > 0) {
      const invalidAttendees = selectedAttendees.filter(
        id => !allowedUsers.find(u => u.id === id)
      );
      if (invalidAttendees.length > 0) {
        setSelectedAttendees(prev => prev.filter(id => !invalidAttendees.includes(id)));
        toast({
          title: "Attendees removed",
          description: `${invalidAttendees.length} attendee(s) are not allowed for this event type.`,
          variant: "default",
        });
      }
    }
  }, [eventType, allowedUsers, selectedAttendees, toast]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("/api/events", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      onClose();
      toast({ title: "Event created" });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) =>
      apiRequest(`/api/events/${event?.id}`, { method: "PUT", body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      onClose();
      toast({ title: "Event updated" });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => apiRequest(`/api/events/${event?.id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      onClose();
      toast({ title: "Event deleted" });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !eventType || selectedAttendees.length === 0 || !fromDate || !toDate) {
      toast({ title: "Missing required fields", variant: "destructive" });
      return;
    }

    const eventData = {
      title,
      eventType,
      location,
      fromDate: allDay ? fromDate.split("T")[0] + "T00:00:00" : fromDate,
      toDate: allDay ? toDate.split("T")[0] + "T23:59:59" : toDate,
      allDay: allDay ? 1 : 0,
      isPrivate: isPrivate ? 1 : 0,
      reminderMinutes: reminderMinutes === "none" ? null : Number(reminderMinutes),
      message,
      isRecurring: isRecurring ? 1 : 0,
      recurringPattern: isRecurring ? recurringPattern : null,
      clientId,
      projectId,
      createdBy: currentUser?.id,
      createdAt: new Date().toISOString(),
      attendeeIds: selectedAttendees,
    };

    if (event) {
      updateMutation.mutate(eventData);
    } else {
      createMutation.mutate(eventData);
    }
  };

  const handleAddAttendee = (userId: number) => {
    if (!selectedAttendees.includes(userId)) {
      setSelectedAttendees([...selectedAttendees, userId]);
    }
    setShowAttendeeDropdown(false);
  };

  const handleRemoveAttendee = (userId: number) => {
    setSelectedAttendees(selectedAttendees.filter(id => id !== userId));
  };

  const clientProjects = projectId
    ? []
    : clientId
      ? projects.filter(p => p.clientId === clientId)
      : [];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{event ? "Edit Event" : "New Event"}</DialogTitle>
          <DialogDescription>Create or edit an event with attendees</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
          {/* Title & Private */}
          <div className="flex gap-3">
            <div className="flex-1">
              <Label className="text-xs font-semibold">Event Title *</Label>
              <Input
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  titleEditedRef.current = true;
                }}
                className="mt-1"
              />
            </div>
            <div className="flex items-end gap-2 pb-0">
              <Checkbox
                id="private"
                checked={isPrivate}
                onCheckedChange={(checked) => setIsPrivate(Boolean(checked))}
              />
              <label htmlFor="private" className="text-xs cursor-pointer">Private</label>
            </div>
          </div>

          {/* Event Type */}
          <div>
            <Label className="text-xs font-semibold">Event Type *</Label>
            <Select value={eventType} onValueChange={setEventType}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select event type..." />
              </SelectTrigger>
              <SelectContent>
                {EVENT_TYPES.map(t => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Location */}
          <div>
            <Label className="text-xs font-semibold">Location</Label>
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="mt-1"
              placeholder="E.g., Conference Room A"
            />
          </div>

          {/* Attendees */}
          <div>
            <Label className="text-xs font-semibold">Attendees * ({selectedAttendees.length})</Label>
            <div className="mt-1 space-y-2">
              {selectedAttendees.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedAttendees.map(userId => {
                    const user = users.find(u => u.id === userId);
                    return user ? (
                      <Badge key={userId} variant="secondary" className="gap-1">
                        {user.name}
                        <button
                          type="button"
                          onClick={() => handleRemoveAttendee(userId)}
                          className="hover:text-destructive"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ) : null;
                  })}
                </div>
              )}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowAttendeeDropdown(!showAttendeeDropdown)}
                  className="w-full px-3 py-2 text-sm border rounded-md bg-white hover:bg-muted text-left"
                >
                  + Add attendee
                </button>
                {showAttendeeDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 border rounded-md bg-white shadow-lg z-10 max-h-48 overflow-y-auto">
                    {allowedUsers
                      .filter(u => !selectedAttendees.includes(u.id))
                      .map(user => (
                        <button
                          key={user.id}
                          type="button"
                          onClick={() => handleAddAttendee(user.id)}
                          className="w-full px-3 py-2 text-sm text-left hover:bg-muted"
                        >
                          {user.name} ({user.role})
                        </button>
                      ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Date/Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-semibold">From *</Label>
              <Input
                type={allDay ? "date" : "datetime-local"}
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold">To *</Label>
              <Input
                type={allDay ? "date" : "datetime-local"}
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          {/* All Day */}
          <div className="flex items-center gap-2">
            <Checkbox
              id="allday"
              checked={allDay}
              onCheckedChange={(checked) => setAllDay(Boolean(checked))}
            />
            <label htmlFor="allday" className="text-xs cursor-pointer">All Day Event</label>
          </div>

          {/* Reminder */}
          <div>
            <Label className="text-xs font-semibold">Reminders</Label>
            <Select value={reminderMinutes} onValueChange={setReminderMinutes}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {reminderOptions.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Message */}
          <div>
            <Label className="text-xs font-semibold">Message/Notes</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="mt-1"
              rows={3}
              placeholder="Optional notes..."
            />
          </div>

          {/* Recurring */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Checkbox
                id="recurring"
                checked={isRecurring}
                onCheckedChange={(checked) => setIsRecurring(Boolean(checked))}
              />
              <label htmlFor="recurring" className="text-xs font-semibold cursor-pointer">Recurring Event</label>
            </div>
            {isRecurring && (
              <Select value={recurringPattern} onValueChange={setRecurringPattern}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {recurringOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Client & Project */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-semibold">Client</Label>
              <Select
                value={clientId?.toString() || "none"}
                onValueChange={(v) => {
                  setClientId(v === "none" ? null : Number(v));
                  setProjectId(null);
                }}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select client..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {clients.map(c => (
                    <SelectItem key={c.id} value={c.id.toString()}>
                      {c.firstName} {c.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-semibold">Linked Project</Label>
              <Select
                value={projectId?.toString() || "none"}
                onValueChange={(v) => setProjectId(v === "none" ? null : Number(v))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select project..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {clientProjects.map(p => (
                    <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-2 justify-between pt-4">
            {event && (
              <button
                type="button"
                onClick={() => {
                  if (confirm("Delete this event?")) {
                    deleteMutation.mutate();
                  }
                }}
                disabled={deleteMutation.isPending}
                className="flex items-center gap-1.5 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-md"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            )}
            <div className="flex gap-2 ml-auto">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {createMutation.isPending || updateMutation.isPending ? "Saving..." : event ? "Update" : "Create"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
