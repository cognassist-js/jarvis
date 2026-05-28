"use server";
import { revalidatePath } from "next/cache";
import * as projectsService from "@/lib/services/projects";
import {
  createProjectSchema,
  updateProjectSchema,
} from "@/lib/schemas";

function revalidateAll() {
  revalidatePath("/");
  revalidatePath("/goals");
  revalidatePath("/projects");
}

export async function createProjectAction(input: unknown) {
  const parsed = createProjectSchema.parse(input);
  const p = await projectsService.createProject(parsed);
  revalidateAll();
  return p;
}

export async function updateProjectAction(input: unknown) {
  const parsed = updateProjectSchema.parse(input);
  const p = await projectsService.updateProject(parsed);
  revalidateAll();
  return p;
}

export async function deleteProjectAction(id: string) {
  await projectsService.deleteProject(id);
  revalidateAll();
}
