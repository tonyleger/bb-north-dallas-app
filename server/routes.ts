import type { Express, Request, Response, NextFunction } from "express";
import { type Server } from "http";
import { storage } from "./storage";
import {
  insertUserSchema, insertClientSchema, insertProjectSchema, insertWindowSchema,
  insertTaskSchema, insertIssueSchema, insertPhotoSchema, insertInstallChecklistSchema,
  insertMaterialSchema, insertFollowUpSchema, insertContactLogSchema, insertEventSchema,
  type FollowUp,
} from "@shared/schema";

// Auth middleware: requires a valid session
function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session?.userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  next();
}

// Role middleware: checks if the logged-in user has one of the allowed roles
function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.session?.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    if (!roles.includes(req.session.userRole || "")) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
    next();
  };
}

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  // Auth endpoints (no middleware — these are public)
  app.post("/api/login", async (req, res) => {
    const { email, pin } = req.body;
    if (!email || !pin) {
      return res.status(400).json({ error: "Email and PIN required" });
    }

    const users = await storage.getUsers();
    const user = users.find(u => u.email === email && u.pin === pin && u.isActive === 1);

    if (!user) {
      return res.status(401).json({ error: "Invalid email or PIN" });
    }

    // Set session
    req.session.userId = user.id;
    req.session.userRole = user.role;
    req.session.userName = user.name;

    // Return user without PIN
    const { pin: _, ...userWithoutPin } = user;
    res.json(userWithoutPin);
  });

  app.post("/api/logout", async (req, res) => {
    req.session.destroy(() => {});
    res.json({ success: true });
  });

  // Protect all /api routes below with requireAuth
  app.use("/api", requireAuth);

  // Users
  app.get("/api/users", async (_req, res) => {
    res.json(await storage.getUsers());
  });
  app.post("/api/users", async (req, res) => {
    const parsed = insertUserSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
    res.json(await storage.createUser(parsed.data));
  });

  // Clients
  app.get("/api/clients", async (_req, res) => {
    res.json(await storage.getClients());
  });
  app.post("/api/clients", async (req, res) => {
    const parsed = insertClientSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
    const client = await storage.createClient(parsed.data);

    // Auto-generate new-lead follow-up sequence if status is "lead"
    if (client.status === "lead") {
      await storage.generateNewLeadFollowUps(client.id, client.createdAt);
    }

    res.json(client);
  });
  app.get("/api/clients/:id", async (req, res) => {
    const client = await storage.getClient(Number(req.params.id));
    if (!client) return res.status(404).json({ error: "Client not found" });
    res.json(client);
  });
  app.put("/api/clients/:id", async (req, res) => {
    const clientId = Number(req.params.id);
    const oldClient = await storage.getClient(clientId);
    if (!oldClient) return res.status(404).json({ error: "Client not found" });

    const updated = await storage.updateClient(clientId, req.body);
    if (!updated) return res.status(404).json({ error: "Client not found" });

    // If status changed to appointment_set, sold, or inactive, cancel pending new-lead follow-ups
    const statusChanged = req.body.status && req.body.status !== oldClient.status;
    if (statusChanged && ["appointment_set", "sold", "inactive"].includes(req.body.status)) {
      await storage.cancelPendingNewLeadFollowUps(clientId);
    }

    res.json(updated);
  });

  // Projects
  app.get("/api/projects", async (req, res) => {
    const status = req.query.status ? String(req.query.status) : undefined;
    let projects = await storage.getProjects();
    
    if (status) {
      projects = projects.filter(p => p.status === status);
    }

    // Join with client, sales agent, installer, and issue count
    const clients = await storage.getClients();
    const users = await storage.getUsers();
    const issues = await storage.getIssues();
    
    const clientMap = new Map(clients.map(c => [c.id, c]));
    const userMap = new Map(users.map(u => [u.id, u]));
    const issueCountByProject = new Map();
    issues.forEach(issue => {
      const count = (issueCountByProject.get(issue.projectId) || 0) + 1;
      issueCountByProject.set(issue.projectId, count);
    });

    const enriched = projects.map(p => ({
      ...p,
      clientFirstName: clientMap.get(p.clientId)?.firstName,
      clientLastName: clientMap.get(p.clientId)?.lastName,
      salesAgentName: p.salesRepId ? userMap.get(p.salesRepId)?.name : null,
      installerName: p.installerId ? userMap.get(p.installerId)?.name : null,
      openIssueCount: issueCountByProject.get(p.id) || 0,
    }));

    res.json(enriched);
  });
  app.post("/api/projects", async (req, res) => {
    const parsed = insertProjectSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
    res.json(await storage.createProject(parsed.data));
  });
  app.get("/api/projects/:id", async (req, res) => {
    const project = await storage.getProject(Number(req.params.id));
    if (!project) return res.status(404).json({ error: "Project not found" });
    res.json(project);
  });
  app.put("/api/projects/:id", async (req, res) => {
    const updated = await storage.updateProject(Number(req.params.id), req.body);
    if (!updated) return res.status(404).json({ error: "Project not found" });
    res.json(updated);
  });

  // Windows
  app.get("/api/windows", async (req, res) => {
    const projectId = req.query.projectId ? Number(req.query.projectId) : undefined;
    res.json(await storage.getWindows(projectId));
  });
  app.post("/api/windows", async (req, res) => {
    const parsed = insertWindowSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
    res.json(await storage.createWindow(parsed.data));
  });
  app.put("/api/windows/:id", async (req, res) => {
    const updated = await storage.updateWindow(Number(req.params.id), req.body);
    if (!updated) return res.status(404).json({ error: "Window not found" });
    res.json(updated);
  });
  app.delete("/api/windows/:id", async (req, res) => {
    await storage.deleteWindow(Number(req.params.id));
    res.json({ success: true });
  });

  // Tasks
  app.get("/api/tasks", async (_req, res) => {
    res.json(await storage.getTasks());
  });
  app.post("/api/tasks", async (req, res) => {
    const parsed = insertTaskSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
    res.json(await storage.createTask(parsed.data));
  });
  app.put("/api/tasks/:id", async (req, res) => {
    const updated = await storage.updateTask(Number(req.params.id), req.body);
    if (!updated) return res.status(404).json({ error: "Task not found" });
    res.json(updated);
  });

  // Issues
  app.get("/api/issues", async (_req, res) => {
    res.json(await storage.getIssues());
  });
  app.post("/api/issues", async (req, res) => {
    const parsed = insertIssueSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
    res.json(await storage.createIssue(parsed.data));
  });
  app.put("/api/issues/:id", async (req, res) => {
    const updated = await storage.updateIssue(Number(req.params.id), req.body);
    if (!updated) return res.status(404).json({ error: "Issue not found" });
    res.json(updated);
  });

  // Photos
  app.get("/api/photos", async (req, res) => {
    const projectId = req.query.projectId ? Number(req.query.projectId) : undefined;
    res.json(await storage.getPhotos(projectId));
  });
  app.post("/api/photos", async (req, res) => {
    const parsed = insertPhotoSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
    res.json(await storage.createPhoto(parsed.data));
  });

  // Install Checklists
  app.get("/api/install-checklists", async (req, res) => {
    const projectId = req.query.projectId ? Number(req.query.projectId) : undefined;
    res.json(await storage.getInstallChecklists(projectId));
  });
  app.post("/api/install-checklists", async (req, res) => {
    const parsed = insertInstallChecklistSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
    res.json(await storage.createInstallChecklist(parsed.data));
  });
  app.put("/api/install-checklists/:id", async (req, res) => {
    const updated = await storage.updateInstallChecklist(Number(req.params.id), req.body);
    if (!updated) return res.status(404).json({ error: "Checklist not found" });
    res.json(updated);
  });

  // Materials
  app.get("/api/materials", async (req, res) => {
    const projectId = req.query.projectId ? Number(req.query.projectId) : undefined;
    res.json(await storage.getMaterials(projectId));
  });
  app.post("/api/materials", async (req, res) => {
    const parsed = insertMaterialSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
    res.json(await storage.createMaterial(parsed.data));
  });
  app.put("/api/materials/:id", async (req, res) => {
    const updated = await storage.updateMaterial(Number(req.params.id), req.body);
    if (!updated) return res.status(404).json({ error: "Material not found" });
    res.json(updated);
  });

  // Follow-ups
  app.get("/api/follow-ups", async (req, res) => {
    const clientId = req.query.clientId ? Number(req.query.clientId) : undefined;
    res.json(await storage.getFollowUps(clientId));
  });
  app.post("/api/follow-ups", async (req, res) => {
    const parsed = insertFollowUpSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
    res.json(await storage.createFollowUp(parsed.data));
  });
  app.put("/api/follow-ups/:id", async (req, res) => {
    const updated = await storage.updateFollowUp(Number(req.params.id), req.body);
    if (!updated) return res.status(404).json({ error: "Follow-up not found" });
    res.json(updated);
  });

  // Dashboard stats
  app.get("/api/dashboard/stats", async (_req, res) => {
    res.json(await storage.getDashboardStats());
  });

  // Contact logs
  app.get("/api/contact-logs", async (req, res) => {
    const clientId = req.query.clientId ? Number(req.query.clientId) : undefined;
    if (clientId !== undefined) {
      return res.json(await storage.getContactLogsByClient(clientId));
    }
    res.json([]);
  });
  app.get("/api/contact-logs/recent", async (req, res) => {
    const limit = req.query.limit ? Number(req.query.limit) : 20;
    res.json(await storage.getRecentContactLogs(limit));
  });
  app.post("/api/contact-logs", async (req, res) => {
    const parsed = insertContactLogSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
    const log = await storage.createContactLog(parsed.data);

    // If inbound contact, update client's lastCustomerReplyAt
    if (log.direction === "inbound") {
      await storage.updateClient(log.clientId, { lastCustomerReplyAt: log.createdAt });
    }

    res.json(log);
  });

  // Admin dashboard stats
  app.get("/api/dashboard/admin-stats", async (_req, res) => {
    res.json(await storage.getAdminDashboardStats());
  });

  // Lead Manager stats (with period)
  app.get("/api/dashboard/lead-manager-stats", async (req, res) => {
    const period = req.query.period ? String(req.query.period) : "today";

    const now = new Date();
    let startDate = now.toISOString();

    if (period === "today") {
      startDate = now.toISOString().split("T")[0] + "T00:00:00";
    } else if (period === "week") {
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      startDate = oneWeekAgo.toISOString();
    } else if (period === "month") {
      const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      startDate = oneMonthAgo.toISOString();
    }

    const allLogs = await storage.getRecentContactLogs(1000);
    const allFollowUps = await storage.getFollowUps();
    const allClients = await storage.getClients();

    const today = now.toISOString().split("T")[0];
    const todayStart = new Date(today).getTime();
    const todayEnd = todayStart + 24 * 60 * 60 * 1000;

    // Filter logs by period
    const logsInPeriod = allLogs.filter(l => l.createdAt >= startDate);

    const activity = {
      callsMade: logsInPeriod.filter(l => l.type === "call" && l.direction === "outbound").length,
      textsSentManual: logsInPeriod.filter(l => l.type === "text" && l.direction === "outbound" && l.source === "manual").length,
      emailsSentManual: logsInPeriod.filter(l => l.type === "email" && l.direction === "outbound" && l.source === "manual").length,
      textsSentAutomated: logsInPeriod.filter(l => l.type === "text" && l.direction === "outbound" && l.source === "automated").length,
      emailsSentAutomated: logsInPeriod.filter(l => l.type === "email" && l.direction === "outbound" && l.source === "automated").length,
    };

    const clientsInPeriod = allClients.filter(c => c.createdAt >= startDate);
    const pipeline = {
      newLeads: clientsInPeriod.filter(c => c.status === "lead").length,
      apptsSet: clientsInPeriod.filter(c => c.status === "appointment_set").length,
      needFollowUp: allFollowUps.filter(f => f.status === "pending" && new Date(f.scheduledDate).getTime() <= now.getTime()).length,
    };

    const todaysWork = {
      overdueCount: allFollowUps.filter(f => f.status === "pending" && f.scheduledDate < today).length,
      dueTodayCount: allFollowUps.filter(f => f.status === "pending" && f.scheduledDate === today).length,
      upcomingWeekCount: allFollowUps.filter(f =>
        f.status === "pending" &&
        f.scheduledDate > today &&
        new Date(f.scheduledDate).getTime() < now.getTime() + 7 * 24 * 60 * 60 * 1000
      ).length,
    };

    res.json({ period, activity, pipeline, todaysWork });
  });

  // Follow-ups due list
  app.get("/api/follow-ups/due-list", async (req, res) => {
    const when = req.query.when ? String(req.query.when) : "today";
    const allFollowUps = await storage.getFollowUps();
    const allClients = await storage.getClients();

    const now = new Date();
    const today = now.toISOString().split("T")[0];

    let filtered: FollowUp[] = [];

    if (when === "overdue") {
      filtered = allFollowUps.filter(f => f.status === "pending" && f.scheduledDate < today);
    } else if (when === "today") {
      filtered = allFollowUps.filter(f => f.status === "pending" && f.scheduledDate === today);
    } else if (when === "week") {
      const weekEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      filtered = allFollowUps.filter(f => f.status === "pending" && f.scheduledDate > today && f.scheduledDate <= weekEnd);
    }

    const clientMap = new Map(allClients.map(c => [c.id, c]));

    const enriched = filtered.map(f => {
      const client = clientMap.get(f.clientId);
      return {
        ...f,
        clientName: client ? `${client.firstName} ${client.lastName}` : "Unknown",
        clientId: f.clientId,
      };
    });

    res.json(enriched);
  });

  // Check and move 90-day inactive leads (GM only)
  app.post("/api/follow-ups/check-inactive", requireRole("GM"), async (_req, res) => {
    const count = await storage.checkAndMoveInactiveLeads();
    res.json({ moved: count });
  });

  // Backfill follow-up sequence for leads that don't have one yet (GM + Front Admin)
  app.post("/api/follow-ups/generate-missing", requireRole("GM", "Front Admin"), async (_req, res) => {
    const allClients = await storage.getClients();
    const leadsOnly = allClients.filter((c) => c.status === "lead");
    let generated = 0;
    let skipped = 0;
    for (const client of leadsOnly) {
      const existing = await storage.getFollowUps(client.id);
      if (existing.length === 0) {
        await storage.generateNewLeadFollowUps(client.id, client.createdAt);
        generated++;
      } else {
        skipped++;
      }
    }
    res.json({ generated, skipped, total: leadsOnly.length });
  });

  // Touchpoint quotes (stub)
  app.get("/api/touchpoint-quotes", async (_req, res) => {
    res.json([]);
  });

  // Activity log (stub)
  app.get("/api/activity-log", async (_req, res) => {
    res.json([]);
  });


  // Projects CSV export
  app.get("/api/projects/export", async (req, res) => {
    const tab = req.query.tab ? String(req.query.tab) : "sold";
    const projects = await storage.getProjects();
    const clients = await storage.getClients();
    const users = await storage.getUsers();
    const issues = await storage.getIssues();

    const clientMap = new Map(clients.map(c => [c.id, c]));
    const userMap = new Map(users.map(u => [u.id, u]));
    const issueCountByProject = new Map();
    issues.forEach(issue => {
      const count = (issueCountByProject.get(issue.projectId) || 0) + 1;
      issueCountByProject.set(issue.projectId, count);
    });

    let filtered = projects;
    let headers: string[] = [];
    let rows: string[][] = [];

    if (tab === "sold") {
      headers = ["Client", "Sidemark", "Project", "Sales Agent", "Total", "Open Balance", "Status", "Installer"];
      filtered = projects.filter(p => p.status !== "installed_with_issues");
      rows = filtered.map(p => [
        `${clientMap.get(p.clientId)?.firstName || ""} ${clientMap.get(p.clientId)?.lastName || ""}`.trim(),
        p.sidemark || "",
        p.name,
        userMap.get(p.salesRepId ?? 0)?.name || "",
        ((p.total || 0) / 100).toFixed(2),
        ((p.openBalance || 0) / 100).toFixed(2),
        p.status || "",
        userMap.get(p.installerId ?? 0)?.name || "",
      ]);
    } else if (tab === "issues") {
      headers = ["Client", "Sidemark", "Project", "Sales Agent", "Installer", "Issues"];
      filtered = projects.filter(p => p.status === "installed_with_issues");
      rows = filtered.map(p => [
        `${clientMap.get(p.clientId)?.firstName || ""} ${clientMap.get(p.clientId)?.lastName || ""}`.trim(),
        p.sidemark || "",
        p.name,
        userMap.get(p.salesRepId ?? 0)?.name || "",
        userMap.get(p.installerId ?? 0)?.name || "",
        String(issueCountByProject.get(p.id) || 0),
      ]);
    } else if (tab === "lifecycle") {
      headers = ["Client", "Sidemark", "Project", "Created Date", "Sold Date", "Total Days Contracted", "Install Date", "Resolved Date"];
      filtered = projects;
      rows = filtered.map(p => {
        let totalDays = 0;
        if (p.resolvedDate && p.soldDate) {
          const resolved = new Date(p.resolvedDate);
          const sold = new Date(p.soldDate);
          totalDays = Math.floor((resolved.getTime() - sold.getTime()) / (1000 * 60 * 60 * 24));
        } else if (p.soldDate) {
          const today = new Date();
          const sold = new Date(p.soldDate);
          totalDays = Math.floor((today.getTime() - sold.getTime()) / (1000 * 60 * 60 * 24));
        }
        return [
          `${clientMap.get(p.clientId)?.firstName || ""} ${clientMap.get(p.clientId)?.lastName || ""}`.trim(),
          p.sidemark || "",
          p.name,
          p.createdDate ? new Date(p.createdDate).toLocaleDateString("en-US") : "",
          p.soldDate ? new Date(p.soldDate).toLocaleDateString("en-US") : "",
          String(totalDays),
          p.installDate ? new Date(p.installDate).toLocaleDateString("en-US") : "",
          p.resolvedDate ? new Date(p.resolvedDate).toLocaleDateString("en-US") : "",
        ];
      });
    }

    // Generate CSV
    const csv = [
      headers.map(h => `"${h}"`).join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(",")),
    ].join("\n");

    const today = new Date().toISOString().split("T")[0];
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="projects-${tab}-${today}.csv"`);
    res.send(csv);
  });

  // Events
  app.get("/api/events", async (req, res) => {
    const from = req.query.from ? String(req.query.from) : undefined;
    const to = req.query.to ? String(req.query.to) : undefined;
    const userId = req.query.userId ? Number(req.query.userId) : undefined;

    res.json(await storage.getEvents(from, to, userId));
  });

  app.post("/api/events", async (req, res) => {
    const { attendeeIds = [], ...eventData } = req.body;
    const parsed = insertEventSchema.safeParse(eventData);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.message });

    res.json(await storage.createEvent(parsed.data, attendeeIds));
  });

  app.put("/api/events/:id", async (req, res) => {
    const { attendeeIds = [], ...eventData } = req.body;
    const updated = await storage.updateEvent(Number(req.params.id), eventData as any, attendeeIds);
    if (!updated) return res.status(404).json({ error: "Event not found" });
    res.json(updated);
  });

  app.delete("/api/events/:id", async (req, res) => {
    await storage.deleteEvent(Number(req.params.id));
    res.json({ success: true });
  });

  // TouchPoint import (GM + Front Admin)
  app.post("/api/clients/import-touchpoint", requireRole("GM", "Front Admin"), async (req, res) => {
    const { rows } = req.body;
    if (!Array.isArray(rows)) {
      return res.status(400).json({ error: "rows must be an array" });
    }

    const now = new Date().toISOString();
    const allClients = await storage.getClients();
    const errors: string[] = [];
    let imported = 0;
    let updated = 0;

    for (const row of rows) {
      try {
        const { firstName, lastName, phone, email, address, city, state, zip, touchpointLeadId, source } = row;

        // Skip if no name
        if (!firstName && !lastName) {
          errors.push("Row missing name");
          continue;
        }

        // Try to match by touchpointLeadId
        let existingClient = null;
        if (touchpointLeadId) {
          existingClient = allClients.find((c) => c.touchpointLeadId === touchpointLeadId);
        }

        if (existingClient) {
          // Update only non-empty fields
          const updateData: Partial<any> = {
            touchpointLastSyncedAt: now,
          };
          if (firstName) updateData.firstName = firstName;
          if (lastName) updateData.lastName = lastName;
          if (phone) updateData.phone = phone;
          if (email) updateData.email = email;
          if (address) updateData.address = address;
          if (city) updateData.city = city;
          if (state) updateData.state = state;
          if (zip) updateData.zip = zip;
          if (source) updateData.source = source;

          await storage.updateClient(existingClient.id, updateData);
          updated++;
        } else {
          // Create new client
          const newClient = await storage.createClient({
            firstName: firstName || "Unknown",
            lastName: lastName || "Unknown",
            phone: phone || undefined,
            email: email || undefined,
            address: address || undefined,
            city: city || undefined,
            state: state || undefined,
            zip: zip || undefined,
            touchpointLeadId: touchpointLeadId || undefined,
            source: source || undefined,
            status: "lead",
            createdAt: now,
            touchpointLastSyncedAt: now,
          });

          // Auto-generate 13-touch new-lead follow-up sequence
          await storage.generateNewLeadFollowUps(newClient.id, newClient.createdAt);

          // Log activity
          await storage.createActivityLog({
            userId: null,
            actionType: "touchpoint_import",
            entityType: "client",
            entityId: newClient.id,
            summary: `Imported from TouchPoint: ${firstName} ${lastName}`,
            metadata: JSON.stringify({ touchpointLeadId }),
            createdAt: now,
          });

          imported++;
        }
      } catch (error) {
        errors.push(`Failed to process row: ${String(error)}`);
      }
    }

    res.json({ imported, updated, errors });
  });

  // TouchPoint AUTO sync — triggers the Python scraping script. Returns status.
  // The script itself is not yet configured on this machine; when it is, this
  // endpoint will spawn it and return results.
  app.post("/api/clients/sync-touchpoint", requireRole("GM"), async (_req, res) => {
    const syncScript = process.env.TOUCHPOINT_SYNC_SCRIPT;
    if (!syncScript) {
      return res.json({
        status: "not_configured",
        imported: 0,
        updated: 0,
        errors: [
          "TOUCHPOINT_SYNC_SCRIPT env var is not set. Configure the scraping script first.",
        ],
      });
    }

    try {
      const { spawn } = await import("child_process");
      const child = spawn("python", [syncScript], { cwd: process.cwd() });
      let stdout = "";
      let stderr = "";
      child.stdout.on("data", (d) => (stdout += d.toString()));
      child.stderr.on("data", (d) => (stderr += d.toString()));
      child.on("close", (code) => {
        if (code !== 0) {
          return res.status(500).json({
            status: "failed",
            imported: 0,
            updated: 0,
            errors: [stderr || `Script exited with code ${code}`],
          });
        }
        // Expect script to write JSON summary on its last stdout line
        try {
          const lines = stdout.trim().split("\n");
          const lastLine = lines[lines.length - 1];
          const summary = JSON.parse(lastLine);
          res.json({ status: "ok", ...summary });
        } catch {
          res.json({ status: "ok", imported: 0, updated: 0, errors: [], stdout });
        }
      });
    } catch (error: any) {
      res.status(500).json({
        status: "failed",
        imported: 0,
        updated: 0,
        errors: [error.message],
      });
    }
  });

  return httpServer;
}
