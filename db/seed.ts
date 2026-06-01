import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { nanoid } from "nanoid";
import { addDays, formatISO } from "date-fns";
import { resolve } from "node:path";
import {
  goals,
  projects,
  tasks,
  chatMessages,
  type NewGoal,
  type NewProject,
  type NewTask,
} from "./schema";

const DB_PATH = resolve(process.cwd(), "data", "jarvis.db");
const sqlite = new Database(DB_PATH);
sqlite.pragma("foreign_keys = ON");
const db = drizzle(sqlite);

const now = () => new Date().toISOString();
const inDays = (n: number) => formatISO(addDays(new Date(), n));

async function main() {
  console.log("Wiping existing rows…");
  await db.delete(tasks);
  await db.delete(projects);
  await db.delete(goals);
  await db.delete(chatMessages);

  const goalIds = {
    side: nanoid(),
    fitness: nanoid(),
    spanish: nanoid(),
  };

  const seedGoals: NewGoal[] = [
    {
      id: goalIds.side,
      title: "Ship side project",
      description: "Get Jarvis MVP to a usable state.",
      color: "#6ba6f5",
      status: "active",
      targetDate: inDays(45),
      createdAt: now(),
      updatedAt: now(),
    },
    {
      id: goalIds.fitness,
      title: "Get fit",
      description: "Run 3×/week, lift 2×/week.",
      color: "#6dd5c7",
      status: "active",
      targetDate: null,
      createdAt: now(),
      updatedAt: now(),
    },
    {
      id: goalIds.spanish,
      title: "Learn Spanish",
      description: "Reach conversational B1 by year's end.",
      color: "#a995ec",
      status: "active",
      targetDate: inDays(180),
      createdAt: now(),
      updatedAt: now(),
    },
  ];
  await db.insert(goals).values(seedGoals);

  const projectIds = {
    jarvis: nanoid(),
    couch: nanoid(),
    duolingo: nanoid(),
  };

  const seedProjects: NewProject[] = [
    {
      id: projectIds.jarvis,
      goalId: goalIds.side,
      title: "Jarvis MVP",
      description: "Kanban + AI chat planner.",
      status: "active",
      dueDate: inDays(30),
      sortOrder: 0,
      createdAt: now(),
      updatedAt: now(),
    },
    {
      id: projectIds.couch,
      goalId: goalIds.fitness,
      title: "Couch to 5K",
      description: "Eight-week running plan.",
      status: "active",
      dueDate: inDays(56),
      sortOrder: 1,
      createdAt: now(),
      updatedAt: now(),
    },
    {
      id: projectIds.duolingo,
      goalId: goalIds.spanish,
      title: "Duolingo daily streak",
      description: "One lesson a day, no excuses.",
      status: "active",
      dueDate: null,
      sortOrder: 2,
      createdAt: now(),
      updatedAt: now(),
    },
  ];
  await db.insert(projects).values(seedProjects);

  const seedTasks: NewTask[] = [
    {
      id: nanoid(),
      projectId: projectIds.jarvis,
      title: "Sketch goals empty state",
      status: "backlog",
      priority: "low",
      dueDate: inDays(7),
      sortOrder: 0,
      createdAt: now(),
      updatedAt: now(),
    },
    {
      id: nanoid(),
      projectId: projectIds.duolingo,
      title: "Find a tutor on iTalki",
      status: "backlog",
      priority: "low",
      dueDate: null,
      sortOrder: 1,
      createdAt: now(),
      updatedAt: now(),
    },
    {
      id: nanoid(),
      projectId: projectIds.jarvis,
      title: "Decide billing model",
      status: "backlog",
      priority: "medium",
      dueDate: inDays(15),
      sortOrder: 2,
      createdAt: now(),
      updatedAt: now(),
    },
    {
      id: nanoid(),
      projectId: projectIds.jarvis,
      title: "Wire up Drizzle migrations",
      description: "Schema + initial seed + studio script.",
      status: "todo",
      priority: "high",
      dueDate: inDays(1),
      sortOrder: 0,
      createdAt: now(),
      updatedAt: now(),
    },
    {
      id: nanoid(),
      projectId: projectIds.couch,
      title: "Buy running shoes",
      status: "todo",
      priority: "medium",
      dueDate: inDays(3),
      sortOrder: 1,
      createdAt: now(),
      updatedAt: now(),
    },
    {
      id: nanoid(),
      projectId: projectIds.jarvis,
      title: "Write the README",
      status: "todo",
      priority: "medium",
      dueDate: inDays(5),
      sortOrder: 2,
      createdAt: now(),
      updatedAt: now(),
    },
    {
      id: nanoid(),
      projectId: projectIds.jarvis,
      title: "Design the kanban board UI",
      description: "Clay/Ocean direction — translate prototype to Tailwind.",
      status: "in_progress",
      priority: "high",
      dueDate: inDays(2),
      sortOrder: 0,
      createdAt: now(),
      updatedAt: now(),
    },
    {
      id: nanoid(),
      projectId: projectIds.duolingo,
      title: "Finish Duolingo week 1",
      status: "in_progress",
      priority: "low",
      dueDate: inDays(4),
      sortOrder: 1,
      createdAt: now(),
      updatedAt: now(),
    },
    {
      id: nanoid(),
      projectId: projectIds.jarvis,
      title: "Vercel AI Gateway key",
      description: "Waiting on admin to provision.",
      status: "blocked",
      priority: "critical",
      dueDate: inDays(-2),
      sortOrder: 0,
      createdAt: now(),
      updatedAt: now(),
    },
    {
      id: nanoid(),
      projectId: projectIds.jarvis,
      title: "Set up Next.js scaffold",
      status: "done",
      priority: "medium",
      dueDate: inDays(-2),
      completedAt: inDays(-2),
      sortOrder: 0,
      createdAt: now(),
      updatedAt: now(),
    },
    {
      id: nanoid(),
      projectId: projectIds.couch,
      title: "3km run · Monday",
      status: "done",
      priority: "low",
      dueDate: inDays(-1),
      completedAt: inDays(-1),
      sortOrder: 1,
      createdAt: now(),
      updatedAt: now(),
    },
  ];
  await db.insert(tasks).values(seedTasks);

  console.log(
    `Seeded ${seedGoals.length} goals, ${seedProjects.length} projects, ${seedTasks.length} tasks.`,
  );
  sqlite.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
