import { AppShell } from "@/components/app-shell";
import { BoardPage } from "@/components/board/board-page";
import { listTasks } from "@/lib/services/tasks";
import { listProjects } from "@/lib/services/projects";
import { listGoals } from "@/lib/services/goals";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [tasks, projects, goals] = await Promise.all([
    listTasks(),
    listProjects(),
    listGoals(),
  ]);

  return (
    <AppShell>
      <BoardPage tasks={tasks} projects={projects} goals={goals} />
    </AppShell>
  );
}
