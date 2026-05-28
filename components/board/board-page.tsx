"use client";
import { useEffect, useMemo, useState, useTransition } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove } from "@dnd-kit/sortable";
import { useRouter } from "next/navigation";
import { Search, Plus } from "lucide-react";
import { toast } from "sonner";
import type { Goal, Project, Task, TaskStatus } from "@/db/schema";
import { TASK_STATUS } from "@/db/schema";
import { TaskCard } from "./task-card";
import { TaskDrawer } from "./task-drawer";
import { reorderColumnAction } from "@/app/actions/tasks";
import { Button } from "@/components/ui/button";

const COLUMNS: { id: TaskStatus; label: string }[] = [
  { id: "backlog", label: "Backlog" },
  { id: "todo", label: "To Do" },
  { id: "in_progress", label: "In Progress" },
  { id: "blocked", label: "Blocked" },
  { id: "done", label: "Done" },
];

export function BoardPage({
  tasks: initialTasks,
  projects,
  goals,
}: {
  tasks: Task[];
  projects: Project[];
  goals: Goal[];
}) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const router = useRouter();

  // Sync when server data changes (after revalidation)
  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  // Listen for chat-driven refresh requests
  useEffect(() => {
    const handler = () => router.refresh();
    window.addEventListener("jarvis:refresh", handler);
    return () => window.removeEventListener("jarvis:refresh", handler);
  }, [router]);

  // "n" → open the global new-task dialog (handled by AppShell)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const inEditable =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable;
      if (inEditable) return;
      if (e.key === "n" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent("jarvis:new-task"));
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
  );

  const byColumn = useMemo(() => {
    const map: Record<TaskStatus, Task[]> = {
      backlog: [],
      todo: [],
      in_progress: [],
      blocked: [],
      done: [],
    };
    for (const t of tasks) map[t.status].push(t);
    for (const status of TASK_STATUS) {
      map[status].sort((a, b) => a.sortOrder - b.sortOrder);
    }
    return map;
  }, [tasks]);

  const activeTask = activeId ? tasks.find((t) => t.id === activeId) : null;

  function findContainer(id: string): TaskStatus | undefined {
    if (TASK_STATUS.includes(id as TaskStatus)) return id as TaskStatus;
    return tasks.find((t) => t.id === id)?.status;
  }

  function onDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
  }

  function onDragOver(e: DragOverEvent) {
    const { active, over } = e;
    if (!over) return;
    const activeId = String(active.id);
    const overId = String(over.id);
    const activeCol = findContainer(activeId);
    const overCol = findContainer(overId);
    if (!activeCol || !overCol) return;
    if (activeCol === overCol) return;
    setTasks((prev) => {
      const next = [...prev];
      const idx = next.findIndex((t) => t.id === activeId);
      if (idx === -1) return prev;
      next[idx] = { ...next[idx], status: overCol };
      return next;
    });
  }

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    setActiveId(null);
    if (!over) return;
    const activeId = String(active.id);
    const overId = String(over.id);
    const overCol = findContainer(overId);
    if (!overCol) return;

    setTasks((prev) => {
      const inCol = prev
        .filter((t) => t.status === overCol)
        .sort((a, b) => a.sortOrder - b.sortOrder);
      const oldIndex = inCol.findIndex((t) => t.id === activeId);
      let newIndex: number;
      if (TASK_STATUS.includes(overId as TaskStatus)) {
        newIndex = inCol.length - (oldIndex !== -1 ? 1 : 0);
      } else {
        newIndex = inCol.findIndex((t) => t.id === overId);
        if (newIndex === -1) newIndex = inCol.length;
      }
      const reordered =
        oldIndex !== -1
          ? arrayMove(inCol, oldIndex, newIndex)
          : [...inCol, prev.find((t) => t.id === activeId)!].filter(Boolean);

      const orderedIds = reordered.map((t) => t.id);
      startTransition(async () => {
        try {
          await reorderColumnAction({ status: overCol, orderedIds });
        } catch (err) {
          toast.error("Failed to save");
          console.error(err);
        }
      });

      const updated = prev.map((t) => {
        const idx = reordered.findIndex((r) => r.id === t.id);
        if (idx === -1) return t;
        return { ...t, status: overCol, sortOrder: idx };
      });
      return updated;
    });
  }

  const high = tasks.filter((t) => t.priority === "high" && t.status !== "done").length;
  const blocked = byColumn.blocked.length;

  return (
    <>
      <div className="flex items-center gap-2.5 text-[12.5px] font-bold text-[var(--color-ink-mid)] mb-2.5">
        <span
          className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-white text-[11px] font-extrabold uppercase tracking-[0.06em]"
          style={{
            background:
              "linear-gradient(160deg, var(--color-clay-sky), var(--color-clay-deep))",
            boxShadow:
              "0 6px 12px -3px rgba(85, 145, 235, 0.5), inset 0 2px 0 rgba(255,255,255,0.4)",
          }}
        >
          <span
            className="w-[7px] h-[7px] rounded-full bg-white"
            style={{ boxShadow: "0 0 4px rgba(255,255,255,0.8)" }}
          />
          Workspace
        </span>
        <span className="text-[var(--color-ink-faint)]">›</span>
        <span className="text-[var(--color-ink)]">Board</span>
      </div>

      <div className="flex items-center justify-between mb-7">
        <h2 className="font-display text-[44px] font-black leading-none tracking-[-0.03em] text-[var(--color-ink)]">
          This week's{" "}
          <span className="italic font-bold text-[var(--color-clay-deep)]">
            board.
          </span>
          <small className="block font-sans text-sm font-semibold text-[var(--color-ink-mid)] mt-2 tracking-normal">
            {tasks.length} tasks · {high} high priority · {blocked} blocked
          </small>
        </h2>
        <div className="flex items-center gap-3">
          <Button variant="icon" aria-label="Search">
            <Search size={20} strokeWidth={2.4} />
          </Button>
          <Button
            variant="primary"
            onClick={() => window.dispatchEvent(new CustomEvent("jarvis:new-task"))}
            className="text-[15px] px-6 rounded-[20px]"
          >
            <span
              className="w-[22px] h-[22px] rounded-[10px] grid place-items-center text-white font-extrabold"
              style={{ background: "rgba(255,255,255,0.3)" }}
            >
              <Plus size={14} strokeWidth={3} />
            </span>
            New task
          </Button>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
      >
        <div className="grid grid-cols-5 gap-3.5 flex-1 overflow-hidden min-h-0">
          {COLUMNS.map((col) => (
            <Column
              key={col.id}
              status={col.id}
              label={col.label}
              tasks={byColumn[col.id]}
              goals={goals}
              projects={projects}
              onOpen={setOpenTaskId}
            />
          ))}
        </div>
        <DragOverlay>
          {activeTask ? (
            <TaskCard
              task={activeTask}
              goals={goals}
              projects={projects}
              dragging
            />
          ) : null}
        </DragOverlay>
      </DndContext>

      <TaskDrawer
        taskId={openTaskId}
        tasks={tasks}
        projects={projects}
        goals={goals}
        onClose={() => setOpenTaskId(null)}
      />
    </>
  );
}

