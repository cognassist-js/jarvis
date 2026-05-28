"use server";
import { revalidatePath } from "next/cache";
import * as tasksService from "@/lib/services/tasks";
import {
  createTaskSchema,
  updateTaskSchema,
  moveTaskSchema,
} from "@/lib/schemas";
import { z } from "zod";
import type { TaskStatus } from "@/db/schema";

function revalidateAll() {
  revalidatePath("/");
  revalidatePath("/goals");
  revalidatePath("/projects");
}

export async function createTaskAction(input: unknown) {
  const parsed = createTaskSchema.parse(input);
  const t = await tasksService.createTask(parsed);
  revalidateAll();
  return t;
}

export async function updateTaskAction(input: unknown) {
  const parsed = updateTaskSchema.parse(input);
  const t = await tasksService.updateTask(parsed);
  revalidateAll();
  return t;
}

export async function moveTaskAction(input: unknown) {
  const parsed = moveTaskSchema.parse(input);
  const t = await tasksService.moveTask(parsed);
  revalidateAll();
  return t;
}

const reorderSchema = z.object({
  status: z.enum([
    "backlog",
    "todo",
    "in_progress",
    "blocked",
    "done",
  ] as const),
  orderedIds: z.array(z.string()),
});

export async function reorderColumnAction(input: unknown) {
  const parsed = reorderSchema.parse(input);
  await tasksService.reorderColumn(
    parsed.status as TaskStatus,
    parsed.orderedIds,
  );
  revalidateAll();
}

export async function deleteTaskAction(id: string) {
  await tasksService.deleteTask(id);
  revalidateAll();
}
