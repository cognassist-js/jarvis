import { AppShell } from "@/components/app-shell";
import { BoardPage } from "@/components/board/board-page";
import { listTasks } from "@/lib/services/tasks";
import { listProjects } from "@/lib/services/projects";
import { listGoals } from "@/lib/services/goals";
import { getConnection } from "@/lib/services/calendar";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function param(v: string | string[] | undefined): string | undefined {
  if (Array.isArray(v)) return v[0];
  return v;
}

export default async function Home(props: PageProps) {
  const sp = await props.searchParams;
  const activeGoalId = param(sp.goal) ?? null;
  const activeTag = param(sp.tag) ?? null;

  const [tasks, projects, goals, connection] = await Promise.all([
    listTasks(),
    listProjects(),
    listGoals(),
    getConnection(),
  ]);

  return (
    <AppShell>
      <BoardPage
        tasks={tasks}
        projects={projects}
        goals={goals}
        activeGoalId={activeGoalId}
        activeTag={activeTag}
        calendar={{
          connected: !!connection,
          lastSyncedAt: connection?.lastSyncedAt ?? null,
        }}
      />
    </AppShell>
  );
}
