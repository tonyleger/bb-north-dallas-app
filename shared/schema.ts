import { pgTable, text, integer, serial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  role: text("role").notNull(), // GM, Front Admin, Sales Consultant, Back Admin, Warehouse MGR, Installer
  phone: text("phone"),
  pin: text("pin"), // 4-digit PIN for login
  avatarColor: text("avatar_color"),
  isActive: integer("is_active").notNull().default(1), // boolean (1/0)
});

export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  zip: text("zip"),
  // status: lead (new intake), appointment_set, quoted, sold, completed, inactive
  status: text("status").notNull().default("lead"),
  notes: text("notes"),
  source: text("source"), // referral, website, home_show, repeat, other
  createdAt: text("created_at").notNull(),
  assignedTo: integer("assigned_to"),
  // Commercial account support
  isCommercial: integer("is_commercial").notNull().default(0), // 0 = residential, 1 = commercial
  businessName: text("business_name"), // only used when isCommercial = 1
  // Secondary contact (available for both residential and commercial)
  secondaryContactName: text("secondary_contact_name"),
  secondaryContactPhone: text("secondary_contact_phone"),
  secondaryContactEmail: text("secondary_contact_email"),
  // TouchPoint CRM integration
  touchpointLeadId: text("touchpoint_lead_id"),
  touchpointOpportunityId: text("touchpoint_opportunity_id"),
  touchpointLastSyncedAt: text("touchpoint_last_synced_at"),
  // New lead follow-up tracking
  inactiveReason: text("inactive_reason"), // opted_out, auto_90_day, customer_declined, do_not_contact
  markedInactiveAt: text("marked_inactive_at"), // ISO timestamp when moved to inactive
  lastCustomerReplyAt: text("last_customer_reply_at"), // ISO timestamp of last inbound contact
});

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull(),
  name: text("name").notNull(),
  sidemark: text("sidemark"), // {lastName} - {Xx}, auto-generated or editable
  status: text("status").notNull().default("quoted"), // sold | ordered | partially_received | received_in_full | install_scheduled | job_complete | installed_with_issues | complete_open_balance
  salesRepId: integer("sales_rep_id"),
  installerId: integer("installer_id"),
  installDate: text("install_date"),
  soldDate: text("sold_date"),
  total: integer("total"), // cents
  openBalance: integer("open_balance"), // cents, read-only (from Touchpoint sync)
  createdDate: text("created_date"), // ISO date string, customer-facing "when was this project opened"
  resolvedDate: text("resolved_date"), // ISO date string, set when last open issue resolved or install completes
  notes: text("notes"),
  createdAt: text("created_at").notNull(), // timestamp audit field
});

export const windows = pgTable("windows", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  room: text("room").notNull(),
  label: text("label").notNull(),
  mountType: text("mount_type").notNull(), // IM, OM, Ceiling
  width: text("width").notNull(),
  height: text("height").notNull(),
  productType: text("product_type").notNull(),
  notes: text("notes"),
  status: text("status").notNull().default("pending"), // pending, ordered, received, installed, issue
});

export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").notNull().default("todo"),
  priority: text("priority").notNull().default("medium"),
  assignedTo: integer("assigned_to"),
  clientId: integer("client_id"),
  projectId: integer("project_id"),
  dueDate: text("due_date"),
  completedAt: text("completed_at"),
  createdAt: text("created_at").notNull(),
  type: text("type"), // follow_up, install, order_parts, callback, collect_payment, service, general, measure, remake
});

export const issues = pgTable("issues", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  windowId: integer("window_id"),
  type: text("type").notNull(), // damage, wrong_size, wrong_product, wrong_color, missing_parts, defective, operational, other
  severity: text("severity").notNull().default("medium"),
  description: text("description").notNull(),
  status: text("status").notNull().default("open"),
  resolution: text("resolution"),
  needsRemake: integer("needs_remake").default(0), // boolean
  reportedBy: integer("reported_by"),
  createdAt: text("created_at").notNull(),
  resolvedAt: text("resolved_at"),
});

