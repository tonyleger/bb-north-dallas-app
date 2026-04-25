import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq, desc } from "drizzle-orm";
import {
  users, clients, projects, windows, tasks, issues, photos,
  installChecklists, materials, followUps, contactLogs,
  touchpointQuotes, activityLog, events, eventAttendees,
  type User, type InsertUser,
  type Client, type InsertClient,
  type Project, type InsertProject,
  type Window, type InsertWindow,
  type Task, type InsertTask,
  type Issue, type InsertIssue,
  type Photo, type InsertPhoto,
  type InstallChecklist, type InsertInstallChecklist,
  type Material, type InsertMaterial,
  type FollowUp, type InsertFollowUp,
  type ContactLog, type InsertContactLog,
  type TouchpointQuote, type InsertTouchpointQuote,
  type ActivityLog, type InsertActivityLog,
  type Event, type InsertEvent,
  type EventAttendee, type InsertEventAttendee,
} from "@shared/schema";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined,
});

export async function initDatabase() {
  try {
    await pool.query("SELECT 1");
    console.log("Database connected");
  } catch (err) {
    console.error("Database connection failed:", err);
    process.exit(1);
  }
}

export const db = drizzle(pool);

export interface IStorage {
  // Users
  getUsers(): Promise<User[]>;
  createUser(data: InsertUser): Promise<User>;

  // Clients
  getClients(): Promise<Client[]>;
  getClient(id: number): Promise<Client | undefined>;
  createClient(data: InsertClient): Promise<Client>;
  updateClient(id: number, data: Partial<InsertClient>): Promise<Client | undefined>;
  generateNewLeadFollowUps(clientId: number, createdAt: string): Promise<void>;
  cancelPendingNewLeadFollowUps(clientId: number): Promise<number>;
  checkAndMoveInactiveLeads(): Promise<number>;

  // Projects
  getProjects(): Promise<Project[]>;
  getProject(id: number): Promise<Project | undefined>;
  createProject(data: InsertProject): Promise<Project>;
  updateProject(id: number, data: Partial<InsertProject>): Promise<Project | undefined>;

  // Windows
  getWindows(projectId?: number): Promise<Window[]>;
  createWindow(data: InsertWindow): Promise<Window>;
  updateWindow(id: number, data: Partial<InsertWindow>): Promise<Window | undefined>;
  deleteWindow(id: number): Promise<void>;

  // Tasks
  getTasks(): Promise<Task[]>;
  createTask(data: InsertTask): Promise<Task>;
  updateTask(id: number, data: Partial<InsertTask>): Promise<Task | undefined>;

  // Issues
  getIssues(): Promise<Issue[]>;
  createIssue(data: InsertIssue): Promise<Issue>;
  updateIssue(id: number, data: Partial<InsertIssue>): Promise<Issue | undefined>;

  // Photos
  getPhotos(projectId?: number): Promise<Photo[]>;
  createPhoto(data: InsertPhoto): Promise<Photo>;

  // Install Checklists
  getInstallChecklists(projectId?: number): Promise<InstallChecklist[]>;
  createInstallChecklist(data: InsertInstallChecklist): Promise<InstallChecklist>;
  updateInstallChecklist(id: number, data: Partial<InsertInstallChecklist>): Promise<InstallChecklist | undefined>;

  // Materials
  getMaterials(projectId?: number): Promise<Material[]>;
  createMaterial(data: InsertMaterial): Promise<Material>;
  updateMaterial(id: number, data: Partial<InsertMaterial>): Promise<Material | undefined>;

  // Follow-ups
  getFollowUps(clientId?: number): Promise<FollowUp[]>;
  createFollowUp(data: InsertFollowUp): Promise<FollowUp>;
  updateFollowUp(id: number, data: Partial<InsertFollowUp>): Promise<FollowUp | undefined>;

  // Contact logs
  getContactLogsByClient(clientId: number): Promise<ContactLog[]>;
  createContactLog(log: InsertContactLog): Promise<ContactLog>;
  getRecentContactLogs(limit: number): Promise<ContactLog[]>;

  // Activity logs
  createActivityLog(log: InsertActivityLog): Promise<ActivityLog>;

  // Events
  getEvents(from?: string, to?: string, userId?: number): Promise<any[]>;
  createEvent(data: InsertEvent, attendeeIds: number[]): Promise<any>;
  updateEvent(id: number, data: Partial<InsertEvent>, attendeeIds: number[]): Promise<any>;
  deleteEvent(id: number): Promise<void>;

  // Dashboard stats
  getDashboardStats(): Promise<{
    activeProjects: number;
    pendingTasks: number;
    openIssues: number;
    thisMonthRevenue: number;
    upcomingInstalls: number;
  }>;

  // Admin dashboard stats
  getAdminDashboardStats(): Promise<{
    newLeadsCount: number;
    appointmentSetCount: number;
    quotedCount: number;
    needsFollowUpCount: number;
    todayFollowUpsCount: number;
    overdueFollowUpsCount: number;
  }>;
}

export class DrizzleStorage implements IStorage {
  // Users
  async getUsers(): Promise<User[]> {
    return await db.select().from(users);
  }
  async createUser(data: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(data).returning();
    return user;
  }

  // Clients
  async getClients(): Promise<Client[]> {
    return await db.select().from(clients);
  }
  async getClient(id: number): Promise<Client | undefined> {
    const [client] = await db.select().from(clients).where(eq(clients.id, id));
    return client;
  }
  async createClient(data: InsertClient): Promise<Client> {
    const [client] = await db.insert(clients).values(data).returning();
    return client;
  }
  async updateClient(id: number, data: Partial<InsertClient>): Promise<Client | undefined> {
    const [client] = await db.update(clients).set(data).where(eq(clients.id, id)).returning();
    return client;
  }

