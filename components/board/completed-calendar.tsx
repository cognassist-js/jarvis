"use client";
import { useEffect, useMemo, useRef } from "react";
import { format, isToday, isYesterday, parseISO, startOfDay } from "date-fns";
import { X, ChevronLeft, ChevronRight, Inbox } from "lucide-react";
import type { Goal, Project, Task } from "@/db/schema";
import { pickVariant } from "@/components/sidebar";

const DAY_WIDTH = 220; // px — single source of truth for column + scroll math
const DAY_GAP = 14;

export function CompletedCalendar({
  open,
  onClose,
  tasks,
  projects,
  goals,
  onOpenTask,
}: {
  open: boolean;
  onClose: () => void;
  tasks: Task[];
  projects: Project[];
  goals: Goal[];
  onOpenTask: (id: string) => void;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  // Group completed tasks by the day they were completed.
  const days = useMemo(() => {
    const map = new Map<string, Task[]>();
    let earliestMs = startOfDay(new Date()).getTime();
    for (const t of tasks) {
      if (t.status !== "done" || !t.completedAt) continue;
      const d = parseISO(t.completedAt);
      const dayMs = startOfDay(d).getTime();
      if (dayMs < earliestMs) earliestMs = dayMs;
      const key = format(d, "yyyy-MM-dd");
      const arr = map.get(key) ?? [];
      arr.push(t);
      map.set(key, arr);
    }

    // Build every day from today back to earliest (so empty days still show).
    const out: { key: string; date: Date; tasks: Task[] }[] = [];
    const todayMs = startOfDay(new Date()).getTime();
    const oneDay = 86_400_000;
    for (let ms = todayMs; ms >= earliestMs; ms -= oneDay) {
      const date = new Date(ms);
      const key = format(date, "yyyy-MM-dd");
      const t = (map.get(key) ?? []).slice().sort((a, b) => {
        // most-recently-completed first within a day
        return (b.completedAt ?? "").localeCompare(a.completedAt ?? "");
      });
      out.push({ key, date, tasks: t });
    }
    return out;
  }, [tasks]);

  const totalCompleted = useMemo(
    () => days.reduce((s, d) => s + d.tasks.length, 0),
    [days],
  );

  // Scroll to the most recent day (rightmost in chronological view) on open.
  // Layout is reversed visually so the latest day sits on the LEFT, oldest scrolls right.
  useEffect(() => {
    if (!open) return;
    const el = scrollerRef.current;
    if (el) el.scrollLeft = 0;
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  function scrollBy(dir: -1 | 1) {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * (DAY_WIDTH + DAY_GAP) * 3, behavior: "smooth" });
  }

  return (
    <>
      <div
        onClick={onClose}
        className="fixed inset-0 z-40 bg-[rgba(30,55,110,0.45)] backdrop-blur-sm"
      />
      <div
        className="fixed inset-7 z-50 flex flex-col p-7 rounded-[36px] bg-white overflow-hidden"
        style={{
          boxShadow:
            "0 30px 60px -15px rgba(45,75,156,0.35), inset 0 3px 0 rgba(255,255,255,0.8)",
        }}
        role="dialog"
        aria-label="Completed tasks calendar"
      >
        <header className="flex items-start justify-between mb-6">
          <div>
            <div className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-[var(--color-ink-dim)] mb-1.5">
              Achievements
            </div>
            <h3 className="font-display text-[34px] font-black tracking-[-0.025em] leading-[1.05] text-[var(--color-ink)]">
              What you've{" "}
              <span className="italic font-bold text-[var(--color-clay-deep)]">
                finished.
              </span>
            </h3>
            <p className="text-[13px] text-[var(--color-ink-mid)] font-semibold mt-2">
              {totalCompleted} task{totalCompleted === 1 ? "" : "s"} completed across{" "}
              {days.length} day{days.length === 1 ? "" : "s"}. Scroll right to look further back.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => scrollBy(-1)}
              aria-label="Scroll to more recent days"
              className="w-10 h-10 rounded-[14px] bg-white grid place-items-center text-[var(--color-ink-mid)] hover:-translate-y-0.5 transition-transform"
              style={{
                boxShadow:
                  "0 6px 12px -3px rgba(45,75,156,0.18), inset 0 2px 0 rgba(255,255,255,0.7)",
              }}
            >
              <ChevronLeft size={18} strokeWidth={2.6} />
            </button>
            <button
              onClick={() => scrollBy(1)}
              aria-label="Scroll to older days"
              className="w-10 h-10 rounded-[14px] bg-white grid place-items-center text-[var(--color-ink-mid)] hover:-translate-y-0.5 transition-transform"
              style={{
                boxShadow:
                  "0 6px 12px -3px rgba(45,75,156,0.18), inset 0 2px 0 rgba(255,255,255,0.7)",
              }}
            >
              <ChevronRight size={18} strokeWidth={2.6} />
            </button>
            <button
              onClick={onClose}
              aria-label="Close"
              className="w-10 h-10 rounded-[14px] bg-[var(--color-bg)] grid place-items-center text-[var(--color-ink-mid)] hover:text-[var(--color-ink)] transition-colors"
              title="Close (Esc)"
            >
              <X size={18} />
            </button>
          </div>
        </header>

        {totalCompleted === 0 ? (
          <EmptyState />
        ) : (
          <div
            ref={scrollerRef}
            className="flex-1 min-h-0 overflow-x-auto overflow-y-hidden"
            style={{ scrollSnapType: "x mandatory" }}
          >
            <div
              className="flex h-full"
              style={{ gap: `${DAY_GAP}px`, paddingBottom: 6 }}
            >
              {days.map((d) => (
                <DayColumn
                  key={d.key}
                  date={d.date}
                  tasks={d.tasks}
                  projects={projects}
                  goals={goals}
                  onOpenTask={onOpenTask}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function DayColumn({
  date,
  tasks,
  projects,
  goals,
  onOpenTask,
}: {
  date: Date;
  tasks: Task[];
  projects: Project[];
  goals: Goal[];
  onOpenTask: (id: string) => void;
}) {
  const today = isToday(date);
  const yesterday = isYesterday(date);
  const headerLabel = today
    ? "Today"
    : yesterday
      ? "Yesterday"
      : format(date, "EEE");
  const dateLabel = format(date, "MMM d");

  return (
    <div
      className="flex flex-col h-full shrink-0"
      style={{
        width: `${DAY_WIDTH}px`,
        scrollSnapAlign: "start",
      }}
    >
      <div
        className="px-3.5 py-3 rounded-[18px] mb-3 flex items-center justify-between"
        style={{
          background: today
            ? "linear-gradient(160deg, var(--color-clay-mint), var(--color-clay-aqua))"
            : yesterday
              ? "linear-gradient(160deg, var(--color-clay-sky), var(--color-clay-deep))"
              : "linear-gradient(160deg, #f0f6ff, #dceaf8)",
          color: today ? "#0e4a3e" : yesterday ? "white" : "var(--color-ink)",
          boxShadow:
            "0 8px 16px -4px rgba(45,75,156,0.15), inset 0 3px 0 rgba(255,255,255,0.5), inset 0 -2px 6px rgba(0,0,0,0.06)",
        }}
      >
        <div>
          <div className="font-display text-[16px] font-extrabold tracking-[-0.015em] leading-none">
            {headerLabel}
          </div>
          <div className="text-[10.5px] font-bold opacity-80 mt-0.5">
            {dateLabel}
          </div>
        </div>
        <span
          className="text-[12px] font-extrabold px-2.5 py-0.5 rounded-full tabular-nums"
          style={{
            background: "rgba(255,255,255,0.55)",
            boxShadow: "inset 0 2px 4px rgba(0,0,0,0.08)",
            color: "inherit",
          }}
        >
          {tasks.length}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto flex flex-col gap-2.5 pr-1 pb-2">
        {tasks.length === 0 ? (
          <div className="text-[11.5px] text-[var(--color-ink-faint)] font-semibold italic px-2 py-3">
            Nothing finished
          </div>
        ) : (
          tasks.map((t) => (
            <CompletedTaskCard
              key={t.id}
              task={t}
              projects={projects}
              goals={goals}
              onClick={() => onOpenTask(t.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

function CompletedTaskCard({
  task,
  projects,
  goals,
  onClick,
}: {
  task: Task;
  projects: Project[];
  goals: Goal[];
  onClick: () => void;
}) {
  const project = projects.find((p) => p.id === task.projectId);
  const goal = project?.goalId
    ? goals.find((g) => g.id === project.goalId)
    : undefined;
  const variant = pickVariant(goal?.color ?? "#6ba6f5");
  return (
    <button
      type="button"
      onClick={onClick}
      className="clay-card text-left w-full px-3 py-2.5 transition-transform hover:-translate-y-0.5"
    >
      {(goal || project?.title) && (
        <span
          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9.5px] font-extrabold uppercase tracking-[0.04em] mb-1.5 max-w-full truncate"
          style={{
            ...variant.surface,
            color: variant.text,
          }}
        >
          <span className="w-1 h-1 rounded-full bg-white/95 flex-shrink-0" />
          <span className="truncate">{goal?.title ?? project?.title}</span>
        </span>
      )}
      <h4 className="font-display text-[14px] font-bold leading-[1.25] tracking-[-0.015em] text-[var(--color-ink)] line-through decoration-1 decoration-[var(--color-ink-dim)]">
        {task.title}
      </h4>
      {task.completedAt && (
        <div className="text-[10px] text-[var(--color-ink-dim)] font-semibold mt-1 tabular-nums">
          ✓ {format(parseISO(task.completedAt), "h:mm a")}
        </div>
      )}
    </button>
  );
}

function EmptyState() {
  return (
    <div className="flex-1 grid place-items-center text-center">
      <div>
        <div
          className="w-20 h-20 rounded-[26px] grid place-items-center mb-5 mx-auto text-white"
          style={{
            background:
              "linear-gradient(160deg, var(--color-clay-lilac), var(--color-clay-lavender))",
            boxShadow:
              "0 12px 24px -6px rgba(160,130,220,0.5), inset 0 4px 0 rgba(255,255,255,0.5)",
          }}
        >
          <Inbox size={36} strokeWidth={2.2} />
        </div>
        <h3 className="font-display text-2xl font-black mb-2">Nothing done yet</h3>
        <p className="text-[var(--color-ink-mid)] text-sm font-semibold max-w-xs mx-auto">
          As you mark tasks as Done, they'll show up here grouped by the day you
          finished them.
        </p>
      </div>
    </div>
  );
}