export const photos = pgTable("photos", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  windowId: integer("window_id"),
  type: text("type").notNull(), // before, during, after, issue
  caption: text("caption"),
  url: text("url").notNull(),
  uploadedBy: integer("uploaded_by"),
  createdAt: text("created_at").notNull(),
});

export const installChecklists = pgTable("install_checklists", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  installerId: integer("installer_id"),
  allProductsVerified: integer("all_products_verified").default(0),
  allBracketsInstalled: integer("all_brackets_installed").default(0),
  allTreatmentsHung: integer("all_treatments_hung").default(0),
  operationVerified: integer("operation_verified").default(0),
  customerWalkthrough: integer("customer_walkthrough").default(0),
  areaCleaned: integer("area_cleaned").default(0),
  photosUploaded: integer("photos_uploaded").default(0),
  customerSigned: integer("customer_signed").default(0),
  notes: text("notes"),
  completedAt: text("completed_at"),
  createdAt: text("created_at").notNull(),
});

export const materials = pgTable("materials", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  name: text("name").notNull(),
  quantity: integer("quantity").notNull().default(1),
  status: text("status").notNull().default("needed"), // needed, ordered, received, delivered
  notes: text("notes"),
  orderedAt: text("ordered_at"),
  receivedAt: text("received_at"),
  createdAt: text("created_at").notNull(),
});

export const followUps = pgTable("follow_ups", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull(),
  projectId: integer("project_id"),
  // type: new_lead_day0_call, new_lead_1hr_text, new_lead_day1_call, new_lead_day1_text, new_lead_day3_call, new_lead_day3_text,
  //       new_lead_day7_text, new_lead_day30_call, new_lead_day30_text, new_lead_day44_text, new_lead_day58_text, new_lead_day72_text,
  //       new_lead_day86_text, day1_thank_you, day3_checkin, day7_value, day14_final, custom
  type: text("type").notNull(),
  status: text("status").notNull().default("pending"), // pending, completed, skipped
  scheduledDate: text("scheduled_date").notNull(),
  completedAt: text("completed_at"),
  notes: text("notes"),
  assignedTo: integer("assigned_to"),
  createdAt: text("created_at").notNull(),
});

export const contactLogs = pgTable("contact_logs", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull(),
  type: text("type").notNull(), // call, text, email, voicemail, in_person, note
  direction: text("direction").notNull().default("outbound"), // outbound, inbound
  outcome: text("outcome"), // connected, no_answer, left_voicemail, sent, received, bounced
  notes: text("notes"),
  loggedBy: integer("logged_by"),
  source: text("source").notNull().default("manual"), // manual, automated
  createdAt: text("created_at").notNull(),
});

export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  eventType: text("event_type").notNull(), // sales_design_appt, virtual_sales_design_appt, final_measurements, etc.
  location: text("location"),
  fromDate: text("from_date").notNull(), // ISO datetime
  toDate: text("to_date").notNull(), // ISO datetime
  allDay: integer("all_day").notNull().default(0), // boolean
  isPrivate: integer("is_private").notNull().default(0), // boolean
  reminderMinutes: integer("reminder_minutes"), // null = no reminder
  message: text("message"),
  isRecurring: integer("is_recurring").notNull().default(0),
  recurringPattern: text("recurring_pattern"), // daily, weekly, monthly
  clientId: integer("client_id"), // optional link
  projectId: integer("project_id"), // optional link
  createdBy: integer("created_by"), // user id
  createdAt: text("created_at").notNull(),
});

export const eventAttendees = pgTable("event_attendees", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull(),
  userId: integer("user_id").notNull(),
});

