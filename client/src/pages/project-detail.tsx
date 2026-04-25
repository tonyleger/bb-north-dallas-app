import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { StatusBadge } from "@/components/status-badge";
import { formatCurrency, formatDate, formatPhone, statusLabel } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft, Plus, Pencil, Phone, MapPin, X, AlertTriangle,
  Camera, ClipboardCheck, Package, Wrench, CheckSquare, Save
} from "lucide-react";
import { TouchpointLink } from "@/components/touchpoint-link";
import type {
  Project, Client, User, Window as WindowType, Photo, InstallChecklist,
  Material, Issue, Task
} from "@shared/schema";
import { useState } from "react";

// Status options
const projectStatusOptions = [
  "quoted","follow_up","sold","ordered","received_in_full","install_scheduled",
  "in_progress","completed","completed_with_issues","partial_install"
];
const windowStatusOptions = ["pending","ordered","received","installed","issue"];
const mountTypes = ["IM","OM","Ceiling"];
const productTypes = [
  "Faux Wood Blind","Wood Blind","Aluminum Blind","Roller Shade","Cell Shade",
  "Roman Shade","Plantation Shutter","Solar Shade","Motorized Shade","Vertical Blind","Woven Wood Shade"
];
const issueTypes = ["damage","wrong_size","wrong_product","wrong_color","missing_parts","defective","operational","other"];
const issueSeverities = ["low","medium","high","urgent"];
const materialStatuses = ["needed","ordered","received","delivered"];
const photoTypes = ["before","during","after","issue"];

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const projectId = Number(id);
  const { toast } = useToast();
  const [editOpen, setEditOpen] = useState(false);
  const [addWindowOpen, setAddWindowOpen] = useState(false);
  const [addPhotoOpen, setAddPhotoOpen] = useState(false);
  const [addMaterialOpen, setAddMaterialOpen] = useState(false);
  const [reportIssueOpen, setReportIssueOpen] = useState(false);
  const [addTaskOpen, setAddTaskOpen] = useState(false);

  // Form state
  const [windowForm, setWindowForm] = useState({ room: "", label: "", mountType: "IM", width: "", height: "", productType: "Roller Shade", notes: "" });
  const [photoForm, setPhotoForm] = useState({ url: "", type: "before", caption: "" });
  const [materialForm, setMaterialForm] = useState({ name: "", quantity: 1, status: "needed", notes: "" });
  const [issueForm, setIssueForm] = useState({ type: "damage", severity: "medium", description: "", needsRemake: false });
  const [taskForm, setTaskForm] = useState({ title: "", description: "", priority: "medium", type: "general", dueDate: "" });
  const [editForm, setEditForm] = useState<Partial<Project>>({});

  // Queries
  const { data: project, isLoading } = useQuery({
    queryKey: ["/api/projects", projectId],
    queryFn: () => apiRequest<Project>(`/api/projects/${projectId}`),
  });
  const { data: clients = [] } = useQuery({
    queryKey: ["/api/clients"],
    queryFn: () => apiRequest<Client[]>("/api/clients"),
  });
  const { data: users = [] } = useQuery({
    queryKey: ["/api/users"],
    queryFn: () => apiRequest<User[]>("/api/users"),
  });
  const { data: windows = [] } = useQuery({
    queryKey: ["/api/windows", projectId],
    queryFn: () => apiRequest<WindowType[]>(`/api/windows?projectId=${projectId}`),
  });
  const { data: photos = [] } = useQuery({
    queryKey: ["/api/photos", projectId],
    queryFn: () => apiRequest<Photo[]>(`/api/photos?projectId=${projectId}`),
  });
  const { data: checklists = [] } = useQuery({
    queryKey: ["/api/install-checklists", projectId],
    queryFn: () => apiRequest<InstallChecklist[]>(`/api/install-checklists?projectId=${projectId}`),
  });
  const { data: materials = [] } = useQuery({
    queryKey: ["/api/materials", projectId],
    queryFn: () => apiRequest<Material[]>(`/api/materials?projectId=${projectId}`),
  });
  const { data: issues = [] } = useQuery({
    queryKey: ["/api/issues"],
    queryFn: () => apiRequest<Issue[]>("/api/issues"),
  });
  const { data: tasks = [] } = useQuery({
    queryKey: ["/api/tasks"],
    queryFn: () => apiRequest<Task[]>("/api/tasks"),
  });

  const projectIssues = issues.filter((i) => i.projectId === projectId);
  const projectTasks = tasks.filter((t) => t.projectId === projectId);

  const client = project ? clients.find((c) => c.id === project.clientId) : null;
  const userMap = Object.fromEntries(users.map((u) => [u.id, u]));
  const checklist = checklists[0] || null;

  // Mutations
  const updateProjectMutation = useMutation({
    mutationFn: (data: Partial<Project>) =>
      apiRequest<Project>(`/api/projects/${projectId}`, { method: "PUT", body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      setEditOpen(false);
      toast({ title: "Project updated" });
    },
  });

  const createWindowMutation = useMutation({
    mutationFn: (data: typeof windowForm) =>
      apiRequest<WindowType>("/api/windows", { method: "POST", body: JSON.stringify({ ...data, projectId, status: "pending" }) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/windows", projectId] });
      setAddWindowOpen(false);
      setWindowForm({ room: "", label: "", mountType: "IM", width: "", height: "", productType: "Roller Shade", notes: "" });
      toast({ title: "Window added" });
    },
  });

  const deleteWindowMutation = useMutation({
    mutationFn: (winId: number) => apiRequest(`/api/windows/${winId}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/windows", projectId] });
    },
  });

  const updateWindowMutation = useMutation({
    mutationFn: ({ winId, data }: { winId: number; data: Partial<WindowType> }) =>
      apiRequest<WindowType>(`/api/windows/${winId}`, { method: "PUT", body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/windows", projectId] });
    },
  });

  const createPhotoMutation = useMutation({
    mutationFn: (data: typeof photoForm) =>
      apiRequest<Photo>("/api/photos", { method: "POST", body: JSON.stringify({ ...data, projectId, createdAt: new Date().toISOString().split("T")[0] }) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/photos", projectId] });
      setAddPhotoOpen(false);
      setPhotoForm({ url: "", type: "before", caption: "" });
      toast({ title: "Photo added" });
    },
  });

  const createChecklistMutation = useMutation({
    mutationFn: () =>
      apiRequest<InstallChecklist>("/api/install-checklists", {
        method: "POST",
        body: JSON.stringify({ projectId, createdAt: new Date().toISOString().split("T")[0] }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/install-checklists", projectId] });
      toast({ title: "Checklist created" });
    },
  });

  const updateChecklistMutation = useMutation({
    mutationFn: (data: Partial<InstallChecklist>) =>
      apiRequest<InstallChecklist>(`/api/install-checklists/${checklist!.id}`, { method: "PUT", body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/install-checklists", projectId] });
    },
  });

  const createMaterialMutation = useMutation({
    mutationFn: (data: typeof materialForm) =>
      apiRequest<Material>("/api/materials", {
        method: "POST",
        body: JSON.stringify({ ...data, projectId, createdAt: new Date().toISOString().split("T")[0] }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/materials", projectId] });
      setAddMaterialOpen(false);
      setMaterialForm({ name: "", quantity: 1, status: "needed", notes: "" });
      toast({ title: "Material added" });
    },
  });

  const updateMaterialMutation = useMutation({
    mutationFn: ({ matId, data }: { matId: number; data: Partial<Material> }) =>
      apiRequest<Material>(`/api/materials/${matId}`, { method: "PUT", body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/materials", projectId] });
    },
  });

  const createIssueMutation = useMutation({
    mutationFn: (data: typeof issueForm) =>
      apiRequest<Issue>("/api/issues", {
        method: "POST",
        body: JSON.stringify({
          ...data,
          projectId,
          needsRemake: data.needsRemake ? 1 : 0,
          createdAt: new Date().toISOString().split("T")[0],
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/issues"] });
      setReportIssueOpen(false);
      setIssueForm({ type: "damage", severity: "medium", description: "", needsRemake: false });
      toast({ title: "Issue reported" });
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: (data: typeof taskForm) =>
      apiRequest<Task>("/api/tasks", {
        method: "POST",
        body: JSON.stringify({
          ...data,
          projectId,
          clientId: project?.clientId,
          status: "todo",
          createdAt: new Date().toISOString().split("T")[0],
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      setAddTaskOpen(false);
      setTaskForm({ title: "", description: "", priority: "medium", type: "general", dueDate: "" });
      toast({ title: "Task added" });
    },
  });

  if (isLoading) {
    return (
      <div className="p-6 animate-pulse space-y-4">
        <div className="h-32 bg-muted rounded-lg" />
        <div className="h-8 bg-muted rounded w-64" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Project not found.</p>
        <Link href="/projects"><Button variant="outline" size="sm" className="mt-4">Back to Projects</Button></Link>
      </div>
    );
  }

  // Checklist fields
  const checklistFields: Array<{ key: keyof InstallChecklist; label: string }> = [
    { key: "allProductsVerified", label: "All products verified against order" },
    { key: "allBracketsInstalled", label: "All brackets/hardware installed" },
    { key: "allTreatmentsHung", label: "All treatments hung and leveled" },
    { key: "operationVerified", label: "Operation verified (open/close/tilt)" },
    { key: "customerWalkthrough", label: "Customer walkthrough completed" },
    { key: "areaCleaned", label: "Area cleaned" },
    { key: "photosUploaded", label: "Photos uploaded" },
    { key: "customerSigned", label: "Customer signed off" },
  ];

  const allChecked = checklist && checklistFields.every((f) => checklist[f.key] === 1);

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="bg-[#1A2332] text-white px-5 lg:px-8 py-6">
        <Link href="/projects" className="inline-flex items-center gap-1.5 text-xs text-white/60 hover:text-white/90 mb-4" data-testid="link-back-projects">
          <ArrowLeft className="w-3.5 h-3.5" />
          Projects
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-start gap-4 justify-between">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-semibold" data-testid="project-detail-name">{project.name}</h1>
              <StatusBadge status={project.status} />
            </div>
            {client && (
              <div className="mt-3 flex flex-wrap gap-4 text-sm text-white/70">
                <Link href={`/clients/${client.id}`} className="hover:text-white transition-colors font-medium text-white/90 underline underline-offset-2">
                  {client.firstName} {client.lastName}
                </Link>
                {client.address && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {client.address}, {client.city}
                  </span>
                )}
                {client.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5" />
                    {formatPhone(client.phone)}
                  </span>
                )}
              </div>
            )}
            {client && <TouchpointLink client={client} />}
          </div>
          <button
            onClick={() => {
              setEditForm({
                status: project.status,
                salesRepId: project.salesRepId,
                installerId: project.installerId,
                installDate: project.installDate,
                soldDate: project.soldDate,
                total: project.total,
                notes: project.notes,
              });
              setEditOpen(true);
            }}
            className="flex items-center gap-1.5 text-xs text-white/70 hover:text-white border border-white/20 hover:border-white/40 px-3 py-1.5 rounded-lg transition-colors"
            data-testid="button-edit-project"
          >
            <Pencil className="w-3.5 h-3.5" /> Edit
          </button>
        </div>

        {/* Metrics row */}
        <div className="flex flex-wrap gap-6 mt-5 pt-5 border-t border-white/10 text-sm">
          <div>
            <div className="text-white/50 text-xs">Windows</div>
            <div className="font-semibold mt-0.5">{windows.length}</div>
          </div>
          <div>
            <div className="text-white/50 text-xs">Issues</div>
            <div className={`font-semibold mt-0.5 ${projectIssues.filter(i => i.status === "open").length > 0 ? "text-red-400" : ""}`}>
              {projectIssues.filter(i => i.status === "open").length} open
            </div>
          </div>
          <div>
            <div className="text-white/50 text-xs">Total</div>
            <div className="font-semibold mt-0.5">{formatCurrency(project.total)}</div>
          </div>
          {project.installDate && (
            <div>
              <div className="text-white/50 text-xs">Install Date</div>
              <div className="font-semibold mt-0.5">{formatDate(project.installDate, "MMM d, yyyy")}</div>
            </div>
          )}
        </div>
      </div>

      <div className="p-4 lg:p-6">
        <Tabs defaultValue="details">
          <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="details" data-testid="tab-details">Details</TabsTrigger>
            <TabsTrigger value="windows" data-testid="tab-windows">Windows ({windows.length})</TabsTrigger>
            <TabsTrigger value="photos" data-testid="tab-photos">Photos ({photos.length})</TabsTrigger>
            <TabsTrigger value="checklist" data-testid="tab-checklist">Checklist</TabsTrigger>
            <TabsTrigger value="materials" data-testid="tab-materials">Materials ({materials.length})</TabsTrigger>
            <TabsTrigger value="issues" data-testid="tab-issues">Issues ({projectIssues.length})</TabsTrigger>
            <TabsTrigger value="tasks" data-testid="tab-tasks">Tasks ({projectTasks.length})</TabsTrigger>
          </TabsList>

          {/* DETAILS TAB */}
          <TabsContent value="details" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-card border rounded-lg p-5 space-y-3">
                <h3 className="text-sm font-semibold">Project Info</h3>
                <DetailRow label="Status"><StatusBadge status={project.status} /></DetailRow>
                <DetailRow label="Sales Rep">{project.salesRepId ? userMap[project.salesRepId]?.name || "—" : "—"}</DetailRow>
                <DetailRow label="Installer">{project.installerId ? userMap[project.installerId]?.name || "—" : "—"}</DetailRow>
                <DetailRow label="Total">{formatCurrency(project.total)}</DetailRow>
                <DetailRow label="Sold Date">{formatDate(project.soldDate)}</DetailRow>
                <DetailRow label="Install Date">{formatDate(project.installDate)}</DetailRow>
                <DetailRow label="Created">{formatDate(project.createdAt)}</DetailRow>
              </div>
              <div className="bg-card border rounded-lg p-5">
                <h3 className="text-sm font-semibold mb-3">Notes</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{project.notes || "No notes."}</p>
              </div>
            </div>
          </TabsContent>

          {/* WINDOWS TAB */}
          <TabsContent value="windows" className="mt-4 space-y-3">
            <div className="flex justify-end">
              <Button size="sm" onClick={() => setAddWindowOpen(true)} className="gap-1.5" data-testid="button-add-window">
                <Plus className="w-4 h-4" />Add Window
              </Button>
            </div>
            <div className="bg-card border rounded-lg overflow-hidden">
              {windows.length === 0 ? (
                <div className="py-10 text-center text-sm text-muted-foreground">No windows added yet</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 border-b">
                      <tr>
                        {["Label","Room","Mount","Width","Height","Product","Status","Notes",""].map((h) => (
                          <th key={h} className="px-3 py-2.5 text-xs font-medium text-muted-foreground text-left">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {windows.map((win) => (
                        <tr key={win.id} className="hover:bg-muted/20" data-testid={`window-row-${win.id}`}>
                          <td className="px-3 py-2.5 font-medium">{win.label}</td>
                          <td className="px-3 py-2.5 text-muted-foreground">{win.room}</td>
                          <td className="px-3 py-2.5">
                            <span className="bg-secondary text-secondary-foreground text-xs px-1.5 py-0.5 rounded">
                              {win.mountType}
                            </span>
                          </td>
                          <td className="px-3 py-2.5">{win.width}"</td>
                          <td className="px-3 py-2.5">{win.height}"</td>
                          <td className="px-3 py-2.5 text-muted-foreground">{win.productType}</td>
                          <td className="px-3 py-2.5">
                            <Select
                              value={win.status}
                              onValueChange={(v) => updateWindowMutation.mutate({ winId: win.id, data: { status: v } })}
                            >
                              <SelectTrigger className="h-7 text-xs w-28 border-0 bg-transparent p-0" data-testid={`select-window-status-${win.id}`}>
                                <StatusBadge status={win.status} />
                              </SelectTrigger>
                              <SelectContent>
                                {windowStatusOptions.map((s) => (
                                  <SelectItem key={s} value={s}>{statusLabel(s)}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="px-3 py-2.5 text-xs text-muted-foreground max-w-xs truncate">{win.notes || "—"}</td>
                          <td className="px-3 py-2.5">
                            <button
                              onClick={() => deleteWindowMutation.mutate(win.id)}
                              className="text-muted-foreground hover:text-destructive transition-colors"
                              data-testid={`button-delete-window-${win.id}`}
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </TabsContent>

          {/* PHOTOS TAB */}
          <TabsContent value="photos" className="mt-4 space-y-3">
            <div className="flex justify-end">
              <Button size="sm" onClick={() => setAddPhotoOpen(true)} className="gap-1.5" data-testid="button-add-photo">
                <Camera className="w-4 h-4" />Upload Photo
              </Button>
            </div>
            {photos.length === 0 ? (
              <div className="py-10 text-center text-sm text-muted-foreground bg-card border rounded-lg">No photos yet</div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {photos.map((photo) => (
                  <div key={photo.id} className="bg-card border rounded-lg overflow-hidden" data-testid={`photo-card-${photo.id}`}>
                    <div className="aspect-video bg-muted overflow-hidden">
                      <img
                        src={photo.url}
                        alt={photo.caption || "Project photo"}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop";
                        }}
                      />
                    </div>
                    <div className="p-2">
                      <StatusBadge status={photo.type} className="mb-1" />
                      {photo.caption && <p className="text-xs text-muted-foreground mt-1 truncate">{photo.caption}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* CHECKLIST TAB */}
          <TabsContent value="checklist" className="mt-4">
            {!checklist ? (
              <div className="bg-card border rounded-lg p-8 text-center">
                <ClipboardCheck className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-40" />
                <p className="text-sm font-medium text-muted-foreground mb-4">No install checklist yet</p>
                <Button onClick={() => createChecklistMutation.mutate()} size="sm" disabled={createChecklistMutation.isPending} data-testid="button-create-checklist">
                  <Plus className="w-4 h-4 mr-1" />
                  Create Checklist
                </Button>
              </div>
            ) : (
              <div className="bg-card border rounded-lg overflow-hidden">
                <div className="px-5 py-4 border-b flex items-center justify-between">
                  <h3 className="text-sm font-semibold">Installation Checklist</h3>
                  {allChecked && <span className="text-xs text-green-600 font-medium">✓ All complete</span>}
                </div>
                <div className="divide-y">
                  {checklistFields.map(({ key, label }) => (
                    <div key={key} className="px-5 py-3 flex items-center gap-3" data-testid={`checklist-item-${key}`}>
                      <Checkbox
                        id={key}
                        checked={checklist[key] === 1}
                        onCheckedChange={(checked) =>
                          updateChecklistMutation.mutate({ [key]: checked ? 1 : 0 })
                        }
                        data-testid={`checkbox-${key}`}
                      />
                      <label htmlFor={key} className="text-sm cursor-pointer flex-1">{label}</label>
                    </div>
                  ))}
                </div>
                <div className="px-5 py-4 border-t">
                  <Label className="text-xs">Notes</Label>
                  <textarea
                    className="w-full mt-1.5 text-sm border rounded-lg p-3 bg-background resize-none focus:outline-none focus:ring-1 focus:ring-ring min-h-[80px]"
                    placeholder="Installation notes..."
                    defaultValue={checklist.notes || ""}
                    onBlur={(e) => {
                      if (e.target.value !== (checklist.notes || "")) {
                        updateChecklistMutation.mutate({ notes: e.target.value });
                      }
                    }}
                    data-testid="textarea-checklist-notes"
                  />
                  {!checklist.completedAt && (
                    <Button
                      className="mt-3"
                      size="sm"
                      disabled={!allChecked || updateChecklistMutation.isPending}
                      onClick={() =>
                        updateChecklistMutation.mutate({
                          completedAt: new Date().toISOString().split("T")[0],
                        })
                      }
                      data-testid="button-complete-installation"
                    >
                      <CheckSquare className="w-4 h-4 mr-1" />
                      Complete Installation
                    </Button>
                  )}
                  {checklist.completedAt && (
                    <p className="text-xs text-green-600 mt-2">
                      ✓ Installation completed on {formatDate(checklist.completedAt)}
                    </p>
                  )}
                </div>
              </div>
            )}
          </TabsContent>

          {/* MATERIALS TAB */}
          <TabsContent value="materials" className="mt-4 space-y-3">
            <div className="flex justify-end">
              <Button size="sm" onClick={() => setAddMaterialOpen(true)} className="gap-1.5" data-testid="button-add-material">
                <Package className="w-4 h-4" />Add Material
              </Button>
            </div>
            <div className="bg-card border rounded-lg overflow-hidden">
              {materials.length === 0 ? (
                <div className="py-10 text-center text-sm text-muted-foreground">No materials tracked</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 border-b">
                      <tr>
                        {["Name","Qty","Status","Notes","Ordered","Received"].map((h) => (
                          <th key={h} className="px-3 py-2.5 text-xs font-medium text-muted-foreground text-left">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {materials.map((mat) => (
                        <tr key={mat.id} data-testid={`material-row-${mat.id}`}>
                          <td className="px-3 py-2.5 font-medium">{mat.name}</td>
                          <td className="px-3 py-2.5">{mat.quantity}</td>
                          <td className="px-3 py-2.5">
                            <Select
                              value={mat.status}
                              onValueChange={(v) => updateMaterialMutation.mutate({ matId: mat.id, data: { status: v } })}
                            >
                              <SelectTrigger className="h-7 text-xs w-28 border-0 bg-transparent p-0" data-testid={`select-material-status-${mat.id}`}>
                                <StatusBadge status={mat.status} />
                              </SelectTrigger>
                              <SelectContent>
                                {materialStatuses.map((s) => (
                                  <SelectItem key={s} value={s}>{statusLabel(s)}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="px-3 py-2.5 text-xs text-muted-foreground">{mat.notes || "—"}</td>
                          <td className="px-3 py-2.5 text-xs text-muted-foreground">{formatDate(mat.orderedAt, "MMM d")}</td>
                          <td className="px-3 py-2.5 text-xs text-muted-foreground">{formatDate(mat.receivedAt, "MMM d")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </TabsContent>

          {/* ISSUES TAB */}
          <TabsContent value="issues" className="mt-4 space-y-3">
            <div className="flex justify-end">
              <Button size="sm" variant="destructive" onClick={() => setReportIssueOpen(true)} className="gap-1.5" data-testid="button-report-issue">
                <AlertTriangle className="w-4 h-4" />Report Issue
              </Button>
            </div>
            <div className="bg-card border rounded-lg overflow-hidden">
              {projectIssues.length === 0 ? (
                <div className="py-10 text-center text-sm text-muted-foreground">No issues reported</div>
              ) : (
                <div className="divide-y">
                  {projectIssues.map((issue) => (
                    <IssueRow key={issue.id} issue={issue} projectId={projectId} />
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* TASKS TAB */}
          <TabsContent value="tasks" className="mt-4 space-y-3">
            <div className="flex justify-end">
              <Button size="sm" onClick={() => setAddTaskOpen(true)} className="gap-1.5" data-testid="button-add-task">
                <Plus className="w-4 h-4" />Add Task
              </Button>
            </div>
            <div className="bg-card border rounded-lg overflow-hidden">
              {projectTasks.length === 0 ? (
                <div className="py-10 text-center text-sm text-muted-foreground">No tasks for this project</div>
              ) : (
                <div className="divide-y">
                  {projectTasks.map((task) => (
                    <div key={task.id} className="px-5 py-3 flex items-center gap-3" data-testid={`task-item-${task.id}`}>
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
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
                      <StatusBadge status={task.priority} />
                      <StatusBadge status={task.status} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* EDIT PROJECT DIALOG */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit Project</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label>Status</Label>
              <Select value={editForm.status || project.status} onValueChange={(v) => setEditForm((p) => ({ ...p, status: v }))}>
                <SelectTrigger className="mt-1" data-testid="select-edit-project-status"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {projectStatusOptions.map((s) => (
                    <SelectItem key={s} value={s}>{statusLabel(s)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Sales Rep</Label>
                <Select
                  value={editForm.salesRepId?.toString() || "none"}
                  onValueChange={(v) => setEditForm((p) => ({ ...p, salesRepId: v === "none" ? undefined : Number(v) }))}
                >
                  <SelectTrigger className="mt-1" data-testid="select-edit-sales-rep"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {users.filter((u) => ["sales_rep","owner"].includes(u.role)).map((u) => (
                      <SelectItem key={u.id} value={u.id.toString()}>{u.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Installer</Label>
                <Select
                  value={editForm.installerId?.toString() || "none"}
                  onValueChange={(v) => setEditForm((p) => ({ ...p, installerId: v === "none" ? undefined : Number(v) }))}
                >
                  <SelectTrigger className="mt-1" data-testid="select-edit-installer"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {users.filter((u) => u.role === "installer").map((u) => (
                      <SelectItem key={u.id} value={u.id.toString()}>{u.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Install Date</Label>
                <Input
                  type="date"
                  className="mt-1"
                  value={editForm.installDate || ""}
                  onChange={(e) => setEditForm((p) => ({ ...p, installDate: e.target.value || undefined }))}
                  data-testid="input-install-date"
                />
              </div>
              <div>
                <Label>Total ($)</Label>
                <Input
                  type="number"
                  className="mt-1"
                  placeholder="Dollars (not cents)"
                  value={editForm.total != null ? Math.round(editForm.total / 100) : ""}
                  onChange={(e) => setEditForm((p) => ({ ...p, total: e.target.value ? Math.round(Number(e.target.value) * 100) : undefined }))}
                  data-testid="input-total"
                />
              </div>
            </div>
            <div>
              <Label>Notes</Label>
              <textarea
                className="w-full mt-1 text-sm border rounded-lg p-3 bg-background resize-none focus:outline-none focus:ring-1 focus:ring-ring min-h-[80px]"
                value={editForm.notes || ""}
                onChange={(e) => setEditForm((p) => ({ ...p, notes: e.target.value }))}
                data-testid="textarea-project-notes"
              />
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" onClick={() => setEditOpen(false)} data-testid="button-cancel-edit">Cancel</Button>
              <Button
                onClick={() => updateProjectMutation.mutate(editForm)}
                disabled={updateProjectMutation.isPending}
                data-testid="button-save-edit"
              >
                <Save className="w-4 h-4 mr-1" />
                {updateProjectMutation.isPending ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ADD WINDOW DIALOG */}
      <Dialog open={addWindowOpen} onOpenChange={setAddWindowOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add Window</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Room *</Label>
                <Input className="mt-1" placeholder="e.g. Living Room" value={windowForm.room} onChange={(e) => setWindowForm((p) => ({ ...p, room: e.target.value }))} data-testid="input-window-room" />
              </div>
              <div>
                <Label>Label *</Label>
                <Input className="mt-1" placeholder="e.g. W1" value={windowForm.label} onChange={(e) => setWindowForm((p) => ({ ...p, label: e.target.value }))} data-testid="input-window-label" />
              </div>
            </div>
            <div>
              <Label>Product Type</Label>
              <Select value={windowForm.productType} onValueChange={(v) => setWindowForm((p) => ({ ...p, productType: v }))}>
                <SelectTrigger className="mt-1" data-testid="select-window-product"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {productTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Mount</Label>
                <Select value={windowForm.mountType} onValueChange={(v) => setWindowForm((p) => ({ ...p, mountType: v }))}>
                  <SelectTrigger className="mt-1" data-testid="select-window-mount"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {mountTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Width</Label>
                <Input className="mt-1" placeholder='72 1/4' value={windowForm.width} onChange={(e) => setWindowForm((p) => ({ ...p, width: e.target.value }))} data-testid="input-window-width" />
              </div>
              <div>
                <Label>Height</Label>
                <Input className="mt-1" placeholder='48' value={windowForm.height} onChange={(e) => setWindowForm((p) => ({ ...p, height: e.target.value }))} data-testid="input-window-height" />
              </div>
            </div>
            <div>
              <Label>Notes</Label>
              <Input className="mt-1" value={windowForm.notes} onChange={(e) => setWindowForm((p) => ({ ...p, notes: e.target.value }))} data-testid="input-window-notes" />
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" onClick={() => setAddWindowOpen(false)} data-testid="button-cancel-window">Cancel</Button>
              <Button
                onClick={() => {
                  if (!windowForm.room || !windowForm.label || !windowForm.width || !windowForm.height) {
                    toast({ title: "Please fill required fields", variant: "destructive" });
                    return;
                  }
                  createWindowMutation.mutate(windowForm);
                }}
                disabled={createWindowMutation.isPending}
                data-testid="button-save-window"
              >
                Add Window
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ADD PHOTO DIALOG */}
      <Dialog open={addPhotoOpen} onOpenChange={setAddPhotoOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Upload Photo</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2">
            <div>
              <Label>Photo URL *</Label>
              <Input className="mt-1" placeholder="https://..." value={photoForm.url} onChange={(e) => setPhotoForm((p) => ({ ...p, url: e.target.value }))} data-testid="input-photo-url" />
            </div>
            <div>
              <Label>Type</Label>
              <Select value={photoForm.type} onValueChange={(v) => setPhotoForm((p) => ({ ...p, type: v }))}>
                <SelectTrigger className="mt-1" data-testid="select-photo-type"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {photoTypes.map((t) => <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Caption</Label>
              <Input className="mt-1" value={photoForm.caption} onChange={(e) => setPhotoForm((p) => ({ ...p, caption: e.target.value }))} data-testid="input-photo-caption" />
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" onClick={() => setAddPhotoOpen(false)} data-testid="button-cancel-photo">Cancel</Button>
              <Button
                onClick={() => {
                  if (!photoForm.url) { toast({ title: "URL required", variant: "destructive" }); return; }
                  createPhotoMutation.mutate(photoForm);
                }}
                disabled={createPhotoMutation.isPending}
                data-testid="button-save-photo"
              >
                Add Photo
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ADD MATERIAL DIALOG */}
      <Dialog open={addMaterialOpen} onOpenChange={setAddMaterialOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add Material</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2">
            <div>
              <Label>Name *</Label>
              <Input className="mt-1" placeholder="e.g. Hold-down brackets" value={materialForm.name} onChange={(e) => setMaterialForm((p) => ({ ...p, name: e.target.value }))} data-testid="input-material-name" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Quantity</Label>
                <Input type="number" min={1} className="mt-1" value={materialForm.quantity} onChange={(e) => setMaterialForm((p) => ({ ...p, quantity: Number(e.target.value) }))} data-testid="input-material-qty" />
              </div>
              <div>
                <Label>Status</Label>
                <Select value={materialForm.status} onValueChange={(v) => setMaterialForm((p) => ({ ...p, status: v }))}>
                  <SelectTrigger className="mt-1" data-testid="select-material-status"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {materialStatuses.map((s) => <SelectItem key={s} value={s}>{statusLabel(s)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Notes</Label>
              <Input className="mt-1" value={materialForm.notes} onChange={(e) => setMaterialForm((p) => ({ ...p, notes: e.target.value }))} data-testid="input-material-notes" />
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" onClick={() => setAddMaterialOpen(false)} data-testid="button-cancel-material">Cancel</Button>
              <Button
                onClick={() => {
                  if (!materialForm.name) { toast({ title: "Name required", variant: "destructive" }); return; }
                  createMaterialMutation.mutate(materialForm);
                }}
                disabled={createMaterialMutation.isPending}
                data-testid="button-save-material"
              >
                Add Material
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* REPORT ISSUE DIALOG */}
      <Dialog open={reportIssueOpen} onOpenChange={setReportIssueOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Report Issue</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Type</Label>
                <Select value={issueForm.type} onValueChange={(v) => setIssueForm((p) => ({ ...p, type: v }))}>
                  <SelectTrigger className="mt-1" data-testid="select-issue-type"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {issueTypes.map((t) => <SelectItem key={t} value={t}>{t.replace(/_/g, " ")}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Severity</Label>
                <Select value={issueForm.severity} onValueChange={(v) => setIssueForm((p) => ({ ...p, severity: v }))}>
                  <SelectTrigger className="mt-1" data-testid="select-issue-severity"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {issueSeverities.map((s) => <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Description *</Label>
              <textarea
                className="w-full mt-1 text-sm border rounded-lg p-3 bg-background resize-none focus:outline-none focus:ring-1 focus:ring-ring min-h-[80px]"
                placeholder="Describe the issue..."
                value={issueForm.description}
                onChange={(e) => setIssueForm((p) => ({ ...p, description: e.target.value }))}
                data-testid="textarea-issue-description"
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="needsRemake"
                checked={issueForm.needsRemake}
                onCheckedChange={(c) => setIssueForm((p) => ({ ...p, needsRemake: !!c }))}
                data-testid="checkbox-needs-remake"
              />
              <label htmlFor="needsRemake" className="text-sm">Needs Remake</label>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" onClick={() => setReportIssueOpen(false)} data-testid="button-cancel-issue">Cancel</Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (!issueForm.description) { toast({ title: "Description required", variant: "destructive" }); return; }
                  createIssueMutation.mutate(issueForm);
                }}
                disabled={createIssueMutation.isPending}
                data-testid="button-save-issue"
              >
                Report Issue
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ADD TASK DIALOG */}
      <Dialog open={addTaskOpen} onOpenChange={setAddTaskOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add Task</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2">
            <div>
              <Label>Title *</Label>
              <Input className="mt-1" value={taskForm.title} onChange={(e) => setTaskForm((p) => ({ ...p, title: e.target.value }))} data-testid="input-task-title" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Priority</Label>
                <Select value={taskForm.priority} onValueChange={(v) => setTaskForm((p) => ({ ...p, priority: v }))}>
                  <SelectTrigger className="mt-1" data-testid="select-task-priority"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["urgent","high","medium","low"].map((p) => <SelectItem key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Due Date</Label>
                <Input type="date" className="mt-1" value={taskForm.dueDate} onChange={(e) => setTaskForm((p) => ({ ...p, dueDate: e.target.value }))} data-testid="input-task-due-date" />
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" onClick={() => setAddTaskOpen(false)} data-testid="button-cancel-task">Cancel</Button>
              <Button
                onClick={() => {
                  if (!taskForm.title) { toast({ title: "Title required", variant: "destructive" }); return; }
                  createTaskMutation.mutate(taskForm);
                }}
                disabled={createTaskMutation.isPending}
                data-testid="button-save-task"
              >
                Add Task
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-muted-foreground flex-shrink-0">{label}</span>
      <span className="font-medium text-right">{children}</span>
    </div>
  );
}

function IssueRow({ issue, projectId }: { issue: Issue; projectId: number }) {
  const [expanded, setExpanded] = useState(false);
  const [resolution, setResolution] = useState(issue.resolution || "");
  const { toast } = useToast();

  const updateMutation = useMutation({
    mutationFn: (data: Partial<Issue>) =>
      apiRequest<Issue>(`/api/issues/${issue.id}`, { method: "PUT", body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/issues"] });
      toast({ title: "Issue updated" });
    },
  });

  return (
    <div data-testid={`issue-row-${issue.id}`}>
      <button
        className="w-full px-5 py-3 flex items-center gap-3 hover:bg-muted/30 text-left"
        onClick={() => setExpanded(!expanded)}
        data-testid={`button-expand-issue-${issue.id}`}
      >
        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
          issue.severity === "urgent" ? "bg-red-600" :
          issue.severity === "high" ? "bg-orange-500" :
          issue.severity === "medium" ? "bg-amber-500" : "bg-slate-400"
        }`} />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium capitalize">{issue.type.replace(/_/g, " ")}</div>
          <div className="text-xs text-muted-foreground truncate">{issue.description}</div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {issue.needsRemake === 1 && (
            <span className="text-xs text-red-600 bg-red-50 px-1.5 py-0.5 rounded-full">Needs Remake</span>
          )}
          <StatusBadge status={issue.status} />
          <StatusBadge status={issue.severity} />
        </div>
      </button>
      {expanded && (
        <div className="px-5 pb-4 pt-1 bg-muted/10 border-t">
          <p className="text-sm mb-3">{issue.description}</p>
          <div className="space-y-2">
            <Label className="text-xs">Resolution</Label>
            <textarea
              className="w-full text-sm border rounded-lg p-3 bg-background resize-none focus:outline-none focus:ring-1 focus:ring-ring min-h-[60px]"
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              placeholder="Describe resolution..."
              data-testid={`textarea-issue-resolution-${issue.id}`}
            />
            <div className="flex gap-2 flex-wrap">
              {issue.status !== "resolved" && (
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
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={() => updateMutation.mutate({ resolution })}
                disabled={updateMutation.isPending}
                data-testid={`button-save-resolution-${issue.id}`}
              >
                <Save className="w-3.5 h-3.5 mr-1" />Save
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