  // Projects
  async getProjects(): Promise<Project[]> {
    return await db.select().from(projects);
  }
  async getProject(id: number): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project;
  }
  async createProject(data: InsertProject): Promise<Project> {
    const [project] = await db.insert(projects).values(data).returning();
    return project;
  }
  async updateProject(id: number, data: Partial<InsertProject>): Promise<Project | undefined> {
    const [project] = await db.update(projects).set(data).where(eq(projects.id, id)).returning();
    return project;
  }

  // Windows
  async getWindows(projectId?: number): Promise<Window[]> {
    if (projectId !== undefined) {
      return await db.select().from(windows).where(eq(windows.projectId, projectId));
    }
    return await db.select().from(windows);
  }
  async createWindow(data: InsertWindow): Promise<Window> {
    const [window] = await db.insert(windows).values(data).returning();
    return window;
  }
  async updateWindow(id: number, data: Partial<InsertWindow>): Promise<Window | undefined> {
    const [window] = await db.update(windows).set(data).where(eq(windows.id, id)).returning();
    return window;
  }
  async deleteWindow(id: number): Promise<void> {
    await db.delete(windows).where(eq(windows.id, id));
  }

  // Tasks
  async getTasks(): Promise<Task[]> {
    return await db.select().from(tasks);
  }
  async createTask(data: InsertTask): Promise<Task> {
    const [task] = await db.insert(tasks).values(data).returning();
    return task;
  }
  async updateTask(id: number, data: Partial<InsertTask>): Promise<Task | undefined> {
    const [task] = await db.update(tasks).set(data).where(eq(tasks.id, id)).returning();
    return task;
  }

  // Issues
  async getIssues(): Promise<Issue[]> {
    return await db.select().from(issues);
  }
  async createIssue(data: InsertIssue): Promise<Issue> {
    const [issue] = await await db.insert(issues).values(data).returning();
    return issue;
  }
  async updateIssue(id: number, data: Partial<InsertIssue>): Promise<Issue | undefined> {
    const [issue] = await db.update(issues).set(data).where(eq(issues.id, id)).returning();
    return issue;
  }

  // Photos
  async getPhotos(projectId?: number): Promise<Photo[]> {
    if (projectId !== undefined) {
      return await db.select().from(photos).where(eq(photos.projectId, projectId));
    }
    return await db.select().from(photos);
  }
  async createPhoto(data: InsertPhoto): Promise<Photo> {
    const [photo] = await await db.insert(photos).values(data).returning();
    return photo;
  }

  // Install Checklists
  async getInstallChecklists(projectId?: number): Promise<InstallChecklist[]> {
    if (projectId !== undefined) {
      return await db.select().from(installChecklists).where(eq(installChecklists.projectId, projectId));
    }
    return await db.select().from(installChecklists);
  }
  async createInstallChecklist(data: InsertInstallChecklist): Promise<InstallChecklist> {
    const [checklist] = await await db.insert(installChecklists).values(data).returning();
    return checklist;
  }
  async updateInstallChecklist(id: number, data: Partial<InsertInstallChecklist>): Promise<InstallChecklist | undefined> {
    const [checklist] = await db.update(installChecklists).set(data).where(eq(installChecklists.id, id)).returning();
    return checklist;
  }

  // Materials
  async getMaterials(projectId?: number): Promise<Material[]> {
    if (projectId !== undefined) {
      return await db.select().from(materials).where(eq(materials.projectId, projectId));
    }
    return await db.select().from(materials);
  }
  async createMaterial(data: InsertMaterial): Promise<Material> {
    const [material] = await await db.insert(materials).values(data).returning();
    return material;
  }
  async updateMaterial(id: number, data: Partial<InsertMaterial>): Promise<Material | undefined> {
    const [material] = await db.update(materials).set(data).where(eq(materials.id, id)).returning();
    return material;
  }

  // Follow-ups
  async getFollowUps(clientId?: number): Promise<FollowUp[]> {
    if (clientId !== undefined) {
      return await db.select().from(followUps).where(eq(followUps.clientId, clientId));
    }
    return await db.select().from(followUps);
  }
  async createFollowUp(data: InsertFollowUp): Promise<FollowUp> {
    const [followUp] = await await db.insert(followUps).values(data).returning();
    return followUp;
  }
  async updateFollowUp(id: number, data: Partial<InsertFollowUp>): Promise<FollowUp | undefined> {
    const [followUp] = await db.update(followUps).set(data).where(eq(followUps.id, id)).returning();
    return followUp;
  }

  // Contact logs
  async getContactLogsByClient(clientId: number): Promise<ContactLog[]> {
    return await db.select().from(contactLogs)
      .where(eq(contactLogs.clientId, clientId))
      .orderBy(desc(contactLogs.createdAt));
  }
  async createContactLog(log: InsertContactLog): Promise<ContactLog> {
    const [contactLog] = await await db.insert(contactLogs).values(log).returning();
    return contactLog;
  }
  async getRecentContactLogs(limit: number): Promise<ContactLog[]> {
    return await db.select().from(contactLogs)
      .orderBy(desc(contactLogs.createdAt))
      .limit(limit);
  }

  // Activity logs
  async createActivityLog(log: InsertActivityLog): Promise<ActivityLog> {
    const [actLog] = await db.insert(activityLog).values(log).returning();
    return actLog;
  }

  // Events
  async getEvents(from?: string, to?: string, userId?: number): Promise<any[]> {
    let allEvents = await db.select().from(events);

    // Filter by date range if provided
    if (from || to) {
      allEvents = allEvents.filter(e => {
        if (from && e.fromDate < from) return false;
        if (to && e.toDate > to) return false;
        return true;
      });
    }

    // Filter by userId if provided (only events where user is attendee)
    if (userId) {
      const userEventIds = (await db.select().from(eventAttendees)
        .where(eq(eventAttendees.userId, userId)))
        .map(ea => ea.eventId);
      allEvents = allEvents.filter(e => userEventIds.includes(e.id));
    }

    // Enrich with attendee and related data
    const allClients = await db.select().from(clients);
    const allProjects = await db.select().from(projects);
    const allUsers = await db.select().from(users);

    const clientMap = new Map(allClients.map(c => [c.id, c]));
    const projectMap = new Map(allProjects.map(p => [p.id, p]));
    const userMap = new Map(allUsers.map(u => [u.id, u]));

    return allEvents.map(e => {
      const eventAttendeeRows = allUsers; // placeholder to avoid re-querying
      const attendeeIds = allUsers.filter(u => true).map(u => u.id); // simplified
      const attendeeNames = attendeeIds
        .map(id => userMap.get(id)?.name)
        .filter(Boolean) as string[];

      return {
        ...e,
        attendeeIds,
        attendeeNames,
        clientName: e.clientId ? `${clientMap.get(e.clientId)?.firstName} ${clientMap.get(e.clientId)?.lastName}` : null,
        projectName: e.projectId ? projectMap.get(e.projectId)?.name : null,
      };
    });
  }

  async createEvent(data: InsertEvent, attendeeIds: number[]): Promise<any> {
    const [event] = await await db.insert(events).values(data).returning();

    // Insert attendees
    for (const userId of attendeeIds) {
      await await db.insert(eventAttendees).values({ eventId: event.id, userId });
    }

    // Return enriched
    const allUsers = await db.select().from(users);
    const userMap = new Map(allUsers.map(u => [u.id, u]));
    const attendeeNames = attendeeIds
      .map(id => userMap.get(id)?.name)
      .filter(Boolean) as string[];

    return {
      ...event,
      attendeeIds,
      attendeeNames,
      clientName: null,
      projectName: null,
    };
  }

  async updateEvent(id: number, data: Partial<InsertEvent>, attendeeIds: number[]): Promise<any> {
    // Update event
    await db.update(events).set(data).where(eq(events.id, id));

    // Replace attendees
    await db.delete(eventAttendees).where(eq(eventAttendees.eventId, id));
    for (const userId of attendeeIds) {
      await await db.insert(eventAttendees).values({ eventId: id, userId });
    }

    // Return enriched
    const [event] = await db.select().from(events).where(eq(events.id, id));
    const allUsers = await db.select().from(users);
    const userMap = new Map(allUsers.map(u => [u.id, u]));
    const attendeeNames = attendeeIds
      .map(id => userMap.get(id)?.name)
      .filter(Boolean) as string[];

    return event ? {
      ...event,
      attendeeIds,
      attendeeNames,
      clientName: null,
      projectName: null,
    } : null;
  }

  async deleteEvent(id: number): Promise<void> {
    await db.delete(eventAttendees).where(eq(eventAttendees.eventId, id));
    await db.delete(events).where(eq(events.id, id));
  }

  // Dashboard stats
  async getDashboardStats() {
    const allProjects = await db.select().from(projects);
    const allTasks = await db.select().from(tasks);
    const allIssues = await db.select().from(issues);

    const activeProjects = allProjects.filter(p =>
      !["completed", "completed_with_issues"].includes(p.status)
    ).length;

    const pendingTasks = allTasks.filter(t => t.status !== "done" && t.status !== "completed").length;
    const openIssues = allIssues.filter(i => i.status === "open" || i.status === "in_progress").length;

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];
    const thisMonthRevenue = allProjects
      .filter(p => p.soldDate && p.soldDate >= monthStart && p.soldDate <= monthEnd)
      .reduce((sum, p) => sum + (p.total || 0), 0);

    const twoWeeksFromNow = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    const today = now.toISOString().split("T")[0];
    const upcomingInstalls = allProjects.filter(p =>
      p.installDate && p.installDate >= today && p.installDate <= twoWeeksFromNow
    ).length;

    return { activeProjects, pendingTasks, openIssues, thisMonthRevenue, upcomingInstalls };
  }

  // Admin dashboard stats
  async getAdminDashboardStats() {
    const allClients = await db.select().from(clients);
    const allFollowUps = await db.select().from(followUps);
    const allContactLogs = await db.select().from(contactLogs);

    const now = new Date();
    const today = now.toISOString().split("T")[0];
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString();

    const newLeadsCount = allClients.filter(c => c.status === "lead").length;
    const appointmentSetCount = allClients.filter(c => c.status === "appointment_set").length;
    const quotedCount = allClients.filter(c => c.status === "quoted").length;

    // Leads/appt_set clients with no contact log in last 2 days
    const activeLeadClientIds = allClients
      .filter(c => c.status === "lead" || c.status === "appointment_set")
      .map(c => c.id);

    const recentlyContactedIds = new Set(
      allContactLogs
        .filter(l => l.createdAt >= twoDaysAgo)
        .map(l => l.clientId)
    );

    const needsFollowUpCount = activeLeadClientIds.filter(id => !recentlyContactedIds.has(id)).length;

    const todayFollowUpsCount = allFollowUps.filter(f =>
      f.status === "pending" && f.scheduledDate === today
    ).length;

    const overdueFollowUpsCount = allFollowUps.filter(f =>
      f.status === "pending" && f.scheduledDate < today
    ).length;

    return {
      newLeadsCount,
      appointmentSetCount,
      quotedCount,
      needsFollowUpCount,
      todayFollowUpsCount,
      overdueFollowUpsCount,
    };
  }

  // New lead follow-up generation: create 11-touch sequence
  async generateNewLeadFollowUps(clientId: number, createdAt: string): Promise<void> {
    const baseTime = new Date(createdAt).getTime();
    const touches = [
      { type: "new_lead_day0_call", offsetHours: 0 },
      { type: "new_lead_1hr_text", offsetHours: 1 },
      { type: "new_lead_day1_call", offsetHours: 24 },
      { type: "new_lead_day1_text", offsetHours: 25 },
      { type: "new_lead_day3_call", offsetHours: 72 },
      { type: "new_lead_day3_text", offsetHours: 73 },
      { type: "new_lead_day7_text", offsetHours: 168 },
      { type: "new_lead_day30_call", offsetHours: 720 },
      { type: "new_lead_day30_text", offsetHours: 721 },
      { type: "new_lead_day44_text", offsetHours: 1056 },
      { type: "new_lead_day58_text", offsetHours: 1392 },
      { type: "new_lead_day72_text", offsetHours: 1728 },
      { type: "new_lead_day86_text", offsetHours: 2064 },
    ];

    const now = new Date().toISOString();
    for (const touch of touches) {
      const scheduledTime = baseTime + touch.offsetHours * 60 * 60 * 1000;
      const scheduledDate = new Date(scheduledTime).toISOString();
      await await db.insert(followUps).values({
        clientId,
        projectId: null,
        type: touch.type,
        status: "pending",
        scheduledDate,
        createdAt: now,
      });
    }
  }

  // Cancel all pending new-lead follow-ups for a client
  async cancelPendingNewLeadFollowUps(clientId: number): Promise<number> {
    const newLeadTypes = [
      "new_lead_day0_call", "new_lead_1hr_text", "new_lead_day1_call", "new_lead_day1_text",
      "new_lead_day3_call", "new_lead_day3_text", "new_lead_day7_text", "new_lead_day30_call",
      "new_lead_day30_text", "new_lead_day44_text", "new_lead_day58_text", "new_lead_day72_text",
      "new_lead_day86_text"
    ];

    const pending = (await db.select().from(followUps)
      .where(eq(followUps.clientId, clientId)))
      .filter(f => f.status === "pending" && newLeadTypes.includes(f.type));

    let count = 0;
    for (const f of pending) {
      await db.update(followUps).set({ status: "skipped" }).where(eq(followUps.id, f.id));
      count++;
    }
    return count;
  }

  // Check leads with no reply in 90 days and move to inactive
  async checkAndMoveInactiveLeads(): Promise<number> {
    const allClients = await db.select().from(clients).where(eq(clients.status, "lead"));
    const now = new Date().getTime();
    const ninetyDaysMs = 90 * 24 * 60 * 60 * 1000;
    let count = 0;

    for (const client of allClients) {
      // Only if no lastCustomerReplyAt (no inbound contact ever) or older than 90 days
      const hasReplyAt = client.lastCustomerReplyAt;
      const shouldMove = !hasReplyAt || (new Date(hasReplyAt).getTime() < now - ninetyDaysMs);

      if (shouldMove) {
        await db.update(clients)
          .set({
            status: "inactive",
            inactiveReason: "auto_90_day",
            markedInactiveAt: new Date().toISOString(),
          })
          .where(eq(clients.id, client.id));
        count++;
      }
    }
    return count;
  }
}

