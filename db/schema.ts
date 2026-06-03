import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

export const GOAL_STATUS = ["active", "archived"] as const;
export type GoalStatus = (typeof GOAL_STATUS)[number];

export const PROJECT_STATUS = [
  "not_started",
  "active",
  "on_hold",
  "completed",
] as const;
export type ProjectStatus = (typeof PROJECT_STATUS)[number];

export const TASK_STATUS = [
  "backlog",
  "todo",
  "in_progress",
  "blocked",
  "done",
] as const;
export type TaskStatus = (typeof TASK_STATUS)[number];

// "critical" sits above "high": for these tasks the due date is treated as a
// hard, business-critical deadline rather than a soft suggestion.
export const TASK_PRIORITY = ["low", "medium", "high", "critical"] as const;
export type TaskPriority = (typeof TASK_PRIORITY)[number];

// Where a task originated. "calendar" tasks are owned by the ICS sync engine
// for their calendar-derived fields (title/dates); see lib/services/calendar.ts.
export const TASK_SOURCE = ["manual", "calendar"] as const;
export type TaskSource = (typeof TASK_SOURCE)[number];

export const CHAT_ROLE = ["user", "assistant", "tool"] as const;
export type ChatRole = (typeof CHAT_ROLE)[number];

export const goals = sqliteTable("goals", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  color: text("color").notNull().default("#6ba6f5"),
  status: text("status", { enum: GOAL_STATUS }).notNull().default("active"),
  targetDate: text("target_date"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const projects = sqliteTable("projects", {
  id: text("id").primaryKey(),
  goalId: text("goal_id").references(() => goals.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status", { enum: PROJECT_STATUS })
    .notNull()
    .default("not_started"),
  dueDate: text("due_date"),
  tags: text("tags", { mode: "json" })
    .$type<string[]>()
    .notNull()
    .default([]),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const tasks = sqliteTable("tasks", {
  id: text("id").primaryKey(),
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status", { enum: TASK_STATUS }).notNull().default("backlog"),
  priority: text("priority", { enum: TASK_PRIORITY })
    .notNull()
    .default("medium"),
  dueDate: text("due_date"),
  sortOrder: integer("sort_order").notNull().default(0),
  completedAt: text("completed_at"),
  timeSpentMinutes: integer("time_spent_minutes"),
  // Calendar provenance. "manual" tasks leave the external fields null.
  source: text("source", { enum: TASK_SOURCE }).notNull().default("manual"),
  // Stable identity for a synced calendar event instance: `${UID}::${startISO}`.
  // Unique so re-syncs upsert instead of duplicating; many NULLs are allowed.
  externalId: text("external_id").unique(),
  meetingStart: text("meeting_start"),
  meetingEnd: text("meeting_end"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

// Single-row table holding the ICS calendar subscription + last-sync state.
export const calendarConnection = sqliteTable("calendar_connection", {
  id: text("id").primaryKey(),
  icsUrl: text("ics_url").notNull(),
  defaultProjectId: text("default_project_id").references(() => projects.id, {
    onDelete: "set null",
  }),
  syncWindowDays: integer("sync_window_days").notNull().default(14),
  lastSyncedAt: text("last_synced_at"),
  lastSyncStatus: text("last_sync_status"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const chatMessages = sqliteTable("chat_messages", {
  id: text("id").primaryKey(),
  role: text("role", { enum: CHAT_ROLE }).notNull(),
  content: text("content").notNull(),
  createdAt: text("created_at").notNull(),
});

export const goalsRelations = relations(goals, ({ many }) => ({
  projects: many(projects),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  goal: one(goals, {
    fields: [projects.goalId],
    references: [goals.id],
  }),
  tasks: many(tasks),
}));

export const tasksRelations = relations(tasks, ({ one }) => ({
  project: one(projects, {
    fields: [tasks.projectId],
    references: [projects.id],
  }),
}));

export type Goal = typeof goals.$inferSelect;
export type NewGoal = typeof goals.$inferInsert;
export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type NewChatMessage = typeof chatMessages.$inferInsert;
export type CalendarConnection = typeof calendarConnection.$inferSelect;
export type NewCalendarConnection = typeof calendarConnection.$inferInsert;
