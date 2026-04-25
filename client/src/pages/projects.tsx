import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Search, Download } from "lucide-react";
import type { Project, Issue } from "@shared/schema";

interface ProjectRow extends Project {
  clientFirstName?: string;
  clientLastName?: string;
  salesAgentName?: string;
  installerName?: string;
  openIssueCount?: number;
}

const statusLabels: Record<string, string> = {
  sold: "Sold",
  ordered: "Ordered",
  partially_received: "Partially Received",
  received_in_full: "Received in Full",
  install_scheduled: "Install Scheduled",
  job_complete: "Job Complete",
  installed_with_issues: "Installed with Issues",
  complete_open_balance: "Complete Open Balance",
};

function calculateTotalDays(soldDate: string | null, resolvedDate: string | null): number {
  if (!soldDate) return 0;
  const sold = new Date(soldDate);
  const end = resolvedDate ? new Date(resolvedDate) : new Date();
  return Math.floor((end.getTime() - sold.getTime()) / (1000 * 60 * 60 * 24));
}

function formatDateMMDDYYYY(dateStr: string | null): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" });
}

export default function ProjectsPage() {
  const [activeTab, setActiveTab] = useState("sold");
  const [search, setSearch] = useState("");
  const { toast } = useToast();

  const { data: projects = [] } = useQuery({
    queryKey: ["/api/projects"],
    queryFn: () => apiRequest<ProjectRow[]>("/api/projects"),
  });

  const { data: issues = [] } = useQuery({
    queryKey: ["/api/issues"],
    queryFn: () => apiRequest<Issue[]>("/api/issues"),
  });

  const issueCountByProject = new Map(
    projects.map(p => [p.id, issues.filter(i => i.projectId === p.id && i.status === "open").length])
  );

  const handleDownloadCSV = async (tab: string) => {
    try {
      const response = await fetch(`/api/projects/export?tab=${tab}`);
      if (!response.ok) throw new Error("Failed to download");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `projects-${tab}-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch {
      toast({ title: "Error", description: "Failed to download CSV", variant: "destructive" });
    }
  };

  const filteredSold = projects
    .filter(p => p.status !== "installed_with_issues")
    .filter(p => {
      const q = search.toLowerCase();
      const clientName = `${p.clientFirstName || ""} ${p.clientLastName || ""}`;
      return !q || `${p.name} ${clientName} ${p.sidemark || ""}`.toLowerCase().includes(q);
    });

  const filteredIssues = projects
    .filter(p => p.status === "installed_with_issues")
    .filter(p => {
      const q = search.toLowerCase();
      const clientName = `${p.clientFirstName || ""} ${p.clientLastName || ""}`;
      return !q || `${p.name} ${clientName} ${p.sidemark || ""}`.toLowerCase().includes(q);
    });

  const filteredLifecycle = projects.filter(p => {
    const q = search.toLowerCase();
    const clientName = `${p.clientFirstName || ""} ${p.clientLastName || ""}`;
    return !q || `${p.name} ${clientName} ${p.sidemark || ""}`.toLowerCase().includes(q);
  });

  return (
    <div className="p-4 lg:p-6 space-y-5 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Projects</h1>
        <p className="text-sm text-muted-foreground mt-1">{projects.length} total projects</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-12 bg-slate-100 p-1 border border-slate-200 rounded-lg gap-1">
          <TabsTrigger
            value="sold"
            className="h-full text-base font-medium rounded-md cursor-pointer transition-all data-[state=active]:bg-[#1A2332] data-[state=active]:text-white data-[state=active]:shadow-md data-[state=inactive]:text-slate-600 data-[state=inactive]:hover:bg-white data-[state=inactive]:hover:text-slate-900"
          >
            Sold
          </TabsTrigger>
          <TabsTrigger
            value="issues"
            className="h-full text-base font-medium rounded-md cursor-pointer transition-all data-[state=active]:bg-[#1A2332] data-[state=active]:text-white data-[state=active]:shadow-md data-[state=inactive]:text-slate-600 data-[state=inactive]:hover:bg-white data-[state=inactive]:hover:text-slate-900"
          >
            Installed with Issues
          </TabsTrigger>
          <TabsTrigger
            value="lifecycle"
            className="h-full text-base font-medium rounded-md cursor-pointer transition-all data-[state=active]:bg-[#1A2332] data-[state=active]:text-white data-[state=active]:shadow-md data-[state=inactive]:text-slate-600 data-[state=inactive]:hover:bg-white data-[state=inactive]:hover:text-slate-900"
          >
            Lifecycle
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sold" className="space-y-4">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by client, sidemark, or project name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button variant="outline" size="sm" onClick={() => handleDownloadCSV("sold")} className="gap-2">
              <Download className="w-4 h-4" />
              Generate CSV
            </Button>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-[#1A3A52] text-white">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">CLIENT</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">SIDEMARK</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">PROJECT</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">SALES AGENT</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">TOTAL</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">OPEN BALANCE</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">STATUS</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">INSTALLER</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredSold.map((p, idx) => (
                  <tr key={p.id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="px-4 py-3">
                      <Badge variant="secondary" className="bg-blue-100 text-blue-900">
                        {p.clientFirstName}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 font-bold text-sm">{p.sidemark || "-"}</td>
                    <td className="px-4 py-3 text-sm">
                      <Link href={`/projects/${p.id}`} className="text-blue-600 hover:underline">
                        {p.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm">{p.salesAgentName || "-"}</td>
                    <td className="px-4 py-3 text-sm font-medium">{formatCurrency(p.total || 0)}</td>
                    <td className="px-4 py-3 text-sm">{p.openBalance ? formatCurrency(p.openBalance) : "-"}</td>
                    <td className="px-4 py-3 text-sm">
                      <Select defaultValue={p.status || "sold"}>
                        <SelectTrigger className="w-32 h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sold">{statusLabels.sold}</SelectItem>
                          <SelectItem value="ordered">{statusLabels.ordered}</SelectItem>
                          <SelectItem value="partially_received">{statusLabels.partially_received}</SelectItem>
                          <SelectItem value="received_in_full">{statusLabels.received_in_full}</SelectItem>
                          <SelectItem value="install_scheduled">{statusLabels.install_scheduled}</SelectItem>
                          <SelectItem value="job_complete">{statusLabels.job_complete}</SelectItem>
                          <SelectItem value="installed_with_issues">{statusLabels.installed_with_issues}</SelectItem>
                          <SelectItem value="complete_open_balance">{statusLabels.complete_open_balance}</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-4 py-3 text-sm">{p.installerName || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="issues" className="space-y-4">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by client, sidemark, or project name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button variant="outline" size="sm" onClick={() => handleDownloadCSV("issues")} className="gap-2">
              <Download className="w-4 h-4" />
              Generate CSV
            </Button>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-[#1A3A52] text-white">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">CLIENT</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">SIDEMARK</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">PROJECT</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">SALES AGENT</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">INSTALLER</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">ISSUES</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredIssues.map((p, idx) => (
                  <tr key={p.id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="px-4 py-3">
                      <Badge variant="secondary" className="bg-blue-100 text-blue-900">
                        {p.clientFirstName}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 font-bold text-sm">{p.sidemark || "-"}</td>
                    <td className="px-4 py-3 text-sm">
                      <Link href={`/projects/${p.id}`} className="text-blue-600 hover:underline">
                        {p.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm">{p.salesAgentName || "-"}</td>
                    <td className="px-4 py-3 text-sm">{p.installerName || "-"}</td>
                    <td className="px-4 py-3 text-sm">
                      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                        {issueCountByProject.get(p.id) || 0} issue{issueCountByProject.get(p.id) !== 1 ? "s" : ""}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="lifecycle" className="space-y-4">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by client, sidemark, or project name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button variant="outline" size="sm" onClick={() => handleDownloadCSV("lifecycle")} className="gap-2">
              <Download className="w-4 h-4" />
              Generate CSV
            </Button>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[#1A3A52] text-white">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">CLIENT</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">SIDEMARK</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">PROJECT</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">CREATED DATE</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">SOLD DATE</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">TOTAL DAYS CONTRACTED</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">INSTALL DATE</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">RESOLVED DATE</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredLifecycle.map((p, idx) => (
                  <tr key={p.id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="px-4 py-3">
                      <Badge variant="secondary" className="bg-blue-100 text-blue-900">
                        {p.clientFirstName}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 font-bold">{p.sidemark || "-"}</td>
                    <td className="px-4 py-3">
                      <Link href={`/projects/${p.id}`} className="text-blue-600 hover:underline">
                        {p.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3">{formatDateMMDDYYYY(p.createdDate)}</td>
                    <td className="px-4 py-3">{formatDateMMDDYYYY(p.soldDate)}</td>
                    <td className="px-4 py-3 font-medium">{calculateTotalDays(p.soldDate, p.resolvedDate)} days</td>
                    <td className="px-4 py-3">{formatDateMMDDYYYY(p.installDate)}</td>
                    <td className="px-4 py-3">{formatDateMMDDYYYY(p.resolvedDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
