"use client";
import { useMemo } from "react";
import {
  format,
  isPast,
  isToday,
  isTomorrow,
  parseISO,
  startOfDay,
} from "date-fns";
import { CalendarOff } from "lucide-react";
import type { Goal, Project, Task } from "@/db/schema";
import { StaticTaskCard } from "./task-card";

const COLUMN_WIDTH = 260; // px
const COLUMN_GAP = 14;

const PRIORITY_RANK: Record<Task["priority"], number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

type Tone = "overdue" | "today" | "tomorrow" | "date" | "none";

type DueColumn = {
  key: string;
  label: string;
  sub: string;
  tone: Tone;
  tasks: Task[];
};

const TONE_STYLE: Record<Tone, React.CSSProperties> = {
  overdue: {
    background: "linear-gradient(160deg, #ff5a5f, #c81e2b)",
    color: "white",
    boxShadow:
      "0 8px 16px -4px rgba(200,30,43,0.3), inset 0 3px 0 rgba(255,255,255,0.35), inset 0 -2px 6px rgba(0,0,0,0.1)",
  },
  today: {
    background: "linear-gradient(160deg, var(--color-clay-butter), #f5b834)",
    color: "#6b4a00",
    boxShadow:
      "0 8px 16px -4px rgba(212,162,19,0.25), inset 0 3px 0 rgba(255,255,255,0.5), inset 0 -2px 6px rgba(0,0,0,0.06)",
  },
  tomorrow: {
    background: "linear-gradient(160deg, var(--color-clay-sky), var(--color-clay-deep))",
    color: "white",
    boxShadow:
      "0 8px 16px -4px rgba(85,145,235,0.3), inset 0 3px 0 rgba(255,255,255,0.4), inset 0 -2px 6px rgba(0,0,0,0.08)",
  },
  date: {
    background: "linear-gradient(160deg, #f0f6ff, #dceaf8)",
    color: "var(--color-ink)",
    boxShadow:
      "0 8px 16px -4px rgba(45,75,156,0.15), inset 0 3px 0 rgba(255,255,255,0.5), inset 0 -2px 6px rgba(0,0,0,0.06)",
  },
  none: {
    background: "linear-gradient(160deg, #eef0f6, #dfe3ee)",
    color: "var(--color-ink-mid)",
    boxShadow:
      "0 8px 16px -4px rgba(45,75,156,0.1), inset 0 3px 0 rgba(255,255,255,0.5)",
  },
};

/**
 * Alternative board layout that groups tasks by due date instead of status.
 * Columns appear only when they contain tasks, in this order:
 *   Overdue → Today → Tomorrow → each future due-date (chronological) → No date.
 * Completed tasks are excluded — this view is about what's still due.
 */
