import { AppShell } from "@/components/app-shell";
import { ProjectsPage } from "@/components/projects/projects-page";
import { listGoals } from "@/lib/services/goals";
import {
  listAllTags,
  listProjectsWithStats,
} from "@/lib/services/projects";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function param(v: string | string[] | undefined): string | undefined {
  if (Array.isArray(v)) return v[0];
  return v;
}

export default async function Projects(props: PageProps) {
  const sp = await props.searchParams;
  const tag = param(sp.tag);
  const goalId = param(sp.goal);

  const [projects, goals, allTags] = await Promise.all([
    listProjectsWithStats({ tag, goalId }),
    listGoals(),
    listAllTags(),
  ]);

  return (
    <AppShell>
      <ProjectsPage
        projects={projects}
        goals={goals}
        allTags={allTags}
        activeTag={tag ?? null}
        activeGoalId={goalId ?? null}
      />
    </AppShell>
  );
}
