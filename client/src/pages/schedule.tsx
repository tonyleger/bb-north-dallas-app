import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { EventDialog } from "@/components/event-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { Plus, CalendarDays } from "lucide-react";
import { getEventTypeLabel, eventTypeColors, EVENT_TYPES } from "@/lib/event-types";
import type { Event, User } from "@shared/schema";

// Enriched event from API (includes joined data not in the schema type)
interface EnrichedEvent extends Event {
  attendeeIds?: number[];
  attendeeNames?: string[];
  clientName?: string | null;
  projectName?: string | null;
}

export default function SchedulePage() {
  const { user: currentUser } = useAuth();
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EnrichedEvent | null>(null);
  const [myEventsOnly, setMyEventsOnly] = useState(false);
  const [typeFilters, setTypeFilters] = useState<string[]>([]);

  const { data: events = [] } = useQuery({
    queryKey: ["/api/events"],
    queryFn: () => apiRequest<any[]>("/api/events"),
  });

  // Filter events
  let filteredEvents = events;

  if (myEventsOnly && currentUser) {
    filteredEvents = filteredEvents.filter(e => e.attendeeIds?.includes(currentUser.id));
  }

  if (typeFilters.length > 0) {
    filteredEvents = filteredEvents.filter(e => typeFilters.includes(e.eventType));
  }

  // Sort by date
  filteredEvents.sort((a, b) => a.fromDate.localeCompare(b.fromDate));

  // Group by day (next 14 days)
  const now = new Date();
  const twoWeeksLater = new Date(now.getTime() + 14 * 86400000);

  const groupedByDay: Record<string, EnrichedEvent[]> = {};
  filteredEvents.forEach(e => {
    const eventDate = new Date(e.fromDate);
    if (eventDate >= now && eventDate <= twoWeeksLater) {
      const dateKey = eventDate.toISOString().split("T")[0];
      if (!groupedByDay[dateKey]) groupedByDay[dateKey] = [];
      groupedByDay[dateKey].push(e);
    }
  });

  const days = Object.entries(groupedByDay)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(0, 14);

  const monthName = now.toLocaleString("en-US", { month: "long", year: "numeric" });

  const handleEventClick = (event: EnrichedEvent) => {
    setSelectedEvent(event);
    setEventDialogOpen(true);
  };

  return (
    <div className="p-4 lg:p-6 space-y-5 max-w-6xl mx-auto">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Schedule</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{monthName}</p>
        </div>
        <Button
          onClick={() => {
            setSelectedEvent(null);
            setEventDialogOpen(true);
          }}
          className="gap-1.5"
        >
          <Plus className="w-4 h-4" />
          New Event
        </Button>
      </div>

      {/* Filters */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Checkbox
            id="myevents"
            checked={myEventsOnly}
            onCheckedChange={(checked) => setMyEventsOnly(Boolean(checked))}
          />
          <label htmlFor="myevents" className="text-sm cursor-pointer">My events only</label>
        </div>

        {/* Event type filter */}
        <div className="flex flex-wrap gap-2">
          {EVENT_TYPES.map(t => (
            <button
              key={t.value}
              onClick={() =>
                setTypeFilters(prev =>
                  prev.includes(t.value)
                    ? prev.filter(v => v !== t.value)
                    : [...prev, t.value]
                )
              }
              className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                typeFilters.includes(t.value)
                  ? "bg-primary text-white border-primary"
                  : "bg-white text-muted-foreground border-border hover:bg-muted"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Events List */}
      {days.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <CalendarDays className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">No events scheduled</p>
        </div>
      ) : (
        <div className="space-y-6">
          {days.map(([dateStr, dayEvents]) => {
            const dateObj = new Date(dateStr);
            const dayName = dateObj.toLocaleString("en-US", { weekday: "long" });
            const formattedDate = dateObj.toLocaleString("en-US", {
              month: "short",
              day: "numeric",
            });

            return (
              <div key={dateStr}>
                <h2 className="text-sm font-semibold text-muted-foreground mb-3">
                  {dayName}, {formattedDate}
                </h2>
                <div className="space-y-2">
                  {dayEvents.map(event => (
                    <Card
                      key={event.id}
                      onClick={() => handleEventClick(event)}
                      className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-semibold text-foreground">
                              {event.title}
                            </span>
                            {event.isPrivate === 1 && (
                              <Badge variant="outline" className="text-xs">Private</Badge>
                            )}
                          </div>

                          <div className="flex items-center gap-2 mb-2">
                            <Badge
                              variant="secondary"
                              className={`text-xs ${eventTypeColors[event.eventType as keyof typeof eventTypeColors]}`}
                            >
                              {getEventTypeLabel(event.eventType)}
                            </Badge>
                          </div>

                          <div className="space-y-1 text-xs text-muted-foreground">
                            <p>
                              {event.allDay
                                ? "All day"
                                : `${new Date(event.fromDate).toLocaleTimeString("en-US", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })} – ${new Date(event.toDate).toLocaleTimeString("en-US", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}`}
                            </p>
                            {event.location && <p>📍 {event.location}</p>}
                            {event.attendeeNames && event.attendeeNames.length > 0 && (
                              <p>👥 {event.attendeeNames.join(", ")}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Event Dialog */}
      <EventDialog
        open={eventDialogOpen}
        onClose={() => {
          setEventDialogOpen(false);
          setSelectedEvent(null);
        }}
        event={selectedEvent}
      />
    </div>
  );
}
