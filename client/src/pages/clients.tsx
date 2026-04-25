import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { StatusBadge } from "@/components/status-badge";
import { formatPhone } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, MapPin, Phone, User, ChevronRight } from "lucide-react";
import type { Client } from "@shared/schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertClientSchema, type InsertClient } from "@shared/schema";
import { z } from "zod";

const clientFormSchema = insertClientSchema.extend({
  firstName: z.string().min(1, "First name required"),
  lastName: z.string().min(1, "Last name required"),
});

const statusTabs = [
  { value: "all", label: "All" },
  { value: "lead", label: "Leads" },
  { value: "appointment_set", label: "Appt Set" },
  { value: "quoted", label: "Quoted" },
  { value: "sold", label: "Sold" },
  { value: "completed", label: "Completed" },
];

const sourceLabels: Record<string, string> = {
  referral: "Referral",
  website: "Website",
  home_show: "Home Show",
  repeat: "Repeat",
  other: "Other",
};

const sourceColors: Record<string, string> = {
  referral: "bg-purple-100 text-purple-700",
  website: "bg-blue-100 text-blue-700",
  home_show: "bg-orange-100 text-orange-700",
  repeat: "bg-green-100 text-green-700",
  other: "bg-slate-100 text-slate-700",
};

export default function ClientsPage() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const { toast } = useToast();

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ["/api/clients"],
    queryFn: () => apiRequest<Client[]>("/api/clients"),
  });

  const form = useForm<InsertClient>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      state: "TX",
      zip: "",
      status: "lead",
      source: "website",
      notes: "",
      createdAt: new Date().toISOString().split("T")[0],
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: InsertClient) => apiRequest<Client>("/api/clients", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      setAddOpen(false);
      form.reset();
      toast({ title: "Client added", description: "New client created successfully." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create client.", variant: "destructive" });
    },
  });

  const filtered = clients.filter((c) => {
    const matchStatus = statusFilter === "all" || c.status === statusFilter;
    const q = search.toLowerCase();
    const matchSearch = !q || `${c.firstName} ${c.lastName} ${c.email} ${c.city}`.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  return (
    <div className="p-4 lg:p-6 space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground" data-testid="page-title-clients">Clients</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{clients.length} total clients</p>
        </div>
        <Button onClick={() => setAddOpen(true)} size="sm" data-testid="button-add-client" className="gap-1.5">
          <Plus className="w-4 h-4" />
          Add Client
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search clients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            data-testid="input-search-clients"
          />
        </div>
        <div className="flex gap-1 flex-wrap">
          {statusTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              data-testid={`filter-${tab.value}`}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                statusFilter === tab.value
                  ? "bg-primary text-white border-primary"
                  : "bg-white text-muted-foreground border-border hover:bg-muted"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-card border rounded-lg p-4 animate-pulse">
              <div className="h-4 bg-muted rounded w-3/4 mb-2" />
              <div className="h-3 bg-muted rounded w-1/2 mb-1" />
              <div className="h-3 bg-muted rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <User className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">No clients found</p>
          <p className="text-xs mt-1">Try adjusting your filters or add a new client.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filtered.map((client) => (
            <Link
              key={client.id}
              href={`/clients/${client.id}`}
              data-testid={`client-card-${client.id}`}
              className="bg-card border rounded-lg p-4 hover:shadow-sm hover:border-primary/30 transition-all group block"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="font-medium text-foreground text-sm leading-snug">
                  {client.firstName} {client.lastName}
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 mt-0.5" />
              </div>
              <StatusBadge status={client.status} className="mb-2" />
              {(client.city || client.state) && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                  <MapPin className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{[client.city, client.state].filter(Boolean).join(", ")}</span>
                </div>
              )}
              {client.phone && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                  <Phone className="w-3 h-3 flex-shrink-0" />
                  <span>{formatPhone(client.phone)}</span>
                </div>
              )}
              {client.source && (
                <div className="mt-2">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${sourceColors[client.source] || "bg-slate-100 text-slate-700"}`}>
                    {sourceLabels[client.source] || client.source}
                  </span>
                </div>
              )}
            </Link>
          ))}
        </div>
      )}

      {/* Add Client Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Client</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={form.handleSubmit((data) => createMutation.mutate(data))}
            className="space-y-4 mt-2"
          >
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="firstName">First Name *</Label>
                <Input id="firstName" {...form.register("firstName")} data-testid="input-first-name" className="mt-1" />
                {form.formState.errors.firstName && (
                  <p className="text-xs text-destructive mt-1">{form.formState.errors.firstName.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="lastName">Last Name *</Label>
                <Input id="lastName" {...form.register("lastName")} data-testid="input-last-name" className="mt-1" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" {...form.register("email")} data-testid="input-email" className="mt-1" />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" {...form.register("phone")} data-testid="input-phone" className="mt-1" />
              </div>
            </div>
            <div>
              <Label htmlFor="address">Address</Label>
              <Input id="address" {...form.register("address")} data-testid="input-address" className="mt-1" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label htmlFor="city">City</Label>
                <Input id="city" {...form.register("city")} data-testid="input-city" className="mt-1" />
              </div>
              <div>
                <Label htmlFor="state">State</Label>
                <Input id="state" {...form.register("state")} data-testid="input-state" className="mt-1" />
              </div>
              <div>
                <Label htmlFor="zip">Zip</Label>
                <Input id="zip" {...form.register("zip")} data-testid="input-zip" className="mt-1" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Status</Label>
                <Select value={form.watch("status") || "lead"} onValueChange={(v) => form.setValue("status", v)}>
                  <SelectTrigger className="mt-1" data-testid="select-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lead">Lead</SelectItem>
                    <SelectItem value="appointment_set">Appt Set</SelectItem>
                    <SelectItem value="quoted">Quoted</SelectItem>
                    <SelectItem value="sold">Sold</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Source</Label>
                <Select value={form.watch("source") || "website"} onValueChange={(v) => form.setValue("source", v)}>
                  <SelectTrigger className="mt-1" data-testid="select-source">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="website">Website</SelectItem>
                    <SelectItem value="referral">Referral</SelectItem>
                    <SelectItem value="home_show">Home Show</SelectItem>
                    <SelectItem value="repeat">Repeat Customer</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2 pt-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setAddOpen(false)} data-testid="button-cancel-add-client">
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending} data-testid="button-submit-add-client">
                {createMutation.isPending ? "Saving..." : "Add Client"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