function Column({
  status,
  label,
  tasks,
  goals,
  projects,
  onOpen,
}: {
  status: TaskStatus;
  label: string;
  tasks: Task[];
  goals: Goal[];
  projects: Project[];
  onOpen: (id: string) => void;
}) {
  return (
    <div className="flex flex-col min-h-0" data-col={status}>
      <ColumnHeader status={status} label={label} count={tasks.length} />
      <SortableContext
        id={status}
        items={tasks.map((t) => t.id)}
      >
        <ColumnDroppable id={status}>
          <div className="flex-1 overflow-y-auto flex flex-col gap-3.5 p-1 pb-2 min-h-[120px]">
            {tasks.length === 0 && (
              <div className="text-[11px] text-[var(--color-ink-faint)] font-semibold italic px-2 py-3">
                Drop tasks here
              </div>
            )}
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                goals={goals}
                projects={projects}
                onClick={() => onOpen(task.id)}
              />
            ))}
          </div>
        </ColumnDroppable>
      </SortableContext>
    </div>
  );
}

import { useDroppable } from "@dnd-kit/core";

function ColumnDroppable({
  id,
  children,
}: {
  id: TaskStatus;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={`flex-1 flex flex-col min-h-0 rounded-[20px] transition-colors ${
        isOver ? "bg-white/40" : ""
      }`}
    >
      {children}
    </div>
  );
}

function ColumnHeader({
  status,
  label,
  count,
}: {
  status: TaskStatus;
  label: string;
  count: number;
}) {
  const styles: Record<TaskStatus, React.CSSProperties> = {
    backlog: {
      background: "linear-gradient(160deg, #f0f6ff, #dceaf8)",
      color: "var(--color-ink)",
    },
    todo: {
      background:
        "linear-gradient(160deg, var(--color-clay-sky), var(--color-clay-deep))",
      color: "white",
    },
    in_progress: {
      background:
        "linear-gradient(160deg, var(--color-clay-mint), var(--color-clay-aqua))",
      color: "#0e4a3e",
    },
    blocked: {
      background:
        "linear-gradient(160deg, var(--color-clay-coral), var(--color-clay-coral-2))",
      color: "white",
    },
    done: {
      background:
        "linear-gradient(160deg, var(--color-clay-lilac), var(--color-clay-lavender))",
      color: "white",
    },
  };
  return (
    <div
      className="px-4 py-3.5 rounded-[20px] mb-3.5 flex items-center justify-between"
      style={{
        ...styles[status],
        boxShadow:
          "0 8px 16px -4px rgba(45, 75, 156, 0.15), inset 0 3px 0 rgba(255,255,255,0.5), inset 0 -2px 6px rgba(0,0,0,0.06)",
      }}
    >
      <div className="font-display text-[18px] font-extrabold tracking-[-0.015em]">
        {label}
      </div>
      <span
        className="font-sans text-[13px] font-extrabold px-3 py-1 rounded-full tabular-nums"
        style={{
          background: "rgba(255,255,255,0.5)",
          boxShadow: "inset 0 2px 4px rgba(0,0,0,0.08)",
          color: "inherit",
        }}
      >
        {count}
      </span>
    </div>
  );
}
