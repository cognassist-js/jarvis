"use server";
import { revalidatePath } from "next/cache";
import * as goalsService from "@/lib/services/goals";
import {
  createGoalSchema,
  updateGoalSchema,
} from "@/lib/schemas";

function revalidateAll() {
  revalidatePath("/");
  revalidatePath("/goals");
  revalidatePath("/projects");
}

export async function createGoalAction(input: unknown) {
  const parsed = createGoalSchema.parse(input);
  const goal = await goalsService.createGoal(parsed);
  revalidateAll();
  return goal;
}

export async function updateGoalAction(input: unknown) {
  const parsed = updateGoalSchema.parse(input);
  const goal = await goalsService.updateGoal(parsed);
  revalidateAll();
  return goal;
}

export async function archiveGoalAction(id: string) {
  const goal = await goalsService.archiveGoal(id);
  revalidateAll();
  return goal;
}

export async function deleteGoalAction(id: string) {
  await goalsService.deleteGoal(id);
  revalidateAll();
}
