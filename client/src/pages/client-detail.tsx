import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { StatusBadge } from "@/components/status-badge";
import { formatPhone, formatDate, formatCurrency, statusLabel } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, MapPin, Phone, Mail, ChevronRight, Check } from "lucide-react";
import { TouchpointLink } from "@/components/touchpoint-link";
import type { Client, Project, Task, FollowUp } from "@shared/schema";
import { useState } from "react";

const followUpTypeLabels: Record<string, string> = {
  day1_thank_you: "Day 1 — Thank You",
  day3_checkin: "Day 3 — Check-in",
  day7_value: "Day 7 — Value",
  day14_final: "Day 14 — Final",
  custom: "Custom",
};

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const clientId = Number(id);
  const { toast } = useToast();
  const [editStatus, setEditStatus] = useState(false);

  const { data: client, isLoading } = useQuery({
    queryKey: ["/api/clients", clientId],
    queryFn: () => apiRequest<Client>(`/api/clients/${clientId}`),
  });
  const { data: allProjects = [] } = useQuery({
    queryKey: ["/api/projects"],
    queryFn: () => apiRequest<Project[]>("/api/projects"),
  });
  const { data: allTasks = [] } = useQuery({
    queryKey: ["/api/tasks"],
    queryFn: () => apiRequest<Task[]>("/api/tasks"),
  });
  const { data: followUps = [] } = useQuery({
    queryKey: ["/api/follow-ups", clientId],
    queryFn: () => apiRequest<FollowUp[]>(`/api/follow-ups?clientId=${clientId}`),
  });

  const clientProjects = allProjects.filter((p) => p.clientId === clientId);
  const clientTasks = allTasks.filter((t) => t.clientId === clientId);

  const updateClientMutation = useMutation({
    mutationFn: (data: Partial<Client>) =>
      apiRequest<Client>(`/api/clients/${clientId}`, { method: "PUT", body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients", clientId] });
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      setEditStatus(false);
      toast({ title: "Updated", description: "Client status updated." });
    },
  });

  const updateFollowUpMutation = useMutation({
    mutationFn: ({ fuId, data }: { fuId: number; data: Partial<FollowUp> }) =>
      apiRequest<FollowUp>(`/api/follow-ups/${fuId}`, { method: "PUT", body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/follow-ups", clientId] });
      queryClient.invalidateQueries({ queryKey: ["/api/follow-ups"] });
      toast({ title: "Follow-up updated" });
    },
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-muted rounded w-48" />
          <div className="h-24 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Client not found.</p>
        <Link href="/clients">
          <Button variant="outline" className="mt-4" size="sm">Back to Clients</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-5 max-w-5xl mx-auto">
      {/* Back nav */}
      <Link href="/clients" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground" data-testid="link-back-clients">
        <ArrowLeft className="w-3.5 h-3.5" />
        Clients
      </Link>

      {/* Header card */}
      <div className="bg-card border rounded-lg p-5">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4 justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground" data-testid="client-detail-name">
              {client.firstName} {client.lastName}
            </h1>
            <div className="flex flex-wrap items-center gap-3 mt-2">
              {editStatus ? (
                <div className="flex items-center gap-2">
                  <Select
                    value={client.status}
                    onValueChange={(v) => updateClientMutation.mutate({ status: v })}
                  >
                    <SelectTrigger className="h-7 text-xs w-40" data-testid="select-edit-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["lead","appointment_set","quoted","sold","completed"].map(s => (
                        <SelectItem key={s} value={s}>{statusLabel(s)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <button
                    onClick={() => setEditStatus(false)}
                    className="text-xs text-muted-foreground hover:text-foreground"
                    data-testid="button-cancel-edit-status"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setEditStatus(true)}
                  className="group"
                  data-testid="button-edit-status"
                >
                  <StatusBadge status={client.status} className="group-hover:opacity-80 cursor-pointer" />
                </button>
              )}
              {client.source && (
                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full capitalize">
                  {client.source.replace(/_/g, " ")}
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-1.5 text-sm text-muted-foreground">
            {client.phone && (
              <div className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5" />
                <span data-testid="client-phone">{formatPhone(client.phone)}</span>
              </div>
            )}
            {client.email && (
              <div className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" />
                <span data-testid="client-email">{client.email}</span>
              </div>
            )}
            {client.address && (
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" />
                <span data-testid="client-address">
                  {client.address}{client.city ? `, ${client.city}` : ""}{client.state ? `, ${client.state}` : ""} {client.zip || ""}
                </span>
              </div>
            )}
          </div>
        </div>
        {/* TouchPoint button */}
        <div className="border-t pt-4 mt-4">
          <TouchpointLink client={client} />
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
          <TabsTrigger value="projects" data-testid="tab-projects">
            Projects {clientProjects.length > 0 && `(${clientProjects.length})`}
          </TabsTrigger>
          <TabsTrigger value="tasks" data-testid="tab-tasks">
            Tasks {clientTasks.length > 0 && `(${clientTasks.length})`}
          </TabsTrigger>
          <TabsTrigger value="followups" data-testid="tab-followups">
            Follow-ups {followUps.length > 0 && `(${followUps.length})`}
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-4 space-y-4">
          <div className="bg-card border rounded-lg p-5">
            <h3 className="text-sm font-semibold mb-3">Notes</h3>
            <textarea
              className="w-full min-h-[120px] text-sm border rounded-lg p-3 bg-background resize-none focus:outline-none focus:ring-1 focus:ring-ring"
              placeholder="Add notes about this client..."
              defaultValue={client.notes || ""}
              onBlur={(e) => {
                if (e.target.value !== (client.notes || "")) {
                  updateClientMutation.mutate({ notes: e.target.value });
                }
              }}
              data-testid="textarea-client-notes"
            />
          </div>
          <div className="bg-card border rounded-lg p-5">
            <h3 className="text-sm font-semibold mb-3">Key Dates</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created</span>
                <span className="font-medium">{formatDate(client.createdAt)}</span>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Projects Tab */}
        <TabsContent value="projects" className="mt-4">
          <div className="bg-card border rounded-lg overflow-hidden">
            {clientProjects.length === 0 ? (
              <div className="py-10 text-center text-sm text-muted-foreground">No projects yet</div>
            ) : (
              <div className="divide-y">
                {clientProjects.map((p) => (
                  <Link
                    key={p.id}
                    href={`/projects/${p.id}`}
                    className="flex items-center justify-between px-5 py-3 hover:bg-muted/50 group"
                    data-testid={`client-project-${p.id}`}
                  >
                    <div>
                      <div className="text-sm font-medium">{p.name}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {formatCurrency(p.total)} · {p.installDate ? `Install: ${formatDate(p.installDate, "MMM d, yyyy")}` : "No install date"}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={p.status} />
                      <ChevronRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Tasks Tab */}
        <TabsContent value="tasks" className="mt-4">
          <div className="bg-card border rounded-lg overflow-hidden">
            {clientTasks.length === 0 ? (
              <div className="py-10 text-center text-sm text-muted-foreground">No tasks for this client</div>
            ) : (
              <div className="divide-y">
                {clientTasks.map((task) => (
                  <div key={task.id} className="px-5 py-3 flex items-start gap-3" data-testid={`client-task-${task.id}`}>
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-1.5 ${
                      task.priority === "urgent" ? "bg-red-500" :
                      task.priority === "high" ? "bg-orange-500" :
                      task.priority === "medium" ? "bg-blue-500" : "bg-slate-400"
                    }`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">{task.title}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {task.dueDate ? `Due ${formatDate(task.dueDate)}` : "No due date"}
                      </div>
                    </div>
                    <StatusBadge status={task.status} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Follow-ups Tab */}
        <TabsContent value="followups" className="mt-4">
          <div className="bg-card border rounded-lg overflow-hidden">
            {followUps.length === 0 ? (
              <div className="py-10 text-center text-sm text-muted-foreground">No follow-ups scheduled</div>
            ) : (
              <div className="divide-y">
                {followUps.map((fu) => (
                  <div key={fu.id} className="px-5 py-3 flex items-center gap-3" data-testid={`followup-item-${fu.id}`}>
                    <button
                      onClick={() => {
                        if (fu.status === "pending") {
                          updateFollowUpMutation.mutate({
                            fuId: fu.id,
                            data: { status: "completed", completedAt: new Date().toISOString().split("T")[0] },
                          });
                        }
                      }}
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                        fu.status === "completed"
                          ? "bg-green-500 border-green-500 text-white"
                          : "border-border hover:border-primary"
                      }`}
                      data-testid={`button-complete-followup-${fu.id}`}
                    >
                      {fu.status === "completed" && <Check className="w-3 h-3" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">
                        {followUpTypeLabels[fu.type] || fu.type}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        Scheduled: {formatDate(fu.scheduledDate)}
                        {fu.completedAt && ` · Completed: ${formatDate(fu.completedAt)}`}
                      </div>
                      {fu.notes && <div className="text-xs text-muted-foreground mt-0.5 italic">{fu.notes}</div>}
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={fu.status} />
                      {fu.status === "pending" && (
                        <button
                          onClick={() => updateFollowUpMutation.mutate({ fuId: fu.id, data: { status: "skipped" } })}
                          className="text-xs text-muted-foreground hover:text-foreground"
                          data-testid={`button-skip-followup-${fu.id}`}
                        >
                          Skip
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
