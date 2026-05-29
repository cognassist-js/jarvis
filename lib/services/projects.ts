import "server-only";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { projects, tasks, type Project } from "@/db/schema";
import { newId, now } from "@/lib/id";
import type {
  CreateProjectInput,
  UpdateProjectInput,
} from "@/lib/schemas";

export type ProjectWithStats = Project & {
  totalTasks: number;
  doneTasks: number;
  progress: number;
};

function normalizeTags(input: readonly string[] | null | undefined): string[] {
  if (!input) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of input) {
    const t = raw.trim();
    if (!t) continue;
    const key = t.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(t);
  }
  return out;
}

export async function listProjects(opts?: {
  goalId?: string;
  status?: Project["status"];
  tag?: string;
}): Promise<Project[]> {
  const conds = [];
  if (opts?.goalId) conds.push(eq(projects.goalId, opts.goalId));
  if (opts?.status) conds.push(eq(projects.status, opts.status));
  const where = conds.length ? and(...conds) : undefined;
  const rows = where
    ? db.select().from(projects).where(where).all()
    : db.select().from(projects).all();
  if (opts?.tag) {
    const needle = opts.tag.toLowerCase();
    return rows.filter((p) =>
      (p.tags ?? []).some((t) => t.toLowerCase() === needle),
    );
  }
  return rows;
}

export async function listProjectsWithStats(opts?: {
  goalId?: string;
  tag?: string;
}): Promise<ProjectWithStats[]> {
  const list = await listProjects(opts);
  const taskRows = db
    .select({
      projectId: tasks.projectId,
      status: tasks.status,
    })
    .from(tasks)
    .all();
  return list.map((p) => {
    const ts = taskRows.filter((t) => t.projectId === p.id);
    const totalTasks = ts.length;
    const doneTasks = ts.filter((t) => t.status === "done").length;
    const progress = totalTasks === 0 ? 0 : Math.round((doneTasks / totalTasks) * 100);
    return { ...p, totalTasks, doneTasks, progress };
  });
}

export async function getProject(id: string): Promise<Project | undefined> {
  return db.select().from(projects).where(eq(projects.id, id)).get();
}

export async function listAllTags(): Promise<string[]> {
  const rows = db.select({ tags: projects.tags }).from(projects).all();
  const seen = new Map<string, string>(); // lower → display
  for (const r of rows) {
    for (const t of r.tags ?? []) {
      const k = t.toLowerCase();
      if (!seen.has(k)) seen.set(k, t);
    }
  }
  return [...seen.values()].sort((a, b) => a.localeCompare(b));
}

export async function createProject(
  input: CreateProjectInput,
): Promise<Project> {
  const ts = now();
  const maxSort = db
    .select({ m: sql<number>`coalesce(max(${projects.sortOrder}), -1)` })
    .from(projects)
    .get();
  const row = {
    id: newId(),
    goalId: input.goalId ?? null,
    title: input.title,
    description: input.description ?? null,
    status: input.status ?? ("not_started" as const),
    dueDate: input.dueDate ?? null,
    tags: normalizeTags(input.tags),
    sortOrder: (maxSort?.m ?? -1) + 1,
    createdAt: ts,
    updatedAt: ts,
  };
  db.insert(projects).values(row).run();
  return row;
}

export async function updateProject(
  input: UpdateProjectInput,
): Promise<Project | undefined> {
  const { id, ...rest } = input;
  const patch: Partial<Project> = { updatedAt: now() };
  if (rest.goalId !== undefined) patch.goalId = rest.goalId ?? null;
  if (rest.title !== undefined) patch.title = rest.title;
  if (rest.description !== undefined) patch.description = rest.description ?? null;
  if (rest.status !== undefined) patch.status = rest.status;
  if (rest.dueDate !== undefined) patch.dueDate = rest.dueDate ?? null;
  if (rest.tags !== undefined) patch.tags = normalizeTags(rest.tags);
  db.update(projects).set(patch).where(eq(projects.id, id)).run();
  return getProject(id);
}

export async function deleteProject(id: string): Promise<void> {
  db.delete(projects).where(eq(projects.id, id)).run();
}
