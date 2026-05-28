import { AppShell } from "@/components/app-shell";
import { ProjectsPage } from "@/components/projects/projects-page";
import { listGoals } from "@/lib/services/goals";
import { listProjectsWithStats } from "@/lib/services/projects";

export const dynamic = "force-dynamic";

export default async function Projects() {
  const [projects, goals] = await Promise.all([
    listProjectsWithStats(),
    listGoals(),
  ]);
  return (
    <AppShell>
      <ProjectsPage projects={projects} goals={goals} />
    </AppShell>
  );
}
