import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  Phone,
  MessageSquare,
  Mail,
  Voicemail,
  User,
  StickyNote,
  CalendarCheck,
  ChevronDown,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ArrowUpRight,
  Plus,
  Pencil,
  AlertCircle,
  Flame,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EventDialog } from "@/components/event-dialog";
import { TouchpointLink } from "@/components/touchpoint-link";
import { getTouchpointCalendarUrl } from "@/lib/touchpoint";
import { ImportTouchpointDialog } from "@/components/import-touchpoint-dialog";
import { ContactActionButtons } from "@/components/contact-action-buttons";
import { FollowupTimeline } from "@/components/followup-timeline";
import { getTemplate, type FollowupTemplate } from "@/lib/followup-templates";
import { getCurrentStage, isHotLead, isStuckLead } from "@/lib/lead-stage";
import type { Client, ContactLog, Task, FollowUp, User as UserType } from "@shared/schema";

// ─── All existing helpers (formatRelativeTime, getSourceLabel, etc.) ───────

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) {
    const timeStr = date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    return `Yesterday at ${timeStr}`;
  }
  if (days < 7) return `${days} days ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function getSourceLabel(source: string | null): string {
  const map: Record<string, string> = {
    website: "Website",
    referral: "Referral",
    home_show: "Home Show",
    repeat: "Repeat",
    other: "Other",
  };
  return source ? (map[source] || source) : "Unknown";
}

function getSourceColor(source: string | null): string {
  const map: Record<string, string> = {
    website: "bg-blue-100 text-blue-700",
    referral: "bg-green-100 text-green-700",
    home_show: "bg-purple-100 text-purple-700",
    repeat: "bg-amber-100 text-amber-700",
    other: "bg-gray-100 text-gray-600",
  };
  return source ? (map[source] || "bg-gray-100 text-gray-600") : "bg-gray-100 text-gray-600";
}

function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    lead: "New Lead",
    appointment_set: "Appt Set",
    quoted: "Quoted",
    sold: "Sold",
    completed: "Completed",
    inactive: "Inactive",
  };
  return map[status] || status;
}

function getStatusBadgeColor(status: string): string {
  const map: Record<string, string> = {
    lead: "bg-rose-100 text-rose-700 border-rose-200",
    appointment_set: "bg-emerald-100 text-emerald-700 border-emerald-200",
    quoted: "bg-blue-100 text-blue-700 border-blue-200",
    sold: "bg-teal-100 text-teal-700 border-teal-200",
    completed: "bg-gray-100 text-gray-600 border-gray-200",
    inactive: "bg-slate-100 text-slate-600 border-slate-200",
  };
  return map[status] || "bg-gray-100 text-gray-600 border-gray-200";
}

function getContactTypeIcon(type: string) {
  const map: Record<string, typeof Phone> = {
    call: Phone,
    text: MessageSquare,
    email: Mail,
    voicemail: Voicemail,
    in_person: User,
    note: StickyNote,
  };
  return map[type] || StickyNote;
}

function getContactTypeLabel(type: string): string {
  const map: Record<string, string> = {
    call: "Call",
    text: "Text",
    email: "Email",
    voicemail: "Voicemail",
    in_person: "In Person",
    note: "Note",
  };
  return map[type] || type;
}

function getOutcomeLabel(outcome: string | null): string {
  if (!outcome) return "";
  const map: Record<string, string> = {
    connected: "Connected",
    no_answer: "No Answer",
    left_voicemail: "Left Voicemail",
    busy: "Busy",
    sent: "Sent",
    received: "Received",
    no_response: "No Response",
    bounced: "Bounced",
    left_message: "Left Message",
    met: "Met",
  };
  return map[outcome] || outcome;
}

function getOutcomeColor(outcome: string | null): string {
  if (!outcome) return "bg-gray-100 text-gray-500";
  const map: Record<string, string> = {
    connected: "bg-emerald-100 text-emerald-700",
    no_answer: "bg-orange-100 text-orange-700",
    left_voicemail: "bg-blue-100 text-blue-700",
    busy: "bg-orange-100 text-orange-700",
    sent: "bg-teal-100 text-teal-700",
    received: "bg-emerald-100 text-emerald-700",
    no_response: "bg-red-100 text-red-700",
    bounced: "bg-red-100 text-red-700",
    left_message: "bg-blue-100 text-blue-700",
    met: "bg-emerald-100 text-emerald-700",
  };
  return map[outcome] || "bg-gray-100 text-gray-500";
}

const OUTCOME_OPTIONS: Record<string, { value: string; label: string }[]> = {
  call: [
    { value: "connected", label: "Connected" },
    { value: "no_answer", label: "No Answer" },
    { value: "left_voicemail", label: "Left Voicemail" },
    { value: "busy", label: "Busy" },
  ],
  text: [
    { value: "sent", label: "Sent" },
    { value: "received", label: "Received" },
    { value: "no_response", label: "No Response" },
  ],
  email: [
    { value: "sent", label: "Sent" },
    { value: "received", label: "Received" },
    { value: "bounced", label: "Bounced" },
  ],
  voicemail: [{ value: "left_voicemail", label: "Left Message" }],
  in_person: [{ value: "met", label: "Met" }],
  note: [],
};

// ─── Log Contact Dialog ──────────────────────────────────────────────────────

interface LogContactDialogProps {
  open: boolean;
  onClose: () => void;
  clientId: number;
  clientName: string;
}

function LogContactDialog({ open, onClose, clientId, clientName }: LogContactDialogProps) {
  const { toast } = useToast();
  const [type, setType] = useState("call");
  const [direction, setDirection] = useState<"outbound" | "inbound">("outbound");
  const [outcome, setOutcome] = useState("");
  const [notes, setNotes] = useState("");

  const outcomeOptions = OUTCOME_OPTIONS[type] || [];

  const mutation = useMutation({
    mutationFn: async () => {
      const now = new Date().toISOString();
      return apiRequest("/api/contact-logs", {
        method: "POST",
        body: JSON.stringify({
          clientId,
          type,
          direction,
          outcome: outcomeOptions.length > 0 ? outcome : null,
          notes: notes.trim() || null,
          loggedBy: null,
          source: "manual",
          createdAt: now,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contact-logs", clientId] });
      queryClient.invalidateQueries({ queryKey: ["/api/contact-logs/recent"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/admin-stats"] });
      toast({ title: "Contact logged", description: `Activity recorded for ${clientName}.` });
      setType("call");
      setDirection("outbound");
      setOutcome("");
      setNotes("");
      onClose();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to log contact.", variant: "destructive" });
    },
  });

  function handleTypeChange(val: string) {
    setType(val);
    setOutcome("");
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Log Contact — {clientName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="log-type">Type</Label>
            <Select value={type} onValueChange={handleTypeChange}>
              <SelectTrigger id="log-type" data-testid="select-log-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="call">Call</SelectItem>
                <SelectItem value="text">Text</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="voicemail">Voicemail</SelectItem>
                <SelectItem value="in_person">In Person</SelectItem>
                <SelectItem value="note">Note</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Direction</Label>
            <div className="flex gap-2">
              <button
                type="button"
                data-testid="button-direction-outbound"
                onClick={() => setDirection("outbound")}
                className={cn(
                  "flex-1 py-2 px-3 rounded-md border text-sm font-medium transition-colors",
                  direction === "outbound"
                    ? "bg-[hsl(var(--primary))] text-white border-transparent"
                    : "border-border text-muted-foreground hover:border-foreground/30"
                )}
              >
                Outbound
              </button>
              <button
                type="button"
                data-testid="button-direction-inbound"
                onClick={() => setDirection("inbound")}
                className={cn(
                  "flex-1 py-2 px-3 rounded-md border text-sm font-medium transition-colors",
                  direction === "inbound"
                    ? "bg-[hsl(var(--primary))] text-white border-transparent"
                    : "border-border text-muted-foreground hover:border-foreground/30"
                )}
              >
                Inbound
              </button>
            </div>
          </div>

          {outcomeOptions.length > 0 && (
            <div className="space-y-1.5">
              <Label htmlFor="log-outcome">Outcome</Label>
              <Select value={outcome} onValueChange={setOutcome}>
                <SelectTrigger id="log-outcome" data-testid="select-log-outcome">
                  <SelectValue placeholder="Select outcome..." />
                </SelectTrigger>
                <SelectContent>
                  {outcomeOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="log-notes">Notes</Label>
            <Textarea
              id="log-notes"
              data-testid="textarea-log-notes"
              placeholder="What happened? Any details to remember..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex gap-2 pt-1">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              data-testid="button-cancel-log"
            >
              Cancel
            </Button>
            <Button
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending || (outcomeOptions.length > 0 && !outcome)}
              className="flex-1"
              data-testid="button-submit-log"
            >
              {mutation.isPending ? "Logging..." : "Log Contact"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Edit Client Dialog (same as before) ────────────────────────────────────

interface EditClientDialogProps {
  open: boolean;
  onClose: () => void;
  client: Client;
}

function EditClientDialog({ open, onClose, client }: EditClientDialogProps) {
  const { toast } = useToast();
  const [isCommercial, setIsCommercial] = useState(!!(client as any).isCommercial);
  const [businessName, setBusinessName] = useState((client as any).businessName || "");
  const [firstName, setFirstName] = useState(client.firstName);
  const [lastName, setLastName] = useState(client.lastName);
  const [email, setEmail] = useState(client.email || "");
  const [phone, setPhone] = useState(client.phone || "");
  const [secondaryContactName, setSecondaryContactName] = useState((client as any).secondaryContactName || "");
  const [secondaryContactPhone, setSecondaryContactPhone] = useState((client as any).secondaryContactPhone || "");
  const [secondaryContactEmail, setSecondaryContactEmail] = useState((client as any).secondaryContactEmail || "");
  const [address, setAddress] = useState(client.address || "");
  const [city, setCity] = useState(client.city || "");
  const [state, setState] = useState(client.state || "");
  const [zip, setZip] = useState(client.zip || "");
  const [source, setSource] = useState(client.source || "");

  useMemo(() => {
    setIsCommercial(!!(client as any).isCommercial);
    setBusinessName((client as any).businessName || "");
    setFirstName(client.firstName);
    setLastName(client.lastName);
    setEmail(client.email || "");
    setPhone(client.phone || "");
    setSecondaryContactName((client as any).secondaryContactName || "");
    setSecondaryContactPhone((client as any).secondaryContactPhone || "");
    setSecondaryContactEmail((client as any).secondaryContactEmail || "");
    setAddress(client.address || "");
    setCity(client.city || "");
    setState(client.state || "");
    setZip(client.zip || "");
    setSource(client.source || "");
  }, [client.id]);

  const mutation = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/clients/${client.id}`, {
        method: "PUT",
        body: JSON.stringify({
          isCommercial: isCommercial ? 1 : 0,
          businessName: isCommercial ? (businessName.trim() || null) : null,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim() || null,
          phone: phone.trim() || null,
          secondaryContactName: secondaryContactName.trim() || null,
          secondaryContactPhone: secondaryContactPhone.trim() || null,
          secondaryContactEmail: secondaryContactEmail.trim() || null,
          address: address.trim() || null,
          city: city.trim() || null,
          state: state.trim() || null,
          zip: zip.trim() || null,
          source: source || null,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/admin-stats"] });
      toast({ title: "Customer updated" });
      onClose();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update customer.", variant: "destructive" });
    },
  });

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[640px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Customer</DialogTitle>
        </DialogHeader>
        <div className="grid gap-5 py-2">
          <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-md">
            <Checkbox
              id="edit-is-commercial"
              checked={isCommercial}
              onCheckedChange={(checked) => setIsCommercial(!!checked)}
              data-testid="checkbox-edit-is-commercial"
            />
            <Label htmlFor="edit-is-commercial" className="font-medium cursor-pointer">
              Commercial account
            </Label>
            <span className="text-xs text-muted-foreground ml-auto">
              {isCommercial ? "Business + contact info" : "Residential customer"}
            </span>
          </div>

          {isCommercial && (
            <div>
              <Label htmlFor="edit-business">Business Name *</Label>
              <Input
                id="edit-business"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Acme Corp"
                data-testid="input-edit-business-name"
              />
            </div>
          )}

          <div className="border border-slate-200 rounded-md p-4 space-y-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-600">
              {isCommercial ? "Primary Contact" : "Customer"}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="edit-first">First Name *</Label>
                <Input
                  id="edit-first"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  data-testid="input-edit-first-name"
                />
              </div>
              <div>
                <Label htmlFor="edit-last">Last Name *</Label>
                <Input
                  id="edit-last"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  data-testid="input-edit-last-name"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="edit-phone">Phone</Label>
                <Input
                  id="edit-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(555) 123-4567"
                  data-testid="input-edit-phone"
                />
              </div>
              <div>
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  data-testid="input-edit-email"
                />
              </div>
            </div>
          </div>

          <div className="border border-slate-200 rounded-md p-4 space-y-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-600">
              Secondary Contact <span className="font-normal normal-case text-slate-400">(optional)</span>
            </div>
            <div>
              <Label htmlFor="edit-sec-name">Name</Label>
              <Input
                id="edit-sec-name"
                value={secondaryContactName}
                onChange={(e) => setSecondaryContactName(e.target.value)}
                placeholder="Jane Doe"
                data-testid="input-edit-secondary-name"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="edit-sec-phone">Phone</Label>
                <Input
                  id="edit-sec-phone"
                  type="tel"
                  value={secondaryContactPhone}
                  onChange={(e) => setSecondaryContactPhone(e.target.value)}
                  placeholder="(555) 123-4567"
                  data-testid="input-edit-secondary-phone"
                />
              </div>
              <div>
                <Label htmlFor="edit-sec-email">Email</Label>
                <Input
                  id="edit-sec-email"
                  type="email"
                  value={secondaryContactEmail}
                  onChange={(e) => setSecondaryContactEmail(e.target.value)}
                  placeholder="name@example.com"
                  data-testid="input-edit-secondary-email"
                />
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="edit-address">Address</Label>
            <Input
              id="edit-address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="123 Main St"
              data-testid="input-edit-address"
            />
          </div>

          <div className="grid grid-cols-[1fr_120px_110px] gap-3">
            <div>
              <Label htmlFor="edit-city">City</Label>
              <Input
                id="edit-city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                data-testid="input-edit-city"
              />
            </div>
            <div>
              <Label htmlFor="edit-state">State</Label>
              <Input
                id="edit-state"
                value={state}
                onChange={(e) => setState(e.target.value)}
                maxLength={2}
                placeholder="TX"
                data-testid="input-edit-state"
              />
            </div>
            <div>
              <Label htmlFor="edit-zip">Zip</Label>
              <Input
                id="edit-zip"
                value={zip}
                onChange={(e) => setZip(e.target.value)}
                data-testid="input-edit-zip"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="edit-source">Lead Source</Label>
            <Select value={source} onValueChange={setSource}>
              <SelectTrigger id="edit-source" data-testid="select-edit-source">
                <SelectValue placeholder="Select a lead source" />
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

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose} data-testid="button-cancel-edit-client">
            Cancel
          </Button>
          <Button
            onClick={() => mutation.mutate()}
            disabled={
              mutation.isPending ||
              !firstName.trim() ||
              !lastName.trim() ||
              (isCommercial && !businessName.trim())
            }
            data-testid="button-save-edit-client"
          >
            {mutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Today Tab ──────────────────────────────────────────────────────────────

interface LeadManagerStatsResponse {
  period: string;
  activity: {
    callsMade: number;
    textsSentManual: number;
    emailsSentManual: number;
    textsSentAutomated: number;
    emailsSentAutomated: number;
  };
  pipeline: {
    newLeads: number;
    apptsSet: number;
    needFollowUp: number;
  };
  todaysWork: {
    overdueCount: number;
    dueTodayCount: number;
    upcomingWeekCount: number;
  };
}

interface DueListItem {
  id: number;
  clientId: number;
  type: string;
  scheduledDate: string;
  clientName: string;
}

function TodayTab() {
  const [period, setPeriod] = useState<"today" | "week" | "month">("today");
  const { data: stats } = useQuery<LeadManagerStatsResponse>({
    queryKey: ["/api/dashboard/lead-manager-stats", period],
    queryFn: () => apiRequest(`/api/dashboard/lead-manager-stats?period=${period}`),
  });

  const { data: overdueList = [] } = useQuery<DueListItem[]>({
    queryKey: ["/api/follow-ups/due-list", "overdue"],
    queryFn: () => apiRequest("/api/follow-ups/due-list?when=overdue"),
  });

  const { data: todayList = [] } = useQuery<DueListItem[]>({
    queryKey: ["/api/follow-ups/due-list", "today"],
    queryFn: () => apiRequest("/api/follow-ups/due-list?when=today"),
  });

  const { data: weekList = [] } = useQuery<DueListItem[]>({
    queryKey: ["/api/follow-ups/due-list", "week"],
    queryFn: () => apiRequest("/api/follow-ups/due-list?when=week"),
  });

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  if (!stats) {
    return <div className="p-6 text-muted-foreground">Loading...</div>;
  }

  const StatCard = ({ icon: Icon, label, value }: { icon: any; label: string; value: number }) => (
    <div className="bg-white border rounded-lg p-4 text-center">
      <Icon className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{label}</div>
    </div>
  );

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Stats Banner */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Activity Summary</h2>
          <div className="flex gap-1">
            {(['today', 'week', 'month'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-medium transition-colors",
                  period === p
                    ? "bg-[hsl(var(--primary))] text-white"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                {p === "today" ? "Today" : p === "week" ? "This Week" : "This Month"}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard icon={Phone} label="Calls Made" value={stats.activity.callsMade} />
          <StatCard icon={MessageSquare} label="Texts Sent" value={stats.activity.textsSentManual} />
          <StatCard icon={Mail} label="Emails Sent" value={stats.activity.emailsSentManual} />
          <StatCard icon={AlertCircle} label="Auto Texts" value={stats.activity.textsSentAutomated} />
          <StatCard icon={AlertCircle} label="Auto Emails" value={stats.activity.emailsSentAutomated} />
          <StatCard icon={Flame} label="New Leads" value={stats.pipeline.newLeads} />
          <StatCard icon={CalendarCheck} label="Appts Set" value={stats.pipeline.apptsSet} />
          <StatCard icon={AlertTriangle} label="Need Follow-up" value={stats.pipeline.needFollowUp} />
        </div>
      </div>

      {/* Overdue Section */}
      {overdueList.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <h3 className="font-semibold text-red-600">Overdue ({overdueList.length})</h3>
          </div>
          <div className="space-y-2">
            {overdueList.map((item: any) => {
              const client = clients.find((c) => c.id === item.clientId);
              if (!client) return null;
              const daysOverdue = Math.floor(
                (new Date().getTime() - new Date(item.scheduledDate).getTime()) / (1000 * 60 * 60 * 24)
              );
              return (
                <div key={item.id} className="bg-red-50 border border-red-200 rounded p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{client.firstName} {client.lastName}</div>
                      <div className="text-xs text-red-600 mt-0.5">{daysOverdue} days overdue</div>
                    </div>
                    <div className="text-xs font-medium text-red-600">{item.type}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Due Today Section */}
      {todayList.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-500" />
            <h3 className="font-semibold text-amber-600">Due Today ({todayList.length})</h3>
          </div>
          <div className="space-y-2">
            {todayList.map((item: any) => {
              const client = clients.find((c) => c.id === item.clientId);
              if (!client) return null;
              return (
                <div key={item.id} className="bg-amber-50 border border-amber-200 rounded p-3 text-sm">
                  <div className="font-medium">{client.firstName} {client.lastName}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{item.type}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Coming Up This Week */}
      {weekList.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-semibold">Coming Up This Week ({weekList.length})</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {weekList.map((item: any) => {
              const client = clients.find((c) => c.id === item.clientId);
              if (!client) return null;
              return (
                <div key={item.id} className="bg-white border rounded p-3 text-sm">
                  <div className="font-medium">{client.firstName} {client.lastName}</div>
                  <div className="text-xs text-muted-foreground">{new Date(item.scheduledDate).toLocaleDateString()}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── All Leads Tab ──────────────────────────────────────────────────────────

function AllLeadsTab() {
  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const { data: allContactLogs = [] } = useQuery<ContactLog[]>({
    queryKey: ["/api/contact-logs/recent"],
    queryFn: () => apiRequest("/api/contact-logs/recent?limit=500"),
  });

  const { data: followUps = [] } = useQuery<FollowUp[]>({
    queryKey: ["/api/follow-ups"],
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"age" | "stage" | "name">("age");

  const filtered = useMemo(() => {
    let result = clients.filter(
      (c) =>
        c.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.phone && c.phone.includes(searchTerm))
    );

    result = result.sort((a, b) => {
      if (sortBy === "age") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === "name") {
        return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
      }
      return 0;
    });

    return result;
  }, [clients, searchTerm, sortBy]);

  const getClientAge = (createdAt: string): string => {
    const created = new Date(createdAt).getTime();
    const now = new Date().getTime();
    const days = Math.floor((now - created) / (1000 * 60 * 60 * 24));
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days}d ago`;
    if (days < 30) return `${Math.floor(days / 7)}w ago`;
    return `${Math.floor(days / 30)}mo ago`;
  };

  return (
    <div className="flex-1 overflow-hidden flex flex-col p-6">
      <div className="space-y-4 pb-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">All Leads</h2>
          <span className="text-sm text-muted-foreground">{filtered.length} total</span>
        </div>

        <Input
          placeholder="Search by name or phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full"
        />

        <div className="flex gap-2">
          {(['age', 'stage', 'name'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSortBy(s)}
              className={cn(
                "px-3 py-1 text-xs font-medium rounded border transition-colors",
                sortBy === s
                  ? "bg-[hsl(var(--primary))] text-white border-[hsl(var(--primary))]"
                  : "border-border hover:border-foreground/30"
              )}
            >
              {s === "age" ? "Age" : s === "stage" ? "Stage" : "Name"}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2">
        {filtered.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No leads found</div>
        ) : (
          filtered.map((client) => {
            const isHot = isHotLead(client);
            const isStuck = isStuckLead(client, allContactLogs);
            const clientFollowUps = followUps.filter((f) => f.clientId === client.id);
            const stage = getCurrentStage(clientFollowUps);

            return (
              <div
                key={client.id}
                className={cn(
                  "bg-white border rounded-lg p-3 text-sm hover:shadow-sm transition-shadow",
                  isHot && "bg-yellow-50 border-yellow-200",
                  isStuck && "bg-red-50 border-red-200"
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">
                        {client.firstName} {client.lastName}
                      </span>
                      {isHot && <Flame className="w-4 h-4 text-orange-500 flex-shrink-0" />}
                      {isStuck && <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5 flex gap-2">
                      <span>{getClientAge(client.createdAt)}</span>
                      <span className={cn("px-1.5 rounded text-xs", getSourceColor(client.source))}>
                        {getSourceLabel(client.source)}
                      </span>
                      <span className={cn("px-1.5 rounded text-xs", getStatusBadgeColor(client.status))}>
                        {getStatusLabel(client.status)}
                      </span>
                    </div>
                  </div>
                  <div className="text-xs text-right flex-shrink-0">
                    <div className="font-medium">{stage.label}</div>
                    {stage.isOverdue && <div className="text-red-600">Overdue</div>}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ─── Pipeline Tab (the existing 3-column layout) ────────────────────────────

interface ClientCardProps {
  client: Client;
  isSelected: boolean;
  contactLogs: ContactLog[];
  onClick: () => void;
}

function ClientCard({ client, isSelected, contactLogs, onClick }: ClientCardProps) {
  const lastLog = contactLogs
    .filter((l) => l.clientId === client.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];

  const neverContacted = !lastLog;

  return (
    <button
      type="button"
      data-testid={`card-client-${client.id}`}
      onClick={onClick}
      className={cn(
        "w-full text-left p-3 rounded-lg border transition-all hover:border-[hsl(var(--primary))]/50",
        isSelected
          ? "border-l-4 border-l-[hsl(var(--primary))] border-border bg-white shadow-sm"
          : "border-transparent bg-white/60 hover:bg-white"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="font-semibold text-sm text-foreground leading-tight">
          {client.firstName} {client.lastName}
        </div>
        <span
          className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded-full flex-shrink-0", getSourceColor(client.source))}
          data-testid={`badge-source-${client.id}`}
        >
          {getSourceLabel(client.source)}
        </span>
      </div>

      {client.phone && (
        <div className="text-xs text-muted-foreground mt-0.5">{client.phone}</div>
      )}

      <div className="mt-1.5">
        {neverContacted ? (
          <span className="text-xs font-medium text-red-600" data-testid={`text-no-contact-${client.id}`}>
            No contact yet
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">
            Last: {formatRelativeTime(lastLog.createdAt)}
          </span>
        )}
      </div>
    </button>
  );
}

interface TimelineEntryProps {
  log: ContactLog;
  users: UserType[];
  isLast: boolean;
}

function TimelineEntry({ log, users, isLast }: TimelineEntryProps) {
  const Icon = getContactTypeIcon(log.type);
  const loggedByUser = users.find((u) => u.id === log.loggedBy);

  return (
    <div className="flex gap-3 relative" data-testid={`timeline-entry-${log.id}`}>
      {!isLast && (
        <div className="absolute left-4 top-9 bottom-0 w-px bg-border" />
      )}

      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center z-10 mt-1">
        <Icon className="w-3.5 h-3.5 text-muted-foreground" />
      </div>

      <div className="flex-1 min-w-0 pb-5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-foreground">
            {log.direction === "outbound" ? "Outbound" : "Inbound"} {getContactTypeLabel(log.type)}
          </span>
          {log.outcome && (
            <span
              className={cn("text-[11px] font-medium px-2 py-0.5 rounded-full", getOutcomeColor(log.outcome))}
              data-testid={`badge-outcome-${log.id}`}
            >
              {getOutcomeLabel(log.outcome)}
            </span>
          )}
          <span className="text-xs text-muted-foreground ml-auto flex-shrink-0">
            {formatRelativeTime(log.createdAt)}
          </span>
        </div>

        {log.notes && (
          <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{log.notes}</p>
        )}

        {loggedByUser && (
          <div className="text-xs text-muted-foreground/60 mt-1">
            Logged by {loggedByUser.name}
          </div>
        )}
      </div>
    </div>
  );
}

interface ClientDetailPanelProps {
  client: Client;
  users: UserType[];
  contactLogs: ContactLog[];
  followUps: FollowUp[];
  onNotesChange: (notes: string) => void;
}

function ClientDetailPanel({ client, users, contactLogs, followUps: _followUps, onNotesChange }: ClientDetailPanelProps) {
  const { toast } = useToast();
  const [logDialogOpen, setLogDialogOpen] = useState(false);
  const [apptDialogOpen, setApptDialogOpen] = useState(false);
  const [editClientOpen, setEditClientOpen] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState(client.notes || "");
  const [statusChangePending, setStatusChangePending] = useState(false);
  const [inactiveDialogOpen, setInactiveDialogOpen] = useState(false);
  const [inactiveReason, setInactiveReason] = useState("opted_out");
  const [suggestedTemplate, setSuggestedTemplate] = useState<FollowupTemplate | undefined>();

  const clientLogs = contactLogs
    .filter((l) => l.clientId === client.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const statusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      setStatusChangePending(true);
      return apiRequest(`/api/clients/${client.id}`, {
        method: "PUT",
        body: JSON.stringify({ status: newStatus }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/admin-stats"] });
      toast({ title: "Status updated" });
      setStatusChangePending(false);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update status.", variant: "destructive" });
      setStatusChangePending(false);
    },
  });

  const notesMutation = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/clients/${client.id}`, {
        method: "PUT",
        body: JSON.stringify({ notes: notesValue }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      onNotesChange(notesValue);
      setEditingNotes(false);
      toast({ title: "Notes saved" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save notes.", variant: "destructive" });
    },
  });

  const markInactiveMutation = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/clients/${client.id}`, {
        method: "PUT",
        body: JSON.stringify({
          status: "inactive",
          inactiveReason,
          markedInactiveAt: new Date().toISOString(),
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/admin-stats"] });
      toast({ title: "Marked as inactive" });
      setInactiveDialogOpen(false);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to mark inactive.", variant: "destructive" });
    },
  });

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="px-6 py-4 border-b bg-white flex-shrink-0">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-xl font-bold text-foreground" data-testid="text-client-name">
              {client.firstName} {client.lastName}
            </h2>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              <Select
                value={client.status}
                onValueChange={(val) => statusMutation.mutate(val)}
                disabled={statusChangePending}
              >
                <SelectTrigger
                  className={cn(
                    "h-7 text-xs font-medium border rounded-full px-2.5 gap-1.5 w-auto",
                    getStatusBadgeColor(client.status)
                  )}
                  data-testid="select-client-status"
                >
                  <SelectValue />
                  <ChevronDown className="w-3 h-3" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lead">New Lead</SelectItem>
                  <SelectItem value="appointment_set">Appointment Set</SelectItem>
                  <SelectItem value="quoted">Quoted</SelectItem>
                  <SelectItem value="sold">Sold</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>

              {client.source && (
                <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", getSourceColor(client.source))}>
                  {getSourceLabel(client.source)}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <TouchpointLink client={client} />
            {client.status !== "inactive" && (
              <Button
                variant="outline"
                className="border-red-200 text-red-600 hover:bg-red-50 gap-2"
                onClick={() => setInactiveDialogOpen(true)}
              >
                Opt Out / Inactive
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => setEditClientOpen(true)}
              className="gap-2"
              data-testid="button-edit-client"
            >
              <Pencil className="w-4 h-4" />
              Edit Customer
            </Button>
            <Button
              onClick={() => {
                const url = getTouchpointCalendarUrl(client);
                if (url) {
                  window.open(url, "_blank", "noopener,noreferrer");
                }
              }}
              className="bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90 text-white gap-2"
              data-testid="button-schedule-appt"
            >
              <CalendarCheck className="w-4 h-4" />
              Schedule in TouchPoint
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 mt-3 text-sm">
          {client.phone && (
            <a
              href={`tel:${client.phone}`}
              className="flex items-center gap-1.5 text-[hsl(var(--primary))] hover:underline font-medium"
              data-testid="link-client-phone"
            >
              <Phone className="w-3.5 h-3.5" />
              {client.phone}
            </a>
          )}
          {client.email && (
            <a
              href={`mailto:${client.email}`}
              className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
              data-testid="link-client-email"
            >
              <Mail className="w-3.5 h-3.5" />
              {client.email}
            </a>
          )}
          {client.address && (
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <ArrowUpRight className="w-3.5 h-3.5" />
              {client.address}, {client.city} {client.state}
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4 min-h-0 space-y-6">
        {client.status === "lead" && (
          <div className="border rounded-lg p-4 bg-slate-50">
            <h3 className="text-sm font-semibold text-foreground mb-3">Follow-up Actions</h3>
            <ContactActionButtons
              client={client}
              suggestedTemplate={suggestedTemplate}
              onLogged={() => {
                queryClient.invalidateQueries({ queryKey: ["/api/contact-logs", client.id] });
                queryClient.invalidateQueries({ queryKey: ["/api/clients", client.id] });
              }}
            />
          </div>
        )}

        {(client.status === "lead" || client.status === "appointment_set") && (
          <FollowupTimeline
            clientId={client.id}
            onSelectTemplate={(template) => setSuggestedTemplate(template)}
          />
        )}

        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
              Contact Activity
            </h3>
            <Button
              size="sm"
              onClick={() => setLogDialogOpen(true)}
              className="gap-1.5 h-8"
              data-testid="button-log-contact"
            >
              <Plus className="w-3.5 h-3.5" />
              Log Contact
            </Button>
          </div>

          {clientLogs.length === 0 ? (
            <div className="text-center py-12">
              <Phone className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground font-medium">No contact logged yet</p>
              <p className="text-xs text-muted-foreground mt-1">Start by logging a call, text, or email.</p>
              <Button
                size="sm"
                className="mt-4 gap-1.5"
                onClick={() => setLogDialogOpen(true)}
                data-testid="button-log-first-contact"
              >
                <Plus className="w-3.5 h-3.5" />
                Log First Contact
              </Button>
            </div>
          ) : (
            <div>
              {clientLogs.map((log, idx) => (
                <TimelineEntry
                  key={log.id}
                  log={log}
                  users={users}
                  isLast={idx === clientLogs.length - 1}
                />
              ))}
            </div>
          )}

          <div className="mt-4 border-t pt-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">Notes</h3>
              {!editingNotes && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setEditingNotes(true)}
                  data-testid="button-edit-notes"
                >
                  Edit
                </Button>
              )}
            </div>

            {editingNotes ? (
              <div className="space-y-2">
                <Textarea
                  data-testid="textarea-client-notes"
                  value={notesValue}
                  onChange={(e) => setNotesValue(e.target.value)}
                  rows={4}
                  placeholder="General notes about this client..."
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => notesMutation.mutate()}
                    disabled={notesMutation.isPending}
                    data-testid="button-save-notes"
                  >
                    {notesMutation.isPending ? "Saving..." : "Save Notes"}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setNotesValue(client.notes || "");
                      setEditingNotes(false);
                    }}
                    data-testid="button-cancel-notes"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <p
                className="text-sm text-muted-foreground leading-relaxed"
                data-testid="text-client-notes"
              >
                {client.notes || <span className="italic">No notes yet.</span>}
              </p>
            )}
          </div>
        </div>
      </div>

      <LogContactDialog
        open={logDialogOpen}
        onClose={() => setLogDialogOpen(false)}
        clientId={client.id}
        clientName={`${client.firstName} ${client.lastName}`}
      />
      <EventDialog
        open={apptDialogOpen}
        onClose={() => setApptDialogOpen(false)}
        defaultClientId={client.id}
        defaultEventType="sales_design_appt"
      />
      <EditClientDialog
        open={editClientOpen}
        onClose={() => setEditClientOpen(false)}
        client={client}
      />

      <Dialog open={inactiveDialogOpen} onOpenChange={setInactiveDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Mark {client.firstName} as Inactive</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="inactive-reason">Reason</Label>
              <Select value={inactiveReason} onValueChange={setInactiveReason}>
                <SelectTrigger id="inactive-reason">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="opted_out">Opted Out</SelectItem>
                  <SelectItem value="customer_declined">Customer Declined</SelectItem>
                  <SelectItem value="do_not_contact">Do Not Contact</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-muted-foreground">
              The client will be moved to inactive status and all pending follow-ups will be canceled.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInactiveDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => markInactiveMutation.mutate()}
              disabled={markInactiveMutation.isPending}
            >
              {markInactiveMutation.isPending ? "Marking..." : "Mark Inactive"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface ActionQueueProps {
  followUps: FollowUp[];
  clients: Client[];
}

function ActionQueue({ followUps, clients }: ActionQueueProps) {
  const { toast } = useToast();
  const now = new Date();
  const today = now.toISOString().split("T")[0];
  const in5Days = new Date(now.getTime() + 5 * 86400000).toISOString().split("T")[0];

  const pending = followUps.filter((f) => f.status === "pending");
  const todayItems = pending.filter((f) => f.scheduledDate === today);
  const overdueItems = pending.filter((f) => f.scheduledDate < today);
  const upcomingItems = pending.filter(
    (f) => f.scheduledDate > today && f.scheduledDate <= in5Days
  );

  const completeMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/follow-ups/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          status: "completed",
          completedAt: new Date().toISOString(),
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/follow-ups"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/admin-stats"] });
      toast({ title: "Follow-up completed" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to complete follow-up.", variant: "destructive" });
    },
  });

  function getClientName(clientId: number): string {
    const c = clients.find((cl) => cl.id === clientId);
    return c ? `${c.firstName} ${c.lastName}` : "Unknown";
  }

  function getFollowUpTypeLabel(type: string): string {
    const map: Record<string, string> = {
      day1_thank_you: "Thank You",
      day3_checkin: "Check-In",
      day7_value: "Value Follow-Up",
      day14_final: "Final Follow-Up",
      custom: "Follow-Up",
    };
    return map[type] || type;
  }

  function FollowUpItem({ item, accent }: { item: FollowUp; accent?: string }) {
    return (
      <div
        className="flex items-start gap-2 py-2.5 border-b last:border-0"
        data-testid={`followup-item-${item.id}`}
      >
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-foreground leading-tight">
            {getClientName(item.clientId)}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">{getFollowUpTypeLabel(item.type)}</div>
          <div className={cn("text-xs mt-0.5", accent || "text-muted-foreground")}>
            {item.scheduledDate}
          </div>
        </div>
        <button
          type="button"
          onClick={() => completeMutation.mutate(item.id)}
          className="flex-shrink-0 p-1 rounded-md text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
          title="Mark complete"
          data-testid={`button-complete-followup-${item.id}`}
        >
          <CheckCircle2 className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto px-4 py-4">
      <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-3">
        Action Queue
      </h3>

      {overdueItems.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-1.5 mb-2">
            <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
            <span className="text-xs font-semibold text-red-600 uppercase tracking-wide">
              Overdue ({overdueItems.length})
            </span>
          </div>
          <div className="rounded-lg border border-red-200 bg-red-50 px-3">
            {overdueItems.map((item) => (
              <FollowUpItem key={item.id} item={item} accent="text-red-600 font-medium" />
            ))}
          </div>
        </div>
      )}

      <div className="mb-4">
        <div className="flex items-center gap-1.5 mb-2">
          <Clock className="w-3.5 h-3.5 text-amber-500" />
          <span className="text-xs font-semibold text-amber-600 uppercase tracking-wide">
            Today{todayItems.length > 0 ? ` (${todayItems.length})` : ""}
          </span>
        </div>
        <div className="rounded-lg border bg-white px-3">
          {todayItems.length === 0 ? (
            <p className="text-xs text-muted-foreground py-3 text-center">Nothing due today</p>
          ) : (
            todayItems.map((item) => (
              <FollowUpItem key={item.id} item={item} accent="text-amber-600 font-medium" />
            ))
          )}
        </div>
      </div>

      {upcomingItems.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <CalendarCheck className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Upcoming ({upcomingItems.length})
            </span>
          </div>
          <div className="rounded-lg border bg-white px-3">
            {upcomingItems.map((item) => (
              <FollowUpItem key={item.id} item={item} />
            ))}
          </div>
        </div>
      )}

      {overdueItems.length === 0 && todayItems.length === 0 && upcomingItems.length === 0 && (
        <div className="text-center py-8">
          <CheckCircle2 className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">All caught up!</p>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminLeadsPage() {
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"today" | "all-leads" | "pipeline">("today");

  const { data: clients = [], isLoading: clientsLoading } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const { data: users = [] } = useQuery<UserType[]>({
    queryKey: ["/api/users"],
  });

  const { data: allContactLogs = [] } = useQuery<ContactLog[]>({
    queryKey: ["/api/contact-logs/recent"],
    queryFn: () => apiRequest("/api/contact-logs/recent?limit=200"),
  });

  const { data: followUps = [] } = useQuery<FollowUp[]>({
    queryKey: ["/api/follow-ups"],
  });

  const { data: selectedClientLogs = [] } = useQuery<ContactLog[]>({
    queryKey: ["/api/contact-logs", selectedClientId],
    queryFn: () =>
      selectedClientId
        ? apiRequest(`/api/contact-logs?clientId=${selectedClientId}`)
        : Promise.resolve([]),
    enabled: selectedClientId !== null,
  });

  const mergedContactLogs = useMemo(() => {
    if (selectedClientId === null) return allContactLogs;
    const otherLogs = allContactLogs.filter((l) => l.clientId !== selectedClientId);
    return [...otherLogs, ...selectedClientLogs];
  }, [allContactLogs, selectedClientLogs, selectedClientId]);

  const pipelineClients = useMemo(
    () => clients.filter((c) => ["lead", "appointment_set", "quoted"].includes(c.status)),
    [clients]
  );

  const newLeads = useMemo(() => pipelineClients.filter((c) => c.status === "lead"), [pipelineClients]);
  const apptSet = useMemo(() => pipelineClients.filter((c) => c.status === "appointment_set"), [pipelineClients]);
  const quoted = useMemo(() => pipelineClients.filter((c) => c.status === "quoted"), [pipelineClients]);

  const selectedClient = clients.find((c) => c.id === selectedClientId) ?? null;

  if (!selectedClientId && pipelineClients.length > 0) {
    setSelectedClientId(pipelineClients[0].id);
  }

  if (clientsLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground text-sm">Loading leads...</p>
      </div>
    );
  }

  function PipelineSection({
    title,
    clients: sectionClients,
    colorClass,
  }: {
    title: string;
    clients: Client[];
    colorClass: string;
  }) {
    return (
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2 px-1">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{title}</span>
          <span className={cn("text-xs font-bold px-1.5 py-0.5 rounded-full", colorClass)}>
            {sectionClients.length}
          </span>
        </div>
        <div className="space-y-1.5">
          {sectionClients.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-2 italic">None</p>
          ) : (
            sectionClients.map((client) => (
              <ClientCard
                key={client.id}
                client={client}
                isSelected={selectedClientId === client.id}
                contactLogs={mergedContactLogs}
                onClick={() => setSelectedClientId(client.id)}
              />
            ))
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="flex-1 flex flex-col overflow-hidden">
        <div className="border-b bg-white px-6 py-3 flex-shrink-0">
          <TabsList className="grid w-max grid-cols-3">
            <TabsTrigger value="today">Today</TabsTrigger>
            <TabsTrigger value="all-leads">All Leads</TabsTrigger>
            <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="today" className="flex-1 overflow-hidden">
          <TodayTab />
        </TabsContent>

        <TabsContent value="all-leads" className="flex-1 overflow-hidden">
          <AllLeadsTab />
        </TabsContent>

        <TabsContent value="pipeline" className="flex-1 flex overflow-hidden">
          <aside
            className="w-64 flex-shrink-0 border-r bg-[hsl(220,14%,96%)] overflow-hidden flex flex-col"
            data-testid="panel-lead-pipeline"
          >
            <div className="px-3 py-3 border-b bg-white flex-shrink-0 space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-foreground">Lead Pipeline</h2>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setImportDialogOpen(true)}
                className="w-full text-xs gap-2"
              >
                <Plus className="w-3.5 h-3.5" />
                Import from TouchPoint
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  try {
                    const res = await apiRequest<{ generated: number; skipped: number; total: number }>(
                      "/api/follow-ups/generate-missing",
                      { method: "POST", body: JSON.stringify({}) }
                    );
                    queryClient.invalidateQueries({ queryKey: ["/api/follow-ups"] });
                    queryClient.invalidateQueries({ queryKey: ["/api/dashboard/admin-stats"] });
                    if (res?.generated) {
                      alert(`Generated follow-up sequences for ${res.generated} lead(s). ${res.skipped} already had one.`);
                    } else {
                      alert(`All ${res?.total || 0} leads already have follow-up sequences.`);
                    }
                  } catch {
                    alert("Failed to generate follow-ups.");
                  }
                }}
                className="w-full text-xs gap-2"
              >
                <Clock className="w-3.5 h-3.5" />
                Generate Missing Follow-ups
              </Button>
            </div>
            <ScrollArea className="flex-1">
              <div className="px-2 py-3">
                <PipelineSection
                  title="New Leads"
                  clients={newLeads}
                  colorClass="bg-rose-100 text-rose-700"
                />
                <PipelineSection
                  title="Appointment Set"
                  clients={apptSet}
                  colorClass="bg-emerald-100 text-emerald-700"
                />
                <PipelineSection
                  title="Quoted — Follow Up"
                  clients={quoted}
                  colorClass="bg-blue-100 text-blue-700"
                />
              </div>
            </ScrollArea>
          </aside>

          <main className="flex-1 min-w-0 bg-[hsl(220,14%,98%)] overflow-hidden flex flex-col" data-testid="panel-client-detail">
            {selectedClient ? (
              <ClientDetailPanel
                client={selectedClient}
                users={users}
                contactLogs={selectedClientId ? selectedClientLogs : mergedContactLogs}
                followUps={followUps}
                onNotesChange={() => {
                  queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
                }}
              />
            ) : (
              <div className="flex flex-col h-full items-center justify-center text-center px-8">
                <User className="w-12 h-12 text-muted-foreground/30 mb-4" />
                <p className="text-sm font-medium text-muted-foreground">Select a lead from the left panel</p>
                <p className="text-xs text-muted-foreground mt-1">
                  You'll see their contact history and can log activity.
                </p>
              </div>
            )}
          </main>

          <aside
            className="w-72 flex-shrink-0 border-l bg-white hidden xl:flex flex-col overflow-hidden"
            data-testid="panel-action-queue"
          >
            <ActionQueue followUps={followUps} clients={clients} />
          </aside>
        </TabsContent>
      </Tabs>

      <ImportTouchpointDialog
        open={importDialogOpen}
        onClose={() => setImportDialogOpen(false)}
      />
    </div>
  );
}