// Touchpoint quote sync — daily pull from Touchpoint CRM
export const touchpointQuotes = pgTable("touchpoint_quotes", {
  id: serial("id").primaryKey(),
  quoteId: text("quote_id").notNull().unique(), // Touchpoint's quote ID
  quoteName: text("quote_name"),
  customerName: text("customer_name"),
  customerAddress: text("customer_address"),
  territory: text("territory"),
  salesAgent: text("sales_agent"), // Touchpoint agent name
  assignedUserId: integer("assigned_user_id"), // mapped to our users.id
  quoteAmount: integer("quote_amount"), // cents
  status: text("status"), // Draft, Presented, Accepted, Declined
  touchpointCreatedAt: text("touchpoint_created_at"),
  touchpointUpdatedAt: text("touchpoint_updated_at"),
  syncedAt: text("synced_at").notNull(),
  clientId: integer("client_id"), // matched to our clients.id
  projectId: integer("project_id"), // matched to our projects.id
});

// Activity log — audit trail across the team
export const activityLog = pgTable("activity_log", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  actionType: text("action_type").notNull(), // created, updated, status_change, login, logout, etc.
  entityType: text("entity_type").notNull(), // client, project, task, issue, etc.
  entityId: integer("entity_id"),
  summary: text("summary").notNull(),
  metadata: text("metadata"), // JSON string for extra detail
  createdAt: text("created_at").notNull(),
});

export const insertContactLogSchema = createInsertSchema(contactLogs).omit({ id: true });
export type ContactLog = typeof contactLogs.$inferSelect;
export type InsertContactLog = z.infer<typeof insertContactLogSchema>;

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertClientSchema = createInsertSchema(clients).omit({ id: true });
export const insertProjectSchema = createInsertSchema(projects).omit({ id: true });
export const insertWindowSchema = createInsertSchema(windows).omit({ id: true });
export const insertTaskSchema = createInsertSchema(tasks).omit({ id: true });
export const insertIssueSchema = createInsertSchema(issues).omit({ id: true });
export const insertPhotoSchema = createInsertSchema(photos).omit({ id: true });
export const insertInstallChecklistSchema = createInsertSchema(installChecklists).omit({ id: true });
export const insertMaterialSchema = createInsertSchema(materials).omit({ id: true });
export const insertFollowUpSchema = createInsertSchema(followUps).omit({ id: true });
export const insertTouchpointQuoteSchema = createInsertSchema(touchpointQuotes).omit({ id: true });
export const insertActivityLogSchema = createInsertSchema(activityLog).omit({ id: true });
export const insertEventSchema = createInsertSchema(events).omit({ id: true });
export const insertEventAttendeeSchema = createInsertSchema(eventAttendees).omit({ id: true });

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Client = typeof clients.$inferSelect;
export type InsertClient = z.infer<typeof insertClientSchema>;
export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Window = typeof windows.$inferSelect;
export type InsertWindow = z.infer<typeof insertWindowSchema>;
export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Issue = typeof issues.$inferSelect;
export type InsertIssue = z.infer<typeof insertIssueSchema>;
export type Photo = typeof photos.$inferSelect;
export type InsertPhoto = z.infer<typeof insertPhotoSchema>;
export type InstallChecklist = typeof installChecklists.$inferSelect;
export type InsertInstallChecklist = z.infer<typeof insertInstallChecklistSchema>;
export type Material = typeof materials.$inferSelect;
export type InsertMaterial = z.infer<typeof insertMaterialSchema>;
export type FollowUp = typeof followUps.$inferSelect;
export type InsertFollowUp = z.infer<typeof insertFollowUpSchema>;
export type TouchpointQuote = typeof touchpointQuotes.$inferSelect;
export type InsertTouchpointQuote = z.infer<typeof insertTouchpointQuoteSchema>;
export type ActivityLog = typeof activityLog.$inferSelect;
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;
export type Event = typeof events.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type EventAttendee = typeof eventAttendees.$inferSelect;
export type InsertEventAttendee = z.infer<typeof insertEventAttendeeSchema>;
