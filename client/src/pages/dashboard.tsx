import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { StatusBadge } from "@/components/status-badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FolderKanban,
  CheckSquare,
  AlertTriangle,
  DollarSign,
  Calendar,
  ChevronRight,
  Clock,
} from "lucide-react";
import type { Task, Project, Client, FollowUp } from "@shared/schema";

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
    queryFn: () => apiRequest<{ activeProjects: number; pendingTasks: number; openIssues: number; thisMonthRevenue: number; upcomingInstalls: number }>("/api/dashboard/stats"),
  });
  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ["/api/tasks"],
    queryFn: () => apiRequest<Task[]>("/api/tasks"),
  });
  const { data: projects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ["/api/projects"],
    queryFn: () => apiRequest<Project[]>("/api/projects"),
  });
  const { data: clients = [] } = useQuery({
    queryKey: ["/api/clients"],
    queryFn: () => apiRequest<Client[]>("/api/clients"),
  });
  const { data: followUps = [] } = useQuery({
    queryKey: ["/api/follow-ups"],
    queryFn: () => apiRequest<FollowUp[]>("/api/follow-ups"),
  });

  const upcomingTasks = [...tasks]
    .filter((t) => t.status !== "done" && t.status !== "completed")
    .sort((a, b) => (a.dueDate || "9999") < (b.dueDate || "9999") ? -1 : 1)
    .slice(0, 5);

  const recentProjects = [...projects]
    .sort((a, b) => b.createdAt > a.createdAt ? 1 : -1)
    .slice(0, 5);

  const today = new Date().toISOString().split("T")[0];
  const pendingFollowUps = followUps
    .filter((f) => f.status === "pending" && f.scheduledDate <= today)
    .slice(0, 6);

  const clientMap = Object.fromEntries(clients.map((c) => [c.id, c]));
  const projectMap = Object.fromEntries(projects.map((p) => [p.id, p]));

  const kpis = [
    {
      label: "Active Projects",
      value: stats?.activeProjects ?? "—",
      icon: FolderKanban,
      color: "text-blue-600",
      bg: "bg-blue-50",
      testId: "kpi-active-projects",
    },
    {
      label: "Pending Tasks",
      value: stats?.pendingTasks ?? "—",
      icon: CheckSquare,
      color: "text-amber-600",
      bg: "bg-amber-50",
      testId: "kpi-pending-tasks",
    },
    {
      label: "Open Issues",
      value: stats?.openIssues ?? "—",
      icon: AlertTriangle,
      color: "text-red-600",
      bg: "bg-red-50",
      testId: "kpi-open-issues",
    },
    {
      label: "This Month Revenue",
      value: statsLoading ? "—" : formatCurrency(stats?.thisMonthRevenue ?? 0),
      icon: DollarSign,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      testId: "kpi-revenue",
    },
    {
      label: "Upcoming Installs",
      value: stats?.upcomingInstalls ?? "—",
      icon: Calendar,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
      testId: "kpi-upcoming-installs",
    },
  ];

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-xl font-semibold text-foreground" data-testid="page-title-dashboard">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Budget Blinds North Dallas — Overview</p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="bg-card border rounded-lg p-4"
            data-testid={kpi.testId}
          >
            <div className={`inline-flex p-2 rounded-lg ${kpi.bg} mb-3`}>
              <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
            </div>
            <div className="text-xl font-bold text-foreground">
              {statsLoading ? <Skeleton className="h-7 w-12" /> : kpi.value}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* Two-column section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Upcoming Tasks */}
        <div className="bg-card border rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Upcoming Tasks</h2>
            <Link href="/schedule" className="text-xs text-primary hover:underline" data-testid="link-view-all-tasks">
              View all
            </Link>
          </div>
          <div className="divide-y">
            {tasksLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="px-4 py-3">
                  <Skeleton className="h-4 w-48 mb-1" />
                  <Skeleton className="h-3 w-24" />
                </div>
              ))
            ) : upcomingTasks.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-muted-foreground">No pending tasks</div>
            ) : (
              upcomingTasks.map((task) => {
                const client = task.clientId ? clientMap[task.clientId] : null;
                const isOverdue = task.dueDate && task.dueDate < today;
                return (
                  <div key={task.id} className="px-4 py-3 flex items-start gap-3" data-testid={`task-row-${task.id}`}>
                    <div className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${
                      task.priority === "urgent" ? "bg-red-500" :
                      task.priority === "high" ? "bg-orange-500" :
                      task.priority === "medium" ? "bg-blue-500" : "bg-slate-400"
                    }`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-foreground truncate">{task.title}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        {client && (
                          <span className="text-xs text-muted-foreground">{client.firstName} {client.lastName}</span>
                        )}
                        {task.dueDate && (
                          <span className={`text-xs flex items-center gap-1 ${isOverdue ? "text-red-600 font-medium" : "text-muted-foreground"}`}>
                            <Clock className="w-3 h-3" />
                            {formatDate(task.dueDate, "MMM d")}
                          </span>
                        )}
                      </div>
                    </div>
                    <StatusBadge status={task.priority} />
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Recent Projects */}
        <div className="bg-card border rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Recent Projects</h2>
            <Link href="/projects" className="text-xs text-primary hover:underline" data-testid="link-view-all-projects">
              View all
            </Link>
          </div>
          <div className="divide-y">
            {projectsLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="px-4 py-3">
                  <Skeleton className="h-4 w-48 mb-1" />
                  <Skeleton className="h-3 w-32" />
                </div>
              ))
            ) : recentProjects.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-muted-foreground">No projects yet</div>
            ) : (
              recentProjects.map((project) => {
                const client = clientMap[project.clientId];
                return (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}`}
                    className="px-4 py-3 flex items-center justify-between hover:bg-muted/50 transition-colors group"
                    data-testid={`project-row-${project.id}`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-foreground truncate">{project.name}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        {client && (
                          <span className="text-xs text-muted-foreground">{client.firstName} {client.lastName}</span>
                        )}
                        <span className="text-xs text-muted-foreground">{formatCurrency(project.total)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={project.status} />
                      <ChevronRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Pending Follow-ups */}
      {pendingFollowUps.length > 0 && (
        <div className="bg-card border rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">
              Pending Follow-ups
              <span className="ml-2 text-xs font-normal text-red-600 bg-red-50 px-1.5 py-0.5 rounded-full">
                {pendingFollowUps.length} overdue
              </span>
            </h2>
            <Link href="/follow-ups" className="text-xs text-primary hover:underline" data-testid="link-view-all-followups">
              View all
            </Link>
          </div>
          <div className="divide-y">
            {pendingFollowUps.map((fu) => {
              const client = clientMap[fu.clientId];
              const project = fu.projectId ? projectMap[fu.projectId] : null;
              const typeLabels: Record<string, string> = {
                day1_thank_you: "Day 1 — Thank You",
                day3_checkin: "Day 3 — Check-in",
                day7_value: "Day 7 — Value",
                day14_final: "Day 14 — Final",
                custom: "Custom",
              };
              return (
                <div key={fu.id} className="px-4 py-3 flex items-center gap-3" data-testid={`followup-row-${fu.id}`}>
                  <div className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0 mt-1" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground">
                      {client ? `${client.firstName} ${client.lastName}` : "Unknown Client"}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-muted-foreground">{typeLabels[fu.type] || fu.type}</span>
                      {project && <span className="text-xs text-muted-foreground">· {project.name}</span>}
                      <span className="text-xs text-red-600">· Due {formatDate(fu.scheduledDate, "MMM d")}</span>
                    </div>
                  </div>
                  <StatusBadge status={fu.status} />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
