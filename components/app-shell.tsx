import { Sidebar } from "./sidebar";
import { ChatPanel } from "./chat/chat-panel";
import { Statusbar } from "./statusbar";
import { GlobalCommands } from "./global-commands";
import { listGoalsWithStats } from "@/lib/services/goals";
import { listAllTags, listProjects } from "@/lib/services/projects";
import { getDashboardSummary } from "@/lib/services/tasks";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const [goals, projects, summary, allTags] = await Promise.all([
    listGoalsWithStats(),
    listProjects(),
    getDashboardSummary(),
    listAllTags(),
  ]);

  return (
    <div className="grid grid-cols-[290px_1fr_360px] gap-6 p-7 pb-20 min-h-screen max-w-[1920px] mx-auto">
      <Sidebar
        goals={goals}
        projects={projects}
        summary={summary}
        allTags={allTags}
      />
      <main className="clay-surface p-9 flex flex-col overflow-hidden min-h-0">
        {children}
      </main>
      <ChatPanel />
      <GlobalCommands projects={projects} />
      <Statusbar />
    </div>
  );
}
