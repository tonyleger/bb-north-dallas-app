import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { StatusBadge } from "@/components/status-badge";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Wrench, Save } from "lucide-react";
import type { Issue, Project, Client } from "@shared/schema";

const issueTypeLabels: Record<string, string> = {
  damage: "Damage",
  wrong_size: "Wrong Size",
  wrong_product: "Wrong Product",
  wrong_color: "Wrong Color",
  missing_parts: "Missing Parts",
  defective: "Defective",
  operational: "Operational",
  other: "Other",
};

type FilterType = "all" | "open" | "in_progress" | "resolved" | "needs_remake";

export default function ServicePage() {
  const [filter, setFilter] = useState<FilterType>("open");
  const { toast } = useToast();

  const { data: issues = [], isLoading } = useQuery({
    queryKey: ["/api/issues"],
    queryFn: () => apiRequest<Issue[]>("/api/issues"),
  });
  const { data: projects = [] } = useQuery({
    queryKey: ["/api/projects"],
    queryFn: () => apiRequest<Project[]>("/api/projects"),
  });
  const { data: clients = [] } = useQuery({
    queryKey: ["/api/clients"],
    queryFn: () => apiRequest<Client[]>("/api/clients"),
  });

  const projectMap = Object.fromEntries(projects.map((p) => [p.id, p]));
  const clientMap = Object.fromEntries(clients.map((c) => [c.id, c]));

  const filtered = issues.filter((issue) => {
    if (filter === "all") return true;
    if (filter === "needs_remake") return issue.needsRemake === 1;
    return issue.status === filter;
  }).sort((a, b) => b.createdAt > a.createdAt ? 1 : -1);

  const openCount = issues.filter(i => i.status === "open").length;
  const remakeCount = issues.filter(i => i.needsRemake === 1 && i.status !== "resolved").length;

  return (
    <div className="p-4 lg:p-6 space-y-5 max-w-4xl mx-auto">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold" data-testid="page-title-service">Service & Repair</h1>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-sm text-muted-foreground">{issues.length} total issues</p>
            {openCount > 0 && (
              <span className="text-xs font-medium text-red-600 bg-red-50 px-1.5 py-0.5 rounded-full">
                {openCount} open
              </span>
            )}
            {remakeCount > 0 && (
              <span className="text-xs font-medium text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded-full">
                {remakeCount} needs remake
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 flex-wrap">
        {[
          { value: "all", label: "All" },
          { value: "open", label: "Open" },
          { value: "in_progress", label: "In Progress" },
          { value: "resolved", label: "Resolved" },
          { value: "needs_remake", label: "Needs Remake" },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value as FilterType)}
            data-testid={`filter-service-${tab.value}`}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
              filter === tab.value
                ? "bg-primary text-white border-primary"
                : "bg-white text-muted-foreground border-border hover:bg-muted"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Issues list */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-card border rounded-lg p-4 animate-pulse h-24" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Wrench className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">No issues in this filter</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((issue) => {
            const project = projectMap[issue.projectId];
            const client = project ? clientMap[project.clientId] : null;
            return (
              <IssueCard
                key={issue.id}
                issue={issue}
                project={project}
                client={client}
                onUpdate={() => queryClient.invalidateQueries({ queryKey: ["/api/issues"] })}
                toast={toast}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

function IssueCard({
  issue,
  project,
  client,
  onUpdate,
  toast,
}: {
  issue: Issue;
  project: Project | undefined;
  client: Client | undefined | null;
  onUpdate: () => void;
  toast: ReturnType<typeof useToast>["toast"];
}) {
  const [expanded, setExpanded] = useState(false);
  const [resolution, setResolution] = useState(issue.resolution || "");

  const updateMutation = useMutation({
    mutationFn: (data: Partial<Issue>) =>
      apiRequest<Issue>(`/api/issues/${issue.id}`, { method: "PUT", body: JSON.stringify(data) }),
    onSuccess: () => {
      onUpdate();
      toast({ title: "Issue updated" });
    },
  });

  const severityColors: Record<string, string> = {
    urgent: "border-l-red-600",
    high: "border-l-orange-500",
    medium: "border-l-amber-400",
    low: "border-l-slate-300",
  };

  return (
    <div
      className={`bg-card border rounded-lg overflow-hidden border-l-4 ${severityColors[issue.severity] || "border-l-slate-300"}`}
      data-testid={`issue-card-${issue.id}`}
    >
      <button
        className="w-full px-5 py-4 flex items-start gap-4 text-left hover:bg-muted/20 transition-colors"
        onClick={() => setExpanded(!expanded)}
        data-testid={`button-expand-issue-${issue.id}`}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold">{issueTypeLabels[issue.type] || issue.type}</span>
            {issue.needsRemake === 1 && (
              <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">Needs Remake</span>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">{issue.description}</p>
          <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
            {project && (
              <Link
                href={`/projects/${project.id}`}
                className="hover:text-primary hover:underline"
                onClick={(e) => e.stopPropagation()}
                data-testid={`link-issue-project-${issue.id}`}
              >
                {project.name}
              </Link>
            )}
            {client && <span>· {client.firstName} {client.lastName}</span>}
            <span>· {formatDate(issue.createdAt, "MMM d, yyyy")}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <StatusBadge status={issue.severity} />
          <StatusBadge status={issue.status} />
        </div>
      </button>

      {expanded && (
        <div className="px-5 pb-4 pt-1 border-t bg-muted/10 space-y-3">
          <div>
            <Label className="text-xs text-muted-foreground">Full Description</Label>
            <p className="text-sm mt-1">{issue.description}</p>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Resolution Notes</Label>
            <textarea
              className="w-full mt-1 text-sm border rounded-lg p-3 bg-background resize-none focus:outline-none focus:ring-1 focus:ring-ring min-h-[80px]"
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              placeholder="Describe resolution steps and outcome..."
              data-testid={`textarea-resolution-${issue.id}`}
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {issue.status !== "resolved" && (
              <>
                {issue.status !== "in_progress" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateMutation.mutate({ status: "in_progress" })}
                    disabled={updateMutation.isPending}
                    data-testid={`button-start-issue-${issue.id}`}
                  >
                    Start Work
                  </Button>
                )}
                <Button
                  size="sm"
                  onClick={() =>
                    updateMutation.mutate({
                      status: "resolved",
                      resolution,
                      resolvedAt: new Date().toISOString().split("T")[0],
                    })
                  }
                  disabled={updateMutation.isPending}
                  data-testid={`button-resolve-issue-${issue.id}`}
                >
                  Mark Resolved
                </Button>
              </>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => updateMutation.mutate({ resolution })}
              disabled={updateMutation.isPending}
              data-testid={`button-save-resolution-${issue.id}`}
            >
              <Save className="w-3.5 h-3.5 mr-1" />Save Notes
            </Button>
          </div>
          {issue.resolvedAt && (
            <p className="text-xs text-green-600">✓ Resolved on {formatDate(issue.resolvedAt)}</p>
          )}
        </div>
      )}
    </div>
  );
}
