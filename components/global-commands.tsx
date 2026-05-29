"use client";
import { useEffect, useState } from "react";
import { CommandPalette } from "./command-palette";
import { NewTaskDialog } from "./board/new-task-dialog";
import { TimeSpentDialog } from "./board/time-spent-dialog";
import type { Project } from "@/db/schema";

type NewTaskDetail = { projectId?: string };
type TaskCompletedDetail = {
  taskId: string;
  taskTitle?: string;
  initialMinutes?: number | null;
};

export function GlobalCommands({ projects }: { projects: Project[] }) {
  const [newTaskOpen, setNewTaskOpen] = useState(false);
  const [defaultProjectId, setDefaultProjectId] = useState<string | undefined>(
    undefined,
  );

  const [timeSpent, setTimeSpent] = useState<TaskCompletedDetail | null>(null);

  useEffect(() => {
    const newTaskHandler = (e: Event) => {
      const detail = (e as CustomEvent<NewTaskDetail>).detail;
      setDefaultProjectId(detail?.projectId);
      setNewTaskOpen(true);
    };
    const completedHandler = (e: Event) => {
      const detail = (e as CustomEvent<TaskCompletedDetail>).detail;
      if (detail?.taskId) setTimeSpent(detail);
    };
    window.addEventListener("jarvis:new-task", newTaskHandler);
    window.addEventListener("jarvis:task-completed", completedHandler);
    return () => {
      window.removeEventListener("jarvis:new-task", newTaskHandler);
      window.removeEventListener("jarvis:task-completed", completedHandler);
    };
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
      <TimeSpentDialog
        open={timeSpent !== null}
        onOpenChange={(o) => !o && setTimeSpent(null)}
        taskId={timeSpent?.taskId ?? null}
        taskTitle={timeSpent?.taskTitle ?? null}
        initialMinutes={timeSpent?.initialMinutes ?? null}
      />
    </>
  );
}
