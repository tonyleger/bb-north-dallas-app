import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { StatusBadge } from "@/components/status-badge";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, SkipForward, PhoneForwarded, Plus } from "lucide-react";
import type { FollowUp, Client, User, Project } from "@shared/schema";

const typeLabels: Record<string, string> = {
  day1_thank_you: "Day 1 — Thank You",
  day3_checkin: "Day 3 — Check-in",
  day7_value: "Day 7 — Value",
  day14_final: "Day 14 — Final",
  custom: "Custom",
};

const typeColors: Record<string, string> = {
  day1_thank_you: "bg-green-100 text-green-700",
  day3_checkin: "bg-blue-100 text-blue-700",
  day7_value: "bg-purple-100 text-purple-700",
  day14_final: "bg-orange-100 text-orange-700",
  custom: "bg-slate-100 text-slate-700",
};

type FilterType = "all" | "pending" | "completed" | "overdue";

export default function FollowUpsPage() {
  const [filter, setFilter] = useState<FilterType>("pending");
  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    clientId: "",
    projectId: "",
    type: "custom",
    scheduledDate: new Date().toISOString().split("T")[0],
    notes: "",
  });
  const { toast } = useToast();
  const today = new Date().toISOString().split("T")[0];

  const { data: followUps = [], isLoading } = useQuery({
    queryKey: ["/api/follow-ups"],
    queryFn: () => apiRequest<FollowUp[]>("/api/follow-ups"),
  });
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
    queryFn: () => apiRequest<Project[]>("/api/projects"),
  });

  const clientMap = Object.fromEntries(clients.map((c) => [c.id, c]));
  const userMap = Object.fromEntries(users.map((u) => [u.id, u]));
  const projectMap = Object.fromEntries(projects.map((p) => [p.id, p]));

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<FollowUp> }) =>
      apiRequest<FollowUp>(`/api/follow-ups/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/follow-ups"] });
      toast({ title: "Follow-up updated" });
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof addForm) =>
      apiRequest<FollowUp>("/api/follow-ups", {
        method: "POST",
        body: JSON.stringify({
          ...data,
          clientId: Number(data.clientId),
          projectId: data.projectId ? Number(data.projectId) : undefined,
          status: "pending",
          createdAt: new Date().toISOString().split("T")[0],
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/follow-ups"] });
      setAddOpen(false);
      setAddForm({ clientId: "", projectId: "", type: "custom", scheduledDate: new Date().toISOString().split("T")[0], notes: "" });
      toast({ title: "Follow-up scheduled" });
    },
  });

  // Generate follow-up sequence for a quoted project
  const generateSequenceMutation = useMutation({
    mutationFn: ({ clientId, projectId }: { clientId: number; projectId?: number }) => {
      const seq = [
        { type: "day1_thank_you", days: 1 },
        { type: "day3_checkin", days: 3 },
        { type: "day7_value", days: 7 },
        { type: "day14_final", days: 14 },
      ];
      const promises = seq.map(({ type, days }) => {
        const d = new Date();
        d.setDate(d.getDate() + days);
        return apiRequest<FollowUp>("/api/follow-ups", {
          method: "POST",
          body: JSON.stringify({
            clientId,
            projectId,
            type,
            status: "pending",
            scheduledDate: d.toISOString().split("T")[0],
            createdAt: new Date().toISOString().split("T")[0],
          }),
        });
      });
      return Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/follow-ups"] });
      toast({ title: "Follow-up sequence created", description: "Day 1, 3, 7, and 14 follow-ups scheduled." });
    },
  });

  const filtered = followUps.filter((fu) => {
    if (filter === "all") return true;
    if (filter === "pending") return fu.status === "pending";
    if (filter === "completed") return fu.status === "completed";
    if (filter === "overdue") return fu.status === "pending" && fu.scheduledDate < today;
    return true;
  }).sort((a, b) => a.scheduledDate < b.scheduledDate ? -1 : 1);

  const overdueCount = followUps.filter(f => f.status === "pending" && f.scheduledDate < today).length;
  const pendingCount = followUps.filter(f => f.status === "pending").length;

  // Quoted projects without follow-ups
  const quotedProjects = projects.filter((p) => p.status === "quoted");
  const projectsWithFollowUps = new Set(followUps.filter(f => f.projectId).map(f => f.projectId));
  const quotedWithoutFollowUps = quotedProjects.filter((p) => !projectsWithFollowUps.has(p.id));

  return (
    <div className="p-4 lg:p-6 space-y-5 max-w-4xl mx-auto">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold" data-testid="page-title-followups">Follow-ups</h1>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-sm text-muted-foreground">{pendingCount} pending</p>
            {overdueCount > 0 && (
              <span className="text-xs font-medium text-red-600 bg-red-50 px-1.5 py-0.5 rounded-full">
                {overdueCount} overdue
              </span>
            )}
          </div>
        </div>
        <Button size="sm" onClick={() => setAddOpen(true)} className="gap-1.5" data-testid="button-add-followup">
          <Plus className="w-4 h-4" />Add Follow-up
        </Button>
      </div>

      {/* Auto-generate prompt */}
      {quotedWithoutFollowUps.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <PhoneForwarded className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-800">
                {quotedWithoutFollowUps.length} quoted {quotedWithoutFollowUps.length === 1 ? "project" : "projects"} without follow-ups
              </p>
              <div className="space-y-1 mt-2">
                {quotedWithoutFollowUps.map((p) => {
                  const c = clientMap[p.clientId];
                  return (
                    <div key={p.id} className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-amber-700">{p.name} — {c ? `${c.firstName} ${c.lastName}` : "Unknown"}</span>
                      <button
                        onClick={() => generateSequenceMutation.mutate({ clientId: p.clientId, projectId: p.id })}
                        disabled={generateSequenceMutation.isPending}
                        className="text-xs underline text-amber-700 hover:text-amber-900 font-medium"
                        data-testid={`button-generate-sequence-${p.id}`}
                      >
                        Auto-generate sequence
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-1">
        {[
          { value: "all", label: "All" },
          { value: "pending", label: "Pending" },
          { value: "completed", label: "Completed" },
          { value: "overdue", label: "Overdue" },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value as FilterType)}
            data-testid={`filter-followup-${tab.value}`}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
              filter === tab.value
                ? "bg-primary text-white border-primary"
                : "bg-white text-muted-foreground border-border hover:bg-muted"
            }`}
          >
            {tab.label}
            {tab.value === "overdue" && overdueCount > 0 && (
              <span className="ml-1 bg-red-500 text-white rounded-full px-1.5 text-xs">{overdueCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-card border rounded-lg p-4 animate-pulse h-20" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <PhoneForwarded className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">No follow-ups in this filter</p>
        </div>
      ) : (
        <div className="bg-card border rounded-lg overflow-hidden">
          <div className="divide-y">
            {filtered.map((fu) => {
              const client = clientMap[fu.clientId];
              const assignee = fu.assignedTo ? userMap[fu.assignedTo] : null;
              const project = fu.projectId ? projectMap[fu.projectId] : null;
              const isOverdue = fu.status === "pending" && fu.scheduledDate < today;
              return (
                <div key={fu.id} className="px-5 py-4 flex items-start gap-3" data-testid={`followup-row-${fu.id}`}>
                  <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1.5 ${
                    fu.status === "completed" ? "bg-green-500" :
                    isOverdue ? "bg-red-500 animate-pulse" : "bg-amber-400"
                  }`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium">
                        {client ? (
                          <Link href={`/clients/${client.id}`} className="hover:underline text-primary">
                            {client.firstName} {client.lastName}
                          </Link>
                        ) : "Unknown Client"}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeColors[fu.type] || "bg-slate-100 text-slate-700"}`}>
                        {typeLabels[fu.type] || fu.type}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <span className={isOverdue ? "text-red-600 font-medium" : ""}>
                        {isOverdue ? "Overdue · " : ""}{formatDate(fu.scheduledDate, "MMM d, yyyy")}
                      </span>
                      {project && <span>· {project.name}</span>}
                      {assignee && <span>· {assignee.name}</span>}
                    </div>
                    {fu.notes && <p className="text-xs text-muted-foreground mt-1 italic">{fu.notes}</p>}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <StatusBadge status={fu.status} />
                    {fu.status === "pending" && (
                      <>
                        <button
                          onClick={() => updateMutation.mutate({
                            id: fu.id,
                            data: { status: "completed", completedAt: new Date().toISOString().split("T")[0] }
                          })}
                          className="p-1.5 rounded-lg hover:bg-green-100 text-muted-foreground hover:text-green-700 transition-colors"
                          data-testid={`button-complete-followup-${fu.id}`}
                          title="Mark complete"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => updateMutation.mutate({ id: fu.id, data: { status: "skipped" } })}
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-muted-foreground transition-colors"
                          data-testid={`button-skip-followup-${fu.id}`}
                          title="Skip"
                        >
                          <SkipForward className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add Follow-up Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Schedule Follow-up</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label>Client *</Label>
              <Select value={addForm.clientId} onValueChange={(v) => setAddForm((p) => ({ ...p, clientId: v }))}>
                <SelectTrigger className="mt-1" data-testid="select-followup-client"><SelectValue placeholder="Select client..." /></SelectTrigger>
                <SelectContent>
                  {clients.map((c) => <SelectItem key={c.id} value={c.id.toString()}>{c.firstName} {c.lastName}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Type</Label>
              <Select value={addForm.type} onValueChange={(v) => setAddForm((p) => ({ ...p, type: v }))}>
                <SelectTrigger className="mt-1" data-testid="select-followup-type"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(typeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Date *</Label>
              <Input type="date" className="mt-1" value={addForm.scheduledDate} onChange={(e) => setAddForm((p) => ({ ...p, scheduledDate: e.target.value }))} data-testid="input-followup-date" />
            </div>
            <div>
              <Label>Notes</Label>
              <Input className="mt-1" value={addForm.notes} onChange={(e) => setAddForm((p) => ({ ...p, notes: e.target.value }))} data-testid="input-followup-notes" />
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" onClick={() => setAddOpen(false)} data-testid="button-cancel-followup">Cancel</Button>
              <Button
                onClick={() => {
                  if (!addForm.clientId || !addForm.scheduledDate) {
                    toast({ title: "Client and date required", variant: "destructive" });
                    return;
                  }
                  createMutation.mutate(addForm);
                }}
                disabled={createMutation.isPending}
                data-testid="button-submit-followup"
              >
                Schedule
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
