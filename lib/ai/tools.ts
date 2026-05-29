import "server-only";
import { tool } from "@ai-sdk/provider-utils";
import { z } from "zod";
import * as goalsService from "@/lib/services/goals";
import * as projectsService from "@/lib/services/projects";
import * as tasksService from "@/lib/services/tasks";
import {
  GOAL_STATUS,
  PROJECT_STATUS,
  TASK_PRIORITY,
  TASK_STATUS,
} from "@/db/schema";

const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/);
const isoDate = z.string().describe("ISO 8601 date string");

export const jarvisTools = {
  listGoals: tool({
    description:
      "List all goals for the user. Optionally filter by status (active or archived).",
    inputSchema: z.object({
      status: z.enum(GOAL_STATUS).optional(),
    }),
    execute: async ({ status }) => goalsService.listGoals(status),
  }),

  createGoal: tool({
    description:
      "Create a new long-running goal. Use when the user describes a high-level outcome (e.g. 'learn Spanish', 'ship side project').",
    inputSchema: z.object({
      title: z.string().min(1).max(200),
      description: z.string().max(2000).nullable().optional(),
      color: hexColor.optional().describe("#RRGGBB color tag, optional"),
      targetDate: isoDate.nullable().optional(),
    }),
    execute: async (input) => goalsService.createGoal(input),
  }),

  updateGoal: tool({
    description: "Update an existing goal by id (title, description, color, status, targetDate).",
    inputSchema: z.object({
      id: z.string(),
      title: z.string().min(1).max(200).optional(),
      description: z.string().max(2000).nullable().optional(),
      color: hexColor.optional(),
      status: z.enum(GOAL_STATUS).optional(),
      targetDate: isoDate.nullable().optional(),
    }),
    execute: async (input) => goalsService.updateGoal(input),
  }),

  archiveGoal: tool({
    description: "Archive a goal (sets status='archived'). Does not delete it.",
    inputSchema: z.object({ id: z.string() }),
    execute: async ({ id }) => goalsService.archiveGoal(id),
  }),

  listProjects: tool({
    description:
      "List projects, optionally filtered by goalId, status, or a tag (case-insensitive exact match, e.g. 'Content', 'Event', 'Admin').",
    inputSchema: z.object({
      goalId: z.string().optional(),
      status: z.enum(PROJECT_STATUS).optional(),
      tag: z.string().optional(),
    }),
    execute: async (input) => projectsService.listProjects(input),
  }),

  createProject: tool({
    description:
      "Create a new project, optionally attached to a goal. Use when the user describes a concrete body of work. Tags are short type labels (e.g. ['Content', 'Event']).",
    inputSchema: z.object({
      goalId: z.string().nullable().optional(),
      title: z.string().min(1).max(200),
      description: z.string().max(2000).nullable().optional(),
      dueDate: isoDate.nullable().optional(),
      tags: z.array(z.string().min(1).max(40)).max(20).optional(),
    }),
    execute: async (input) => projectsService.createProject(input),
  }),

  updateProject: tool({
    description:
      "Update a project (title, description, status, dueDate, goalId, tags). Passing tags REPLACES the existing set, so include all tags you want to keep.",
    inputSchema: z.object({
      id: z.string(),
      goalId: z.string().nullable().optional(),
      title: z.string().min(1).max(200).optional(),
      description: z.string().max(2000).nullable().optional(),
      status: z.enum(PROJECT_STATUS).optional(),
      dueDate: isoDate.nullable().optional(),
      tags: z.array(z.string().min(1).max(40)).max(20).optional(),
    }),
    execute: async (input) => projectsService.updateProject(input),
  }),

  listProjectTags: tool({
    description:
      "List every tag currently in use across all projects. Useful before creating a new tag to avoid duplicates.",
    inputSchema: z.object({}),
    execute: async () => projectsService.listAllTags(),
  }),

  listTasks: tool({
    description:
      "List tasks, optionally filtered by projectId, status, priority, or dueBefore (ISO date).",
    inputSchema: z.object({
      projectId: z.string().optional(),
      status: z.enum(TASK_STATUS).optional(),
      priority: z.enum(TASK_PRIORITY).optional(),
      dueBefore: isoDate.optional(),
    }),
    execute: async (input) => tasksService.listTasks(input),
  }),

  createTask: tool({
    description:
      "Create a new task under a project. Status defaults to 'backlog' if not specified.",
    inputSchema: z.object({
      projectId: z.string(),
      title: z.string().min(1).max(300),
      description: z.string().max(4000).nullable().optional(),
      status: z.enum(TASK_STATUS).optional(),
      priority: z.enum(TASK_PRIORITY).optional(),
      dueDate: isoDate.nullable().optional(),
    }),
    execute: async (input) => tasksService.createTask(input),
  }),

  updateTask: tool({
    description:
      "Update a task. Changing status moves the card on the kanban board (e.g. 'in_progress' → 'done' marks it complete). When marking a task done, you may also pass timeSpentMinutes if the user has told you how long it took (total minutes — e.g. 1h 25m = 85).",
    inputSchema: z.object({
      id: z.string(),
      projectId: z.string().optional(),
      title: z.string().min(1).max(300).optional(),
      description: z.string().max(4000).nullable().optional(),
      status: z.enum(TASK_STATUS).optional(),
      priority: z.enum(TASK_PRIORITY).optional(),
      timeSpentMinutes: z
        .number()
        .int()
        .min(0)
        .max(525_600)
        .nullable()
        .optional()
        .describe("Total minutes spent on the task. Pass null to clear."),
      dueDate: isoDate.nullable().optional(),
    }),
    execute: async (input) => tasksService.updateTask(input),
  }),

  deleteTask: tool({
    description: "Delete a task permanently.",
    inputSchema: z.object({ id: z.string() }),
    execute: async ({ id }) => {
      await tasksService.deleteTask(id);
      return { ok: true };
    },
  }),

  getDashboardSummary: tool({
    description:
      "Get an overview of the user's current load: task counts by status, overdue tasks, and recently completed work. Use this to answer 'what should I work on today?' or 'what's overdue?'.",
    inputSchema: z.object({}),
    execute: async () => tasksService.getDashboardSummary(),
  }),
};

export type JarvisToolSet = typeof jarvisTools;
