import { z } from "zod";
import {
  GOAL_STATUS,
  PROJECT_STATUS,
  TASK_STATUS,
  TASK_PRIORITY,
} from "@/db/schema";

const hexColor = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, "Expected a #RRGGBB color");
const isoDate = z.string().min(1).nullable().optional();

export const createGoalSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).nullable().optional(),
  color: hexColor.optional(),
  targetDate: isoDate,
});
export type CreateGoalInput = z.infer<typeof createGoalSchema>;

export const updateGoalSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).nullable().optional(),
  color: hexColor.optional(),
  status: z.enum(GOAL_STATUS).optional(),
  targetDate: isoDate,
});
export type UpdateGoalInput = z.infer<typeof updateGoalSchema>;

const tagsArray = z
  .array(z.string().trim().min(1).max(40))
  .max(20)
  .optional();

export const createProjectSchema = z.object({
  goalId: z.string().min(1).nullable().optional(),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).nullable().optional(),
  status: z.enum(PROJECT_STATUS).optional(),
  dueDate: isoDate,
  tags: tagsArray,
});
export type CreateProjectInput = z.infer<typeof createProjectSchema>;

export const updateProjectSchema = z.object({
  id: z.string().min(1),
  goalId: z.string().min(1).nullable().optional(),
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).nullable().optional(),
  status: z.enum(PROJECT_STATUS).optional(),
  dueDate: isoDate,
  tags: tagsArray,
});
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;

export const createTaskSchema = z.object({
  projectId: z.string().min(1),
  title: z.string().min(1).max(300),
  description: z.string().max(4000).nullable().optional(),
  status: z.enum(TASK_STATUS).optional(),
  priority: z.enum(TASK_PRIORITY).optional(),
  dueDate: isoDate,
});
export type CreateTaskInput = z.infer<typeof createTaskSchema>;

export const updateTaskSchema = z.object({
  id: z.string().min(1),
  projectId: z.string().min(1).optional(),
  title: z.string().min(1).max(300).optional(),
  description: z.string().max(4000).nullable().optional(),
  status: z.enum(TASK_STATUS).optional(),
  priority: z.enum(TASK_PRIORITY).optional(),
  dueDate: isoDate,
});
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;

export const moveTaskSchema = z.object({
  id: z.string().min(1),
  status: z.enum(TASK_STATUS),
  sortOrder: z.number().int(),
});
export type MoveTaskInput = z.infer<typeof moveTaskSchema>;

export const listTasksSchema = z.object({
  projectId: z.string().optional(),
  status: z.enum(TASK_STATUS).optional(),
  priority: z.enum(TASK_PRIORITY).optional(),
  dueBefore: z.string().optional(),
});
export type ListTasksInput = z.infer<typeof listTasksSchema>;
