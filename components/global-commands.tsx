"use client";
import { useEffect, useState } from "react";
import { CommandPalette } from "./command-palette";
import { NewTaskDialog } from "./board/new-task-dialog";
import type { Project } from "@/db/schema";

type NewTaskDetail = { projectId?: string };

export function GlobalCommands({ projects }: { projects: Project[] }) {
  const [newTaskOpen, setNewTaskOpen] = useState(false);
  const [defaultProjectId, setDefaultProjectId] = useState<string | undefined>(
    undefined,
  );

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<NewTaskDetail>).detail;
      setDefaultProjectId(detail?.projectId);
      setNewTaskOpen(true);
    };
    window.addEventListener("jarvis:new-task", handler);
    return () => window.removeEventListener("jarvis:new-task", handler);
  }, []);

  return (
    <>
      <CommandPalette
        onNewTask={() => {
          setDefaultProjectId(undefined);
          setNewTaskOpen(true);
        }}
      />
      <NewTaskDialog
        open={newTaskOpen}
        onOpenChange={(o) => {
          setNewTaskOpen(o);
          if (!o) setDefaultProjectId(undefined);
        }}
        projects={projects}
        defaultProjectId={defaultProjectId}
      />
    </>
  );
}
