import "server-only";
import { and, eq, lt, sql } from "drizzle-orm";
import { db } from "@/db";
import { tasks, type Task, type TaskStatus } from "@/db/schema";
import { newId, now } from "@/lib/id";
import type {
  CreateTaskInput,
  ListTasksInput,
  MoveTaskInput,
  UpdateTaskInput,
} from "@/lib/schemas";

export async function listTasks(opts?: ListTasksInput): Promise<Task[]> {
  const conds = [];
  if (opts?.projectId) conds.push(eq(tasks.projectId, opts.projectId));
  if (opts?.status) conds.push(eq(tasks.status, opts.status));
  if (opts?.priority) conds.push(eq(tasks.priority, opts.priority));
  if (opts?.dueBefore) conds.push(lt(tasks.dueDate, opts.dueBefore));
  const where = conds.length ? and(...conds) : undefined;
  const q = where
    ? db.select().from(tasks).where(where)
    : db.select().from(tasks);
  return q.all();
}

export async function getTask(id: string): Promise<Task | undefined> {
  return db.select().from(tasks).where(eq(tasks.id, id)).get();
}

export async function createTask(input: CreateTaskInput): Promise<Task> {
  const ts = now();
  const status = input.status ?? "backlog";
  const maxSort = db
    .select({ m: sql<number>`coalesce(max(${tasks.sortOrder}), -1)` })
    .from(tasks)
    .where(and(eq(tasks.projectId, input.projectId), eq(tasks.status, status)))
    .get();
  const row = {
    id: newId(),
    projectId: input.projectId,
    title: input.title,
    description: input.description ?? null,
    status,
    priority: input.priority ?? ("medium" as const),
    dueDate: input.dueDate ?? null,
    sortOrder: (maxSort?.m ?? -1) + 1,
    completedAt: status === "done" ? ts : null,
    timeSpentMinutes: null,
    createdAt: ts,
    updatedAt: ts,
  };
  db.insert(tasks).values(row).run();
  return row;
}

export async function updateTask(
  input: UpdateTaskInput,
): Promise<Task | undefined> {
  const { id, ...rest } = input;
  const existing = await getTask(id);
  if (!existing) return undefined;
  const patch: Partial<Task> = { updatedAt: now() };
  if (rest.projectId !== undefined) patch.projectId = rest.projectId;
  if (rest.title !== undefined) patch.title = rest.title;
  if (rest.description !== undefined)
    patch.description = rest.description ?? null;
  if (rest.priority !== undefined) patch.priority = rest.priority;
  if (rest.dueDate !== undefined) patch.dueDate = rest.dueDate ?? null;
  if (rest.timeSpentMinutes !== undefined)
    patch.timeSpentMinutes = rest.timeSpentMinutes ?? null;
  if (rest.status !== undefined) {
    patch.status = rest.status;
    if (rest.status === "done" && existing.status !== "done") {
      patch.completedAt = now();
    } else if (rest.status !== "done" && existing.status === "done") {
      patch.completedAt = null;
    }
  }
  db.update(tasks).set(patch).where(eq(tasks.id, id)).run();
  return getTask(id);
}

export async function moveTask(input: MoveTaskInput): Promise<Task | undefined> {
  return updateTask({
    id: input.id,
    status: input.status,
  }).then(async (t) => {
    if (!t) return undefined;
    db.update(tasks)
      .set({ sortOrder: input.sortOrder, updatedAt: now() })
      .where(eq(tasks.id, input.id))
      .run();
    return getTask(input.id);
  });
}

export async function reorderColumn(
  status: TaskStatus,
  orderedIds: string[],
): Promise<void> {
  const ts = now();
  db.transaction((tx) => {
    orderedIds.forEach((id, idx) => {
      tx.update(tasks)
        .set({ status, sortOrder: idx, updatedAt: ts })
        .where(eq(tasks.id, id))
        .run();
    });
  });
}

export async function deleteTask(id: string): Promise<void> {
  db.delete(tasks).where(eq(tasks.id, id)).run();
}

export async function getDashboardSummary() {
  const all = db.select().from(tasks).all();
  const today = new Date().toISOString();
  const byStatus = {
    backlog: 0,
    todo: 0,
    in_progress: 0,
    blocked: 0,
    done: 0,
  } as Record<TaskStatus, number>;
  for (const t of all) byStatus[t.status]++;
  const overdue = all.filter(
    (t) => t.status !== "done" && t.dueDate && t.dueDate < today,
  );
  const recentlyDone = all
    .filter((t) => t.status === "done" && t.completedAt)
    .sort((a, b) => (b.completedAt ?? "").localeCompare(a.completedAt ?? ""))
    .slice(0, 5);
  return {
    counts: byStatus,
    total: all.length,
    overdueCount: overdue.length,
    overdue: overdue.slice(0, 10),
    recentlyCompleted: recentlyDone,
  };
}