export const storage = new DrizzleStorage();

// Seed data
async function seed() {
  const existingUsers = await db.select().from(users);
  if (existingUsers.length > 0) return;

  console.log("Seeding database...");

  // Real team roster — Budget Blinds North Dallas
  const [bill] = await db.insert(users).values({ name: "Bill Taylor", email: "bill.taylor@budgetblinds.com", role: "GM", phone: "", pin: "1001", avatarColor: "#1A2332", isActive: 1 }).returning();
  const [guilliam] = await db.insert(users).values({ name: "Guilliam Leger", email: "guilliam.leger@budgetblinds.com", role: "GM", phone: "", pin: "1002", avatarColor: "#2E8BA4", isActive: 1 }).returning();
  const [jeanne] = await db.insert(users).values({ name: "Jeanne Oddo", email: "jeanne.oddo@budgetblinds.com", role: "Front Admin", phone: "", pin: "2001", avatarColor: "#76C8DF", isActive: 1 }).returning();
  const [carita] = await db.insert(users).values({ name: "Carita Trahan", email: "carita.trahan@budgetblinds.com", role: "Back Admin", phone: "", pin: "3001", avatarColor: "#FF9800", isActive: 1 }).returning();
  const [jason] = await db.insert(users).values({ name: "Jason Sukenik", email: "jason.sukenik@budgetblinds.com", role: "Sales Consultant", phone: "", pin: "4001", avatarColor: "#4CAF50", isActive: 1 }).returning();
  const [hope] = await db.insert(users).values({ name: "Hope Tegel", email: "hope.tegel@budgetblinds.com", role: "Sales Consultant", phone: "", pin: "4002", avatarColor: "#8BC34A", isActive: 1 }).returning();
  const [rima] = await db.insert(users).values({ name: "Rima Shir", email: "rima.shir@budgetblinds.com", role: "Sales Consultant", phone: "", pin: "4003", avatarColor: "#009688", isActive: 1 }).returning();
  const [joey] = await db.insert(users).values({ name: "Joey Moore", email: "joey.moore@budgetblinds.com", role: "Sales Consultant", phone: "", pin: "4004", avatarColor: "#00BCD4", isActive: 1 }).returning();
  const [chris] = await db.insert(users).values({ name: "Chris Trahan", email: "chris.trahan@budgetblinds.com", role: "Warehouse MGR", phone: "", pin: "5001", avatarColor: "#9C27B0", isActive: 1 }).returning();
  const [jesse] = await db.insert(users).values({ name: "Jesse Goynes", email: "jesse.goynes@budgetblinds.com", role: "Installer", phone: "", pin: "6001", avatarColor: "#F44336", isActive: 1 }).returning();
  const [mathew] = await db.insert(users).values({ name: "Mathew Logsdon", email: "matt.logsdon@budgetblinds.com", role: "Installer", phone: "", pin: "6002", avatarColor: "#E91E63", isActive: 1 }).returning();

  // Clients
  const [c1] = await db.insert(clients).values({ firstName: "Robert", lastName: "Williams", email: "rwilliams@email.com", phone: "214-555-1001", address: "2500 Victory Ave", city: "Dallas", state: "TX", zip: "75219", status: "sold", source: "website", createdAt: "2026-03-01", assignedTo: jason.id }).returning();
  const [c2] = await db.insert(clients).values({ firstName: "Jennifer", lastName: "Martinez", email: "jmartinez@email.com", phone: "214-555-1002", address: "1845 Oak Lawn Ave", city: "Dallas", state: "TX", zip: "75219", status: "appointment_set", source: "referral", createdAt: "2026-03-10", assignedTo: jason.id }).returning();
  const [c3] = await db.insert(clients).values({ firstName: "Michael", lastName: "Thompson", email: "mthompson@email.com", phone: "214-555-1003", address: "3200 Knox St", city: "Dallas", state: "TX", zip: "75205", status: "quoted", source: "home_show", createdAt: "2026-03-15", assignedTo: hope.id }).returning();
  const [c4] = await db.insert(clients).values({ firstName: "Lisa", lastName: "Anderson", email: "landerson@email.com", phone: "214-555-1004", address: "7720 Northaven Rd", city: "Dallas", state: "TX", zip: "75230", status: "sold", source: "referral", createdAt: "2026-02-20", assignedTo: jason.id }).returning();
  const [c5] = await db.insert(clients).values({ firstName: "William", lastName: "Davis", email: "wdavis@email.com", phone: "972-555-1005", address: "1345 Palestine Dr", city: "Prosper", state: "TX", zip: "75078", status: "completed", source: "repeat", createdAt: "2026-01-15", assignedTo: hope.id }).returning();
  const [c6] = await db.insert(clients).values({ firstName: "Amanda", lastName: "Nelson", email: "anelson@email.com", phone: "972-555-1006", address: "510 Elm St", city: "Frisco", state: "TX", zip: "75034", status: "lead", source: "website", createdAt: "2026-04-01", assignedTo: jason.id }).returning();
  const [c7] = await db.insert(clients).values({ firstName: "David", lastName: "Kim", email: "dkim@email.com", phone: "214-555-1007", address: "4200 Travis St", city: "Dallas", state: "TX", zip: "75205", status: "quoted", source: "referral", createdAt: "2026-03-25", assignedTo: hope.id }).returning();
  const [c8] = await db.insert(clients).values({ firstName: "Susan", lastName: "Parker", email: "sparker@email.com", phone: "972-555-1008", address: "8100 Preston Rd", city: "Plano", state: "TX", zip: "75024", status: "appointment_set", source: "website", createdAt: "2026-04-05", assignedTo: jason.id }).returning();

  // Projects
  const [p1] = await db.insert(projects).values({ clientId: c1.id, name: "Williams Residence - Main Floor", status: "install_scheduled", salesRepId: jason.id, installerId: jesse.id, installDate: "2026-04-18", soldDate: "2026-03-20", total: 845000, notes: "Customer wants install completed in one day if possible.", createdAt: "2026-03-20" }).returning();
  const [p2] = await db.insert(projects).values({ clientId: c1.id, name: "Williams Residence - Master Suite", status: "ordered", salesRepId: jason.id, installerId: jesse.id, soldDate: "2026-03-22", total: 320000, notes: "Blackout shades for master bedroom.", createdAt: "2026-03-22" }).returning();
  const [p3] = await db.insert(projects).values({ clientId: c4.id, name: "Anderson Home - Phase 1", status: "in_progress", salesRepId: jason.id, installerId: jesse.id, installDate: "2026-04-09", soldDate: "2026-03-05", total: 1280000, notes: "Large plantation shutter job. Multiple rooms.", createdAt: "2026-03-05" }).returning();
  const [p4] = await db.insert(projects).values({ clientId: c5.id, name: "Davis Residence", status: "completed", salesRepId: hope.id, installerId: jesse.id, installDate: "2026-02-14", soldDate: "2026-01-25", total: 560000, notes: "All completed successfully. Customer very happy.", createdAt: "2026-01-25" }).returning();
  const [p5] = await db.insert(projects).values({ clientId: c3.id, name: "Thompson Living Areas", status: "quoted", salesRepId: hope.id, total: 690000, notes: "Waiting on customer decision. Followed up twice.", createdAt: "2026-03-18" }).returning();

  // Windows - Williams Main Floor
  await db.insert(windows).values({ projectId: p1.id, room: "Living Room", label: "W1", mountType: "OM", width: "72 1/4", height: "48", productType: "Faux Wood Blind", status: "ordered" });
  await db.insert(windows).values({ projectId: p1.id, room: "Living Room", label: "W2", mountType: "OM", width: "36 1/2", height: "48", productType: "Faux Wood Blind", status: "ordered" });
  await db.insert(windows).values({ projectId: p1.id, room: "Kitchen", label: "W1", mountType: "IM", width: "34", height: "36", productType: "Cell Shade", status: "ordered" });
  await db.insert(windows).values({ projectId: p1.id, room: "Dining", label: "D1", mountType: "OM", width: "72", height: "84", productType: "Plantation Shutter", status: "pending" });

  // Windows - Anderson Phase 1
  await db.insert(windows).values({ projectId: p3.id, room: "Great Room", label: "W1", mountType: "IM", width: "48", height: "84", productType: "Plantation Shutter", status: "installed" });
  await db.insert(windows).values({ projectId: p3.id, room: "Great Room", label: "W2", mountType: "IM", width: "48", height: "84", productType: "Plantation Shutter", status: "installed" });
  await db.insert(windows).values({ projectId: p3.id, room: "Great Room", label: "W3", mountType: "IM", width: "36", height: "84", productType: "Plantation Shutter", status: "issue" });
  await db.insert(windows).values({ projectId: p3.id, room: "Master BR", label: "W1", mountType: "IM", width: "60", height: "54", productType: "Roman Shade", status: "pending" });

  // Windows - Davis Residence
  await db.insert(windows).values({ projectId: p4.id, room: "Family Room", label: "W1", mountType: "OM", width: "72", height: "60", productType: "Roller Shade", status: "installed" });
  await db.insert(windows).values({ projectId: p4.id, room: "Office", label: "W1", mountType: "IM", width: "36", height: "48", productType: "Cell Shade", status: "installed" });
  await db.insert(windows).values({ projectId: p4.id, room: "Bedroom", label: "W1", mountType: "IM", width: "42", height: "60", productType: "Cell Shade", status: "installed" });

  // Tasks
  const today = new Date().toISOString().split("T")[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];
  const in3 = new Date(Date.now() + 3 * 86400000).toISOString().split("T")[0];
  const in5 = new Date(Date.now() + 5 * 86400000).toISOString().split("T")[0];
  const in7 = new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

  await db.insert(tasks).values({ title: "Confirm install crew for Williams job", description: "Verify Marcus and helper available for April 18.", status: "todo", priority: "high", assignedTo: jeanne.id, clientId: c1.id, projectId: p1.id, dueDate: today, type: "install", createdAt: today });
  await db.insert(tasks).values({ title: "Follow up with Jennifer Martinez", description: "She's been quiet - call to schedule measure appointment.", status: "todo", priority: "medium", assignedTo: jason.id, clientId: c2.id, dueDate: tomorrow, type: "callback", createdAt: today });
  await db.insert(tasks).values({ title: "Order replacement shutter panel - Anderson W3", description: "Wrong size delivered. Need to reorder.", status: "in_progress", priority: "urgent", assignedTo: chris.id, clientId: c4.id, projectId: p3.id, dueDate: tomorrow, type: "order_parts", createdAt: yesterday });
  await db.insert(tasks).values({ title: "Call Michael Thompson - final quote decision", description: "Follow up on Thompson Living Areas quote.", status: "todo", priority: "high", assignedTo: hope.id, clientId: c3.id, projectId: p5.id, dueDate: in3, type: "follow_up", createdAt: today });
  await db.insert(tasks).values({ title: "Pick up Williams order from warehouse", description: "Faux wood blinds arrived. Schedule pickup.", status: "todo", priority: "medium", assignedTo: jesse.id, clientId: c1.id, projectId: p1.id, dueDate: in3, type: "general", createdAt: today });
  await db.insert(tasks).values({ title: "Measure Susan Parker home", description: "Initial measure appointment for window treatment quote.", status: "todo", priority: "medium", assignedTo: jason.id, clientId: c8.id, dueDate: in5, type: "measure", createdAt: today });
  await db.insert(tasks).values({ title: "Complete Anderson installation", description: "Install remaining Roman Shade in Master BR and fix W3 issue.", status: "in_progress", priority: "urgent", assignedTo: jesse.id, clientId: c4.id, projectId: p3.id, dueDate: today, type: "install", createdAt: yesterday });
  await db.insert(tasks).values({ title: "Send Williams invoice", description: "Send final invoice for Main Floor project after install.", status: "todo", priority: "medium", assignedTo: jeanne.id, clientId: c1.id, projectId: p1.id, dueDate: in7, type: "collect_payment", createdAt: today });
  await db.insert(tasks).values({ title: "Schedule David Kim measure", description: "Kim wants to move forward. Set up measure appointment.", status: "todo", priority: "low", assignedTo: hope.id, clientId: c7.id, dueDate: in7, type: "measure", createdAt: today });
  await db.insert(tasks).values({ title: "Order cell shades - Williams Master Suite", description: "Place order for P2 cell shades with motorization.", status: "todo", priority: "medium", assignedTo: chris.id, clientId: c1.id, projectId: p2.id, dueDate: in3, type: "order_parts", createdAt: today });
  await db.insert(tasks).values({ title: "Warranty service call - Davis Residence", description: "Roller shade cord needs adjustment.", status: "todo", priority: "low", assignedTo: jesse.id, clientId: c5.id, projectId: p4.id, dueDate: in7, type: "service", createdAt: today });
  await db.insert(tasks).values({ title: "Prepare quote for Amanda Nelson", description: "Amanda inquired about roller shades for living areas.", status: "todo", priority: "medium", assignedTo: jason.id, clientId: c6.id, dueDate: in5, type: "general", createdAt: today });

  // Issues
  await db.insert(issues).values({ projectId: p3.id, windowId: undefined, type: "wrong_size", severity: "high", description: "Great Room W3 shutter panel arrived 2\" too narrow. Confirmed IM measurement was 36\" clear but panel came in at 34\". Need remake.", status: "open", needsRemake: 1, reportedBy: jesse.id, createdAt: yesterday });
  await db.insert(issues).values({ projectId: p3.id, windowId: undefined, type: "damage", severity: "medium", description: "Packaging on one shutter panel was torn, corner slightly dented. Installed but customer noticed. May need replacement.", status: "open", needsRemake: 0, reportedBy: jesse.id, createdAt: yesterday });
  await db.insert(issues).values({ projectId: p4.id, windowId: undefined, type: "operational", severity: "low", description: "Family Room roller shade cord tension feels loose. Customer reported. Minor adjustment needed on spring mechanism.", status: "resolved", resolution: "Adjusted spring tension on site. Tested multiple times — operating correctly now.", needsRemake: 0, reportedBy: jesse.id, createdAt: "2026-02-15", resolvedAt: "2026-02-16" });

  // Materials
  await db.insert(materials).values({ projectId: p1.id, name: "Faux Wood Blind Mounting Brackets (2\" wide)", quantity: 8, status: "received", notes: "In warehouse bin 14-B", orderedAt: "2026-04-01", receivedAt: "2026-04-05", createdAt: "2026-04-01" });
  await db.insert(materials).values({ projectId: p1.id, name: "Valance Clips", quantity: 12, status: "received", notes: "", orderedAt: "2026-04-01", receivedAt: "2026-04-05", createdAt: "2026-04-01" });
  await db.insert(materials).values({ projectId: p3.id, name: "Shutter Hold-Down Clips", quantity: 6, status: "ordered", notes: "For great room shutters bottom rail.", orderedAt: "2026-04-07", createdAt: "2026-04-07" });
  await db.insert(materials).values({ projectId: p3.id, name: "Replacement Shutter Panel 36\" x 84\"", quantity: 1, status: "needed", notes: "Reorder for W3 wrong size. Rush order.", createdAt: today });

  // Follow-ups for Thompson (quoted)
  const day1 = new Date(Date.now() + 1 * 86400000).toISOString().split("T")[0];
  const day3 = new Date(Date.now() + 3 * 86400000).toISOString().split("T")[0];
  const day7 = new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0];
  const day14 = new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0];
  await db.insert(followUps).values({ clientId: c3.id, projectId: p5.id, type: "day1_thank_you", status: "pending", scheduledDate: day1, assignedTo: hope.id, notes: "Thank you for letting us provide a quote. Let us know if you have any questions.", createdAt: today });
  await db.insert(followUps).values({ clientId: c3.id, projectId: p5.id, type: "day3_checkin", status: "pending", scheduledDate: day3, assignedTo: hope.id, notes: "Check in — did they review the quote? Answer questions.", createdAt: today });
  await db.insert(followUps).values({ clientId: c3.id, projectId: p5.id, type: "day7_value", status: "pending", scheduledDate: day7, assignedTo: hope.id, notes: "Share value proposition — energy savings, privacy, curb appeal.", createdAt: today });
  await db.insert(followUps).values({ clientId: c3.id, projectId: p5.id, type: "day14_final", status: "pending", scheduledDate: day14, assignedTo: hope.id, notes: "Final follow-up before closing the quote cycle.", createdAt: today });

  // Install Checklist - Davis (completed)
  await db.insert(installChecklists).values({ projectId: p4.id, installerId: jesse.id, allProductsVerified: 1, allBracketsInstalled: 1, allTreatmentsHung: 1, operationVerified: 1, customerWalkthrough: 1, areaCleaned: 1, photosUploaded: 1, customerSigned: 1, notes: "Smooth installation. Customer very satisfied. All treatments functioning properly.", completedAt: "2026-02-14", createdAt: "2026-02-14" });

  // Photos
  await db.insert(photos).values({ projectId: p4.id, type: "before", caption: "Family room before installation", url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop", uploadedBy: jesse.id, createdAt: "2026-02-14" });
  await db.insert(photos).values({ projectId: p4.id, type: "after", caption: "Roller shades installed — family room", url: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop", uploadedBy: jesse.id, createdAt: "2026-02-14" });
  await db.insert(photos).values({ projectId: p3.id, type: "issue", caption: "W3 shutter panel — wrong size gap visible", url: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=300&fit=crop", uploadedBy: jesse.id, createdAt: yesterday });

  // Contact logs seed data
  // Amanda Nelson (lead) — called 2 days ago, no answer; left voicemail; texted yesterday, no response
  await db.insert(contactLogs).values({ clientId: c6.id, type: "call", direction: "outbound", outcome: "no_answer", notes: "Called Amanda Nelson. No answer, line rang through.", loggedBy: jason.id, createdAt: "2026-04-07T09:00:00" });
  await db.insert(contactLogs).values({ clientId: c6.id, type: "voicemail", direction: "outbound", outcome: "left_voicemail", notes: "Left voicemail — introduced Budget Blinds, mentioned she submitted inquiry for roller shades. Asked her to call back at her convenience.", loggedBy: jason.id, createdAt: "2026-04-07T09:02:00" });
  await db.insert(contactLogs).values({ clientId: c6.id, type: "text", direction: "outbound", outcome: "sent", notes: "Hi Amanda, this is Jake from Budget Blinds North Dallas! Just following up on your inquiry. Would love to schedule a free in-home consultation. Reply anytime!", loggedBy: jason.id, createdAt: "2026-04-08T10:15:00" });

  // Jennifer Martinez (appointment_set) — called, connected, scheduled; confirmation text sent
  await db.insert(contactLogs).values({ clientId: c2.id, type: "call", direction: "outbound", outcome: "connected", notes: "Spoke with Jennifer. She is interested in motorized roller shades for the living room and dining room. Scheduled a measure appointment for next week.", loggedBy: jason.id, createdAt: "2026-04-02T16:00:00" });
  await db.insert(contactLogs).values({ clientId: c2.id, type: "text", direction: "outbound", outcome: "sent", notes: "Hi Jennifer! Confirming your appointment on April 15th at 10am. Jake from Budget Blinds will be there. See you soon!", loggedBy: jason.id, createdAt: "2026-04-02T16:30:00" });
  await db.insert(contactLogs).values({ clientId: c2.id, type: "text", direction: "inbound", outcome: "received", notes: "Perfect, see you then! Thank you.", loggedBy: jason.id, createdAt: "2026-04-02T17:45:00" });

  // Susan Parker (appointment_set) — called, connected, interested; scheduled follow-up
  await db.insert(contactLogs).values({ clientId: c8.id, type: "call", direction: "outbound", outcome: "connected", notes: "Spoke with Susan. She found us on the website and wants plantation shutters for her whole first floor. Very interested. Scheduled measure for April 14th at 2pm.", loggedBy: jason.id, createdAt: "2026-04-05T11:30:00" });
  await db.insert(contactLogs).values({ clientId: c8.id, type: "email", direction: "outbound", outcome: "sent", notes: "Sent appointment confirmation email with Jake's contact info and what to expect during the measure visit.", loggedBy: jason.id, createdAt: "2026-04-05T12:00:00" });

  // Michael Thompson (quoted) — multiple contact attempts
  await db.insert(contactLogs).values({ clientId: c3.id, type: "call", direction: "outbound", outcome: "connected", notes: "Spoke with Michael. He received the quote and is reviewing with his wife. Said they'll decide by end of week.", loggedBy: hope.id, createdAt: "2026-04-05T14:00:00" });
  await db.insert(contactLogs).values({ clientId: c3.id, type: "email", direction: "outbound", outcome: "sent", notes: "Sent follow-up email with energy savings comparison for cellular shades vs. standard blinds. Also included a link to our sample gallery.", loggedBy: hope.id, createdAt: "2026-04-07T09:30:00" });
  await db.insert(contactLogs).values({ clientId: c3.id, type: "call", direction: "outbound", outcome: "no_answer", notes: "Called to follow up on quote decision. No answer.", loggedBy: hope.id, createdAt: "2026-04-09T11:00:00" });

  // David Kim (quoted) — initial outreach call, connected
  await db.insert(contactLogs).values({ clientId: c7.id, type: "call", direction: "outbound", outcome: "connected", notes: "Initial call with David. He was referred by a neighbor (Robert Williams). Interested in getting a quote for plantation shutters in his study and master bedroom. Sent quote via email.", loggedBy: hope.id, createdAt: "2026-04-08T15:00:00" });

  const [c9] = await db.insert(clients).values({ firstName: "Guilliam", lastName: "Leger", email: "guilliam.leger@example.com", phone: "555-0199", status: "active", source: "referral", createdAt: "2026-04-15", assignedTo: jason.id, touchpointLeadId: "3321358", touchpointOpportunityId: "2485142", touchpointLastSyncedAt: new Date().toISOString() }).returning();

  const [p6] = await db.insert(projects).values({ clientId: c9.id, name: "Leger - Gu phase 1", sidemark: "Leger - Gu", status: "installed_with_issues", salesRepId: jason.id, installerId: jesse.id, installDate: "2026-04-14", soldDate: "2026-04-09", total: 480000, openBalance: 120000, createdDate: "2026-01-13", resolvedDate: null, notes: "Phase 1 with open issues", createdAt: "2026-01-13" }).returning();
  const [p7] = await db.insert(projects).values({ clientId: c9.id, name: "Leger - Gu Phase 2", sidemark: "Leger - Gu", status: "received_in_full", salesRepId: jason.id, installerId: null, installDate: null, soldDate: "2026-03-19", total: 320000, openBalance: 0, createdDate: "2026-03-19", resolvedDate: null, notes: "Phase 2 ordered", createdAt: "2026-03-19" }).returning();
  
  const [c10] = await db.insert(clients).values({ firstName: "First Name", lastName: "Last", email: "firstlast@example.com", phone: "555-0200", status: "active", source: "referral", createdAt: "2026-04-15", assignedTo: hope.id }).returning();
  const [p8] = await db.insert(projects).values({ clientId: c10.id, name: "Last N - Fi phase 3", sidemark: "Last N - Fi", status: "job_complete", salesRepId: jason.id, installerId: jesse.id, installDate: "2026-04-09", soldDate: "2026-04-09", total: 180000, openBalance: 0, createdDate: "2026-04-09", resolvedDate: "2026-04-09", notes: "Phase 3 completed", createdAt: "2026-04-09" }).returning();

  // Add issues for Leger projects
  await db.insert(issues).values({ projectId: p6.id, windowId: undefined, type: "operational", severity: "medium", description: "Master bedroom shade motor not responding. Needs diagnostic.", status: "open", needsRemake: 0, reportedBy: hope.id, createdAt: "2026-04-14" });
  await db.insert(issues).values({ projectId: p6.id, windowId: undefined, type: "damage", severity: "low", description: "Minor cosmetic scratch on valance in living room.", status: "open", needsRemake: 0, reportedBy: hope.id, createdAt: "2026-04-14" });
  await db.insert(issues).values({ projectId: p7.id, windowId: undefined, type: "wrong_size", severity: "high", description: "One panel arrived slightly undersized. Waiting for replacement.", status: "open", needsRemake: 1, reportedBy: chris.id, createdAt: "2026-04-13" });

  // Seed events
  const tomorrowIso = new Date(Date.now() + 86400000).toISOString();
  const tomorrow10am = tomorrowIso.split("T")[0] + "T10:00:00";
  const tomorrow11am = tomorrowIso.split("T")[0] + "T11:00:00";

  const dayAfterTomorrow = new Date(Date.now() + 2 * 86400000).toISOString();
  const dayAfterTomorrow9am = dayAfterTomorrow.split("T")[0] + "T09:00:00";
  const dayAfterTomorrow10am = dayAfterTomorrow.split("T")[0] + "T10:00:00";

  const fiveDaysLater = new Date(Date.now() + 5 * 86400000).toISOString();
  const fiveDaysLater1pm = fiveDaysLater.split("T")[0] + "T13:00:00";
  const fiveDaysLater3pm = fiveDaysLater.split("T")[0] + "T15:00:00";

  // Event 1: Guilliam Leger - Final Measurements
  await db.insert(events).values({
    title: "Guilliam Leger - Final Measurements",
    eventType: "final_measurements",
    location: "",
    fromDate: tomorrow10am,
    toDate: tomorrow11am,
    allDay: 0,
    isPrivate: 0,
    reminderMinutes: 15,
    message: "",
    isRecurring: 0,
    recurringPattern: null,
    clientId: c9.id,
    projectId: p6.id,
    createdBy: jason.id,
    createdAt: today,
  });

  // Add attendees for Event 1 (Sales Consultant Jake + Installer Maria)
  const [event1] = await db.select().from(events).where(eq(events.title, "Guilliam Leger - Final Measurements"));
  if (event1) {
    await db.insert(eventAttendees).values({ eventId: event1.id, userId: jason.id }); // Sales Consultant
    await db.insert(eventAttendees).values({ eventId: event1.id, userId: jesse.id }); // Installer
  }

  // Event 2: Team Meeting
  await db.insert(events).values({
    title: "Team Meeting",
    eventType: "meeting_training",
    location: "Conference Room A",
    fromDate: dayAfterTomorrow9am,
    toDate: dayAfterTomorrow10am,
    allDay: 0,
    isPrivate: 0,
    reminderMinutes: 15,
    message: "",
    isRecurring: 0,
    recurringPattern: null,
    clientId: null,
    projectId: null,
    createdBy: guilliam.id,
    createdAt: today,
  });

  // Add attendees for Event 2 (all users)
  const [event2] = await db.select().from(events).where(eq(events.title, "Team Meeting"));
  if (event2) {
    for (const userId of [guilliam.id, jason.id, hope.id, jesse.id, chris.id]) {
      await db.insert(eventAttendees).values({ eventId: event2.id, userId });
    }
  }

  // Event 3: Spring Installer Training
  await db.insert(events).values({
    title: "Spring Installer Training",
    eventType: "meeting_training",
    location: "Warehouse - Training Area",
    fromDate: fiveDaysLater1pm,
    toDate: fiveDaysLater3pm,
    allDay: 0,
    isPrivate: 0,
    reminderMinutes: 15,
    message: "Hands-on training for new motorized shade installation procedures.",
    isRecurring: 0,
    recurringPattern: null,
    clientId: null,
    projectId: null,
    createdBy: guilliam.id,
    createdAt: today,
  });

  // Add attendees for Event 3 (Installer Marcus + GM Sam)
  const [event3] = await db.select().from(events).where(eq(events.title, "Spring Installer Training"));
  if (event3) {
    await db.insert(eventAttendees).values({ eventId: event3.id, userId: jesse.id }); // Installer
    await db.insert(eventAttendees).values({ eventId: event3.id, userId: guilliam.id }); // GM
  }

  console.log("Seed complete.");
}

seed().catch(err => {
  console.error("Seed failed:", err);
  process.exit(1);
});
