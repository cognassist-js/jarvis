import { AppShell } from "@/components/app-shell";
import { GoalsPage } from "@/components/goals/goals-page";
import { listGoalsWithStats } from "@/lib/services/goals";
import { listProjectsWithStats } from "@/lib/services/projects";

export const dynamic = "force-dynamic";

export default async function Goals() {
  const [goals, projects] = await Promise.all([
    listGoalsWithStats(),
    listProjectsWithStats(),
  ]);
  return (
    <AppShell>
      <GoalsPage goals={goals} projects={projects} />
    </AppShell>
  );
}
