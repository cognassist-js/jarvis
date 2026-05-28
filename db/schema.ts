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

export const TASK_PRIORITY = ["low", "medium", "high"] as const;
export type TaskPriority = (typeof TASK_PRIORITY)[number];

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
