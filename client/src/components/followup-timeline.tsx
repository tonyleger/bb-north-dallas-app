import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Phone, MessageSquare, Mail, Circle, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { getTemplate, type FollowupTemplate } from "@/lib/followup-templates";
import type { FollowUp } from "@shared/schema";

interface FollowupTimelineProps {
  clientId: number;
  onSelectTemplate?: (template: FollowupTemplate) => void;
}

function getChannelIcon(template: FollowupTemplate) {
  const iconClass = "w-4 h-4";
  switch (template.channel) {
    case "call":
      return <Phone className={iconClass} />;
    case "text":
      return <MessageSquare className={iconClass} />;
    case "email":
      return <Mail className={iconClass} />;
    default:
      return null;
  }
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const dateOnly = date.toISOString().split("T")[0];
  const todayOnly = today.toISOString().split("T")[0];
  const tomorrowOnly = tomorrow.toISOString().split("T")[0];

  if (dateOnly === todayOnly) return "Today";
  if (dateOnly === tomorrowOnly) return "Tomorrow";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function FollowupTimeline({ clientId, onSelectTemplate }: FollowupTimelineProps) {
  const { toast } = useToast();
  const [expanded, setExpanded] = useState(false);
  const [selectedFollowUpId, setSelectedFollowUpId] = useState<number | null>(null);

  const { data: followUps = [] } = useQuery({
    queryKey: ["/api/follow-ups", clientId],
    queryFn: async () => {
      const res = await apiRequest(`/api/follow-ups?clientId=${clientId}`);
      return res as FollowUp[];
    },
  });

  const skipMutation = useMutation({
    mutationFn: async (followUpId: number) => {
      return apiRequest(`/api/follow-ups/${followUpId}`, {
        method: "PUT",
        body: JSON.stringify({ status: "skipped" }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/follow-ups", clientId] });
      toast({ title: "Marked as skipped" });
    },
  });

  // Sort by scheduled date
  const sorted = [...followUps].sort((a, b) =>
    new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime()
  );

  const now = new Date().toISOString().split("T")[0];
  const completed = sorted.filter((f) => f.status === "completed").length;
  const pending = sorted.filter((f) => f.status === "pending").length;
  const overdue = sorted.filter((f) => f.status === "pending" && f.scheduledDate < now).length;

  const handleSelectFollowUp = (followUp: FollowUp) => {
    setSelectedFollowUpId(followUp.id);
    const template = getTemplate(followUp.type);
    if (template) {
      onSelectTemplate?.(template);
    }
  };

  return (
    <div className="border rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center justify-between flex-1">
          <h3 className="font-semibold text-sm">Follow-up Schedule</h3>
          <div className="text-xs text-muted-foreground">
            {completed} done • {pending} pending {overdue > 0 && `• ${overdue} overdue`}
          </div>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="ml-2 p-1 hover:bg-muted rounded"
        >
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {expanded && (
        <ScrollArea className="h-80 border rounded-md p-3">
          <div className="space-y-2">
            {sorted.length === 0 ? (
              <div className="text-xs text-muted-foreground py-8 text-center">
                No follow-ups scheduled
              </div>
            ) : (
              sorted.map((followUp) => {
                const template = getTemplate(followUp.type);
                if (!template) return null;

                const isSelected = selectedFollowUpId === followUp.id;
                const isOverdue = followUp.status === "pending" && followUp.scheduledDate < now;
                const isToday = followUp.status === "pending" && followUp.scheduledDate === now;

                return (
                  <button
                    key={followUp.id}
                    onClick={() => handleSelectFollowUp(followUp)}
                    className={cn(
                      "w-full text-left p-2 rounded-md text-xs flex items-start gap-3 border transition-colors",
                      isSelected && "bg-primary/10 border-primary",
                      !isSelected && "hover:bg-muted border-transparent",
                      followUp.status === "completed" && "opacity-60"
                    )}
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      {followUp.status === "completed" && (
                        <Circle className="w-3 h-3 fill-green-500 text-green-500" />
                      )}
                      {followUp.status === "pending" && isOverdue && (
                        <Circle className="w-3 h-3 fill-orange-500 text-orange-500" />
                      )}
                      {followUp.status === "pending" && isToday && (
                        <Circle className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                      )}
                      {followUp.status === "pending" && !isOverdue && !isToday && (
                        <Circle className="w-3 h-3 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium">{template.label}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatDate(followUp.scheduledDate)}
                      </div>
                    </div>
                    <div className="flex-shrink-0 flex items-center gap-1">
                      {getChannelIcon(template)}
                      {followUp.status === "pending" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 px-1.5 text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            skipMutation.mutate(followUp.id);
                          }}
                        >
                          Skip
                        </Button>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
