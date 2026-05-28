"use client";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { format, isToday, isTomorrow, isPast, parseISO } from "date-fns";
import type { Goal, Project, Task } from "@/db/schema";
import { pickVariant } from "@/components/sidebar";
import { cn } from "@/lib/utils";

export function TaskCard({
  task,
  goals,
  projects,
  onClick,
  dragging,
}: {
  task: Task;
  goals: Goal[];
  projects: Project[];
  onClick?: () => void;
  dragging?: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const project = projects.find((p) => p.id === task.projectId);
  const goal = project?.goalId
    ? goals.find((g) => g.id === project.goalId)
    : undefined;
  const goalColor = goal?.color ?? "#6ba6f5";
  const variant = pickVariant(goalColor);

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const isBlocked = task.status === "blocked";
  const isDone = task.status === "done";

  return (
    <button
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={(e) => {
        if (isDragging) return;
        e.preventDefault();
        onClick?.();
      }}
      className={cn(
        "text-left px-4 py-3.5 rounded-[22px] cursor-grab active:cursor-grabbing transition-all w-full",
        "clay-card",
        "hover:-translate-y-[4px] hover:-rotate-[0.5deg]",
        dragging && "rotate-[2deg] shadow-2xl",
        isBlocked && "[box-shadow:0_10px_20px_-6px_rgba(239,116,114,0.3),inset_0_3px_0_rgba(255,255,255,0.9),inset_0_-3px_6px_rgba(239,116,114,0.1),0_0_0_2px_var(--color-clay-coral)]",
        isDone && "opacity-70",
      )}
    >
      <div className="flex justify-between items-center mb-2.5">
        <span
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-[0.04em] truncate max-w-[140px]"
          style={{
            ...variant.surface,
            color: variant.text,
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-white/95 flex-shrink-0" />
          <span className="truncate">{goal?.title ?? project?.title ?? "—"}</span>
        </span>
        <PriorityDot priority={task.priority} />
      </div>
      <h4
        className={cn(
          "font-display text-[17px] font-bold leading-[1.22] mb-3 text-[var(--color-ink)] tracking-[-0.015em]",
          isDone && "line-through decoration-2 text-[var(--color-ink-dim)]",
        )}
      >
        {task.title}
      </h4>
      <div className="flex items-center justify-between text-xs text-[var(--color-ink-mid)] font-bold">
        <DueDate task={task} />
      </div>
    </button>
  );
}

function PriorityDot({ priority }: { priority: Task["priority"] }) {
  const styles: Record<Task["priority"], React.CSSProperties> = {
    high: {
      background:
        "linear-gradient(160deg, var(--color-clay-coral), var(--color-clay-coral-2))",
      color: "white",
      boxShadow:
        "0 5px 10px -2px rgba(239,116,114,0.5), inset 0 2px 0 rgba(255,255,255,0.35), inset 0 -2px 4px rgba(0,0,0,0.15)",
    },
    medium: {
      background:
        "linear-gradient(160deg, var(--color-clay-butter), #f5b834)",
      color: "#6b4a00",
      boxShadow:
        "0 5px 10px -2px rgba(212,162,19,0.4), inset 0 2px 0 rgba(255,255,255,0.35), inset 0 -2px 4px rgba(0,0,0,0.15)",
    },
    low: {
      background: "linear-gradient(160deg, var(--color-bg), #ccd8ec)",
      color: "var(--color-ink-mid)",
      boxShadow:
        "0 4px 8px -2px rgba(45,75,156,0.2), inset 0 2px 0 rgba(255,255,255,0.7)",
    },
  };
  const chars = { high: "!", medium: "·", low: "–" };
  return (
    <span
      aria-label={`Priority: ${priority}`}
      title={`Priority: ${priority}`}
      className="w-[30px] h-[30px] rounded-full grid place-items-center font-display font-black text-[11px] flex-shrink-0"
      style={styles[priority]}
    >
      {chars[priority]}
    </span>
  );
}

function DueDate({ task }: { task: Task }) {
  if (!task.dueDate) {
    return (
      <span
        className="inline-flex items-center px-2.5 py-1 rounded-[10px] text-[var(--color-ink-mid)]"
        style={{
          background: "var(--color-bg)",
          boxShadow: "inset 0 2px 4px rgba(45, 75, 156, 0.1)",
        }}
      >
        no date
      </span>
    );
  }
  const d = parseISO(task.dueDate);
  if (task.status === "done") {
    return (
      <span
        className="inline-flex items-center px-2.5 py-1 rounded-[10px]"
        style={{
          background: "var(--color-bg)",
          boxShadow: "inset 0 2px 4px rgba(45, 75, 156, 0.1)",
        }}
      >
        {format(d, "MMM d")} ✓
      </span>
    );
  }
  const late = isPast(d) && !isToday(d);
  const soon = isToday(d) || isTomorrow(d);
  const label = isToday(d)
    ? "Today"
    : isTomorrow(d)
      ? "Tomorrow"
      : format(d, "MMM d");
  if (late) {
    return (
      <span
        className="inline-flex items-center px-2.5 py-1 rounded-[10px] text-white"
        style={{
          background:
            "linear-gradient(160deg, var(--color-clay-coral), var(--color-clay-coral-2))",
          boxShadow:
            "0 4px 8px -2px rgba(239,116,114,0.45), inset 0 2px 0 rgba(255,255,255,0.3)",
        }}
      >
        {label} · late
      </span>
    );
  }
  if (soon) {
    return (
      <span
        className="inline-flex items-center px-2.5 py-1 rounded-[10px]"
        style={{
          background:
            "linear-gradient(160deg, var(--color-clay-butter), #f5d342)",
          color: "#6b4a00",
          boxShadow:
            "0 4px 8px -2px rgba(212, 162, 19, 0.4), inset 0 2px 0 rgba(255,255,255,0.4)",
        }}
      >
        {label}
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center px-2.5 py-1 rounded-[10px]"
      style={{
        background: "var(--color-bg)",
        boxShadow: "inset 0 2px 4px rgba(45, 75, 156, 0.1)",
      }}
    >
      {label}
    </span>
  );
}
