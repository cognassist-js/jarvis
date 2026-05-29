"use client";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  useDroppable,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove } from "@dnd-kit/sortable";
import { useRouter } from "next/navigation";
import { Search, Plus, X, CalendarRange } from "lucide-react";
import { toast } from "sonner";
import type { Goal, Project, Task, TaskStatus } from "@/db/schema";
import { TASK_STATUS } from "@/db/schema";
import { TaskCard } from "./task-card";
import { TaskDrawer } from "./task-drawer";
import { CompletedCalendar } from "./completed-calendar";
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
  activeGoalId,
  activeTag,
}: {
  tasks: Task[];
  projects: Project[];
  goals: Goal[];
  activeGoalId: string | null;
  activeTag: string | null;
}) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [, startTransition] = useTransition();
  const router = useRouter();
  // Captured at drag-start so we can detect a "transition into Done" on drop.
  const dragSourceStatusRef = useRef<TaskStatus | null>(null);

  const activeGoal = activeGoalId
    ? goals.find((g) => g.id === activeGoalId) ?? null
    : null;
  const hasFilter = !!activeGoal || !!activeTag;

  function clearFilters() {
    router.push("/");
  }
  function clearGoal() {
    const sp = new URLSearchParams();
    if (activeTag) sp.set("tag", activeTag);
    router.push(sp.toString() ? `/?${sp}` : "/");
  }
  function clearTag() {
    const sp = new URLSearchParams();
    if (activeGoalId) sp.set("goal", activeGoalId);
    router.push(sp.toString() ? `/?${sp}` : "/");
  }

  // Apply URL filters to the visible task set
  const visibleTasks = useMemo(() => {
    if (!hasFilter) return tasks;
    const projectById = new Map(projects.map((p) => [p.id, p]));
    const needle = activeTag?.toLowerCase();
    return tasks.filter((t) => {
      const project = projectById.get(t.projectId);
      if (!project) return false;
      if (activeGoalId && project.goalId !== activeGoalId) return false;
      if (
        needle &&
        !(project.tags ?? []).some((x) => x.toLowerCase() === needle)
      ) {
        return false;
      }
      return true;
    });
  }, [tasks, projects, activeGoalId, activeTag, hasFilter]);

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
    for (const t of visibleTasks) map[t.status].push(t);
    for (const status of TASK_STATUS) {
      map[status].sort((a, b) => a.sortOrder - b.sortOrder);
    }
    return map;
  }, [visibleTasks]);

  const activeTask = activeId ? tasks.find((t) => t.id === activeId) : null;

  function findContainer(id: string): TaskStatus | undefined {
    if (TASK_STATUS.includes(id as TaskStatus)) return id as TaskStatus;
    return tasks.find((t) => t.id === id)?.status;
  }

  function onDragStart(e: DragStartEvent) {
    const id = String(e.active.id);
    setActiveId(id);
    dragSourceStatusRef.current = tasks.find((t) => t.id === id)?.status ?? null;
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

    // Compute the new ordering from the latest task snapshot (post-onDragOver
    // status update). Done OUTSIDE setTasks so we can safely call
    // startTransition afterwards — updater callbacks must stay pure.
    const inCol = tasks
      .filter((t) => t.status === overCol || t.id === activeId)
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
        : [
            ...inCol,
            tasks.find((t) => t.id === activeId)!,
          ].filter(Boolean);
    const orderedIds = reordered.map((t) => t.id);

    // Optimistic update — pure functional setter, no side effects inside.
    setTasks((prev) =>
      prev.map((t) => {
        const idx = reordered.findIndex((r) => r.id === t.id);
        if (idx === -1) return t;
        return { ...t, status: overCol, sortOrder: idx };
      }),
    );

    // Persist outside the updater.
    startTransition(async () => {
      try {
        await reorderColumnAction({ status: overCol, orderedIds });
      } catch (err) {
        toast.error("Failed to save");
        console.error(err);
      }
    });

    // If this drop is a transition INTO Done from another column, prompt for
    // the time spent. Skipping has no consequence — the move still completes.
    const cameFromDone = dragSourceStatusRef.current === "done";
    dragSourceStatusRef.current = null;
    if (overCol === "done" && !cameFromDone) {
      const movedTask = tasks.find((t) => t.id === activeId);
      window.dispatchEvent(
        new CustomEvent("jarvis:task-completed", {
          detail: {
            taskId: activeId,
            taskTitle: movedTask?.title,
            initialMinutes: movedTask?.timeSpentMinutes ?? null,
          },
        }),
      );
    }
  }

  const high = visibleTasks.filter((t) => t.priority === "high" && t.status !== "done").length;
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

      <div className="flex items-center justify-between mb-5">
        <h2 className="font-display text-[44px] font-black leading-none tracking-[-0.03em] text-[var(--color-ink)]">
          This week's{" "}
          <span className="italic font-bold text-[var(--color-clay-deep)]">
            board.
          </span>
          <small className="block font-sans text-sm font-semibold text-[var(--color-ink-mid)] mt-2 tracking-normal">
            {visibleTasks.length} task{visibleTasks.length === 1 ? "" : "s"}
            {hasFilter && " visible"} · {high} high priority · {blocked} blocked
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

      {hasFilter && (
        <div className="flex items-center gap-2 flex-wrap mb-4">
          <span className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-[var(--color-ink-dim)]">
            Filtered by
          </span>
          {activeGoal && (
            <FilterPill label={activeGoal.title} tone="goal" onClear={clearGoal} />
          )}
          {activeTag && (
            <FilterPill label={`#${activeTag}`} tone="tag" onClear={clearTag} />
          )}
          <button
            onClick={clearFilters}
            className="text-[12px] text-[var(--color-ink-mid)] hover:text-[var(--color-ink)] font-bold underline-offset-4 hover:underline ml-1"
          >
            Clear all
          </button>
        </div>
      )}

      <DndContext
        id="jarvis-board"
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
              onOpenCalendar={col.id === "done" ? () => setCalendarOpen(true) : undefined}
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

      <CompletedCalendar
        open={calendarOpen}
        onClose={() => setCalendarOpen(false)}
        tasks={tasks}
        projects={projects}
        goals={goals}
        onOpenTask={(id) => {
          setCalendarOpen(false);
          setOpenTaskId(id);
        }}
      />
    </>
  );
}