export function DueDateBoard({
  tasks,
  projects,
  goals,
  onOpen,
}: {
  tasks: Task[];
  projects: Project[];
  goals: Goal[];
  onOpen: (id: string) => void;
}) {
  const columns = useMemo<DueColumn[]>(() => {
    const overdue: Task[] = [];
    const today: Task[] = [];
    const tomorrow: Task[] = [];
    const noDate: Task[] = [];
    // Future tasks grouped by calendar-day key (yyyy-MM-dd).
    const future = new Map<string, Task[]>();

    for (const t of tasks) {
      if (t.status === "done") continue;
      if (!t.dueDate) {
        noDate.push(t);
        continue;
      }
      const d = parseISO(t.dueDate);
      if (isToday(d)) today.push(t);
      else if (isPast(d)) overdue.push(t);
      else if (isTomorrow(d)) tomorrow.push(t);
      else {
        const key = format(startOfDay(d), "yyyy-MM-dd");
        const arr = future.get(key) ?? [];
        arr.push(t);
        future.set(key, arr);
      }
    }

    // Within a day, surface higher priority first, then earlier-created order.
    const byPriority = (a: Task, b: Task) =>
      PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] ||
      a.sortOrder - b.sortOrder;
    // Overdue: most overdue (oldest due date) first.
    const byDueAsc = (a: Task, b: Task) =>
      (a.dueDate ?? "").localeCompare(b.dueDate ?? "") || byPriority(a, b);

    const out: DueColumn[] = [];

    if (overdue.length) {
      out.push({
        key: "overdue",
        label: "Overdue",
        sub: `${overdue.length} task${overdue.length === 1 ? "" : "s"}`,
        tone: "overdue",
        tasks: overdue.sort(byDueAsc),
      });
    }
    if (today.length) {
      out.push({
        key: "today",
        label: "Today",
        sub: format(new Date(), "MMM d"),
        tone: "today",
        tasks: today.sort(byPriority),
      });
    }
    if (tomorrow.length) {
      out.push({
        key: "tomorrow",
        label: "Tomorrow",
        sub: tomorrow[0] ? format(parseISO(tomorrow[0].dueDate!), "MMM d") : "",
        tone: "tomorrow",
        tasks: tomorrow.sort(byPriority),
      });
    }
    for (const key of [...future.keys()].sort()) {
      const d = parseISO(key);
      out.push({
        key,
        label: format(d, "EEE"),
        sub: format(d, "MMM d"),
        tone: "date",
        tasks: (future.get(key) ?? []).sort(byPriority),
      });
    }
    if (noDate.length) {
      out.push({
        key: "none",
        label: "No date",
        sub: `${noDate.length} task${noDate.length === 1 ? "" : "s"}`,
        tone: "none",
        tasks: noDate.sort(byPriority),
      });
    }
    return out;
  }, [tasks]);

  if (columns.length === 0) {
    return (
      <div className="flex-1 grid place-items-center text-center min-h-0">
        <div>
          <div
            className="w-20 h-20 rounded-[26px] grid place-items-center mb-5 mx-auto text-white"
            style={{
              background:
                "linear-gradient(160deg, var(--color-clay-sky), var(--color-clay-deep))",
              boxShadow:
                "0 12px 24px -6px rgba(85,145,235,0.5), inset 0 4px 0 rgba(255,255,255,0.4)",
            }}
          >
            <CalendarOff size={34} strokeWidth={2.2} />
          </div>
          <h3 className="font-display text-2xl font-black mb-2">Nothing scheduled</h3>
          <p className="text-[var(--color-ink-mid)] text-sm font-semibold max-w-xs mx-auto">
            No open tasks to show. Give your tasks due dates and they'll line up
            here by deadline.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 overflow-x-auto overflow-y-hidden pb-1">
      <div className="flex h-full" style={{ gap: `${COLUMN_GAP}px` }}>
        {columns.map((col) => (
          <DueColumnView
            key={col.key}
            column={col}
            projects={projects}
            goals={goals}
            onOpen={onOpen}
          />
        ))}
      </div>
    </div>
  );
}

function DueColumnView({
  column,
  projects,
  goals,
  onOpen,
}: {
  column: DueColumn;
  projects: Project[];
  goals: Goal[];
  onOpen: (id: string) => void;
}) {
  return (
    <div
      className="flex flex-col h-full shrink-0"
      style={{ width: `${COLUMN_WIDTH}px` }}
    >
      <div
        className="px-4 py-3 rounded-[20px] mb-3.5 flex items-center justify-between"
        style={TONE_STYLE[column.tone]}
      >
        <div className="min-w-0">
          <div className="font-display text-[17px] font-extrabold tracking-[-0.015em] leading-none truncate">
            {column.label}
          </div>
          <div className="text-[10.5px] font-bold opacity-80 mt-1 truncate">
            {column.sub}
          </div>
        </div>
        <span
          className="text-[12px] font-extrabold px-2.5 py-0.5 rounded-full tabular-nums flex-shrink-0"
          style={{
            background: "rgba(255,255,255,0.55)",
            boxShadow: "inset 0 2px 4px rgba(0,0,0,0.08)",
            color: "inherit",
          }}
        >
          {column.tasks.length}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto flex flex-col gap-3 pr-1 pb-2">
        {column.tasks.map((t) => (
          <StaticTaskCard
            key={t.id}
            task={t}
            projects={projects}
            goals={goals}
            onClick={() => onOpen(t.id)}
          />
        ))}
      </div>
    </div>
  );
}
