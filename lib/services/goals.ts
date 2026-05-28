import "server-only";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { goals, projects, tasks, type Goal } from "@/db/schema";
import { newId, now } from "@/lib/id";
import type {
  CreateGoalInput,
  UpdateGoalInput,
} from "@/lib/schemas";

export type GoalWithStats = Goal & {
  totalTasks: number;
  doneTasks: number;
  projectCount: number;
  progress: number;
};

export async function listGoals(status?: Goal["status"]): Promise<Goal[]> {
  if (status) {
    return db.select().from(goals).where(eq(goals.status, status)).all();
  }
  return db.select().from(goals).all();
}

export async function listGoalsWithStats(): Promise<GoalWithStats[]> {
  const all = db.select().from(goals).all();
  const projectRows = db
    .select({ id: projects.id, goalId: projects.goalId })
    .from(projects)
    .all();
  const taskRows = db
    .select({
      projectId: tasks.projectId,
      status: tasks.status,
    })
    .from(tasks)
    .all();

  return all.map((g) => {
    const pIds = projectRows
      .filter((p) => p.goalId === g.id)
      .map((p) => p.id);
    const ts = taskRows.filter((t) => pIds.includes(t.projectId));
    const totalTasks = ts.length;
    const doneTasks = ts.filter((t) => t.status === "done").length;
    const progress = totalTasks === 0 ? 0 : Math.round((doneTasks / totalTasks) * 100);
    return {
      ...g,
      totalTasks,
      doneTasks,
      projectCount: pIds.length,
      progress,
    };
  });
}

export async function getGoal(id: string): Promise<Goal | undefined> {
  return db.select().from(goals).where(eq(goals.id, id)).get();
}

export async function createGoal(input: CreateGoalInput): Promise<Goal> {
  const ts = now();
  const row = {
    id: newId(),
    title: input.title,
    description: input.description ?? null,
    color: input.color ?? "#6ba6f5",
    status: "active" as const,
    targetDate: input.targetDate ?? null,
    createdAt: ts,
    updatedAt: ts,
  };
  db.insert(goals).values(row).run();
  return row;
}

export async function updateGoal(input: UpdateGoalInput): Promise<Goal | undefined> {
  const { id, ...rest } = input;
  const patch: Partial<Goal> = { updatedAt: now() };
  if (rest.title !== undefined) patch.title = rest.title;
  if (rest.description !== undefined) patch.description = rest.description ?? null;
  if (rest.color !== undefined) patch.color = rest.color;
  if (rest.status !== undefined) patch.status = rest.status;
  if (rest.targetDate !== undefined) patch.targetDate = rest.targetDate ?? null;
  db.update(goals).set(patch).where(eq(goals.id, id)).run();
  return getGoal(id);
}

export async function archiveGoal(id: string): Promise<Goal | undefined> {
  db.update(goals)
    .set({ status: "archived", updatedAt: now() })
    .where(eq(goals.id, id))
    .run();
  return getGoal(id);
}

export async function deleteGoal(id: string): Promise<void> {
  db.delete(goals).where(eq(goals.id, id)).run();
}

export async function goalCount(): Promise<number> {
  const r = db.select({ c: sql<number>`count(*)` }).from(goals).get();
  return r?.c ?? 0;
}