function FilterPill({
  label,
  tone,
  onClear,
}: {
  label: string;
  tone: "tag" | "goal";
  onClear: () => void;
}) {
  const styles =
    tone === "tag"
      ? {
          background:
            "linear-gradient(160deg, var(--color-clay-mint), var(--color-clay-aqua))",
          color: "#0e4a3e",
          boxShadow:
            "0 6px 12px -3px rgba(85,200,180,0.5), inset 0 2px 0 rgba(255,255,255,0.4)",
        }
      : {
          background:
            "linear-gradient(160deg, var(--color-clay-sky), var(--color-clay-deep))",
          color: "white",
          boxShadow:
            "0 6px 12px -3px rgba(85,145,235,0.5), inset 0 2px 0 rgba(255,255,255,0.35)",
        };
  return (
    <span
      className="inline-flex items-center gap-1.5 pl-3 pr-1 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-[0.04em]"
      style={styles}
    >
      {label}
      <button
        type="button"
        onClick={onClear}
        aria-label="Clear filter"
        className="w-4 h-4 rounded-full grid place-items-center bg-white/30 hover:bg-white/60 transition-colors"
      >
        <X size={10} strokeWidth={3} />
      </button>
    </span>
  );
}

function Column({
  status,
  label,
  tasks,
  goals,
  projects,
  onOpen,
  onOpenCalendar,
}: {
  status: TaskStatus;
  label: string;
  tasks: Task[];
  goals: Goal[];
  projects: Project[];
  onOpen: (id: string) => void;
  onOpenCalendar?: () => void;
}) {
  return (
    <div className="flex flex-col min-h-0" data-col={status}>
      <ColumnHeader
        status={status}
        label={label}
        count={tasks.length}
        onOpenCalendar={onOpenCalendar}
      />
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
  onOpenCalendar,
}: {
  status: TaskStatus;
  label: string;
  count: number;
  onOpenCalendar?: () => void;
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
      className="px-4 py-3.5 rounded-[20px] mb-3.5 flex items-center justify-between gap-2"
      style={{
        ...styles[status],
        boxShadow:
          "0 8px 16px -4px rgba(45, 75, 156, 0.15), inset 0 3px 0 rgba(255,255,255,0.5), inset 0 -2px 6px rgba(0,0,0,0.06)",
      }}
    >
      <div className="font-display text-[18px] font-extrabold tracking-[-0.015em]">
        {label}
      </div>
      <div className="flex items-center gap-2">
        {onOpenCalendar && (
          <button
            type="button"
            onClick={onOpenCalendar}
            aria-label="Show completed tasks calendar"
            title="Click to show tasks completed calendar"
            className="w-7 h-7 rounded-[10px] grid place-items-center transition-transform hover:-translate-y-px active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            style={{
              background: "rgba(255,255,255,0.5)",
              boxShadow:
                "0 4px 8px -2px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.5)",
              color: "inherit",
            }}
          >
            <CalendarRange size={14} strokeWidth={2.6} />
          </button>
        )}
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
    </div>
  );
}
