"use client";
import { useEffect, useMemo, useState } from "react";
import {
  differenceInCalendarDays,
  format,
  isPast,
  isToday,
  parseISO,
} from "date-fns";
import { AlertTriangle, X } from "lucide-react";
import type { Goal, Project, Task } from "@/db/schema";
import { pickVariant } from "@/components/sidebar";

const DISMISS_KEY = "jarvis:critical-alert-dismissed";

type CriticalTask = {
  task: Task;
  /** Negative = overdue by N days, 0 = due today. */
  daysUntilDue: number;
};

/**
 * Surfaces critical-priority tasks whose deadline has arrived or passed.
 * For a critical task the due date is a hard, business-critical deadline — so
 * an overdue or due-today critical task warrants an interrupt, not a quiet badge.
 *
 * Shows once per unique set of at-risk tasks per day: dismissing it records a
 * signature (today + the task ids), and it only re-appears if that set changes
 * (e.g. a new critical task slips past its deadline) or the day rolls over.
 */
export function CriticalTasksAlert({
  tasks,
  projects,
  goals,
  onOpenTask,
}: {
  tasks: Task[];
  projects: Project[];
  goals: Goal[];
  onOpenTask: (id: string) => void;
}) {
  const atRisk = useMemo<CriticalTask[]>(() => {
    const out: CriticalTask[] = [];
    for (const task of tasks) {
      if (task.priority !== "critical") continue;
      if (task.status === "done") continue;
      if (!task.dueDate) continue;
      const due = parseISO(task.dueDate);
      const overdue = isPast(due) && !isToday(due);
      if (!overdue && !isToday(due)) continue;
      out.push({ task, daysUntilDue: differenceInCalendarDays(due, new Date()) });
    }
    // Most overdue first, then due-today.
    return out.sort((a, b) => a.daysUntilDue - b.daysUntilDue);
  }, [tasks]);

  // Signature of the current at-risk set, scoped to today. Changes when the day
  // rolls over or the set of at-risk task ids changes.
  const signature = useMemo(() => {
    if (atRisk.length === 0) return "";
    const ids = atRisk.map((c) => c.task.id).sort();
    return `${format(new Date(), "yyyy-MM-dd")}|${ids.join(",")}`;
  }, [atRisk]);

  const [open, setOpen] = useState(false);

  // Decide visibility once the relevant set is known, comparing against the
  // last-dismissed signature in localStorage.
  useEffect(() => {
    if (!signature) {
      setOpen(false);
      return;
    }
    let dismissed: string | null = null;
    try {
      dismissed = window.localStorage.getItem(DISMISS_KEY);
    } catch {
      // localStorage unavailable (private mode etc.) — fail open and just show it.
    }
    setOpen(dismissed !== signature);
  }, [signature]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function dismiss() {
    try {
      if (signature) window.localStorage.setItem(DISMISS_KEY, signature);
    } catch {
      // ignore — dismissal just won't persist
    }
    setOpen(false);
  }

  if (!open || atRisk.length === 0) return null;

  const overdueCount = atRisk.filter((c) => c.daysUntilDue < 0).length;
  const todayCount = atRisk.length - overdueCount;

  return (
    <>
      <div
        onClick={dismiss}
        className="fixed inset-0 z-40 bg-[rgba(30,55,110,0.45)] backdrop-blur-sm"
      />
      <div
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[min(540px,calc(100vw-3.5rem))] max-h-[calc(100vh-3.5rem)] flex flex-col p-7 rounded-[32px] bg-white overflow-hidden"
        style={{
          boxShadow:
            "0 30px 60px -15px rgba(200,30,43,0.35), inset 0 3px 0 rgba(255,255,255,0.8)",
        }}
        role="alertdialog"
        aria-label="Critical tasks need attention"
      >
        <header className="flex items-start justify-between gap-4 mb-5">
          <div className="flex items-start gap-3.5">
            <span
              className="w-12 h-12 rounded-[16px] grid place-items-center text-white flex-shrink-0"
              style={{
                background: "linear-gradient(160deg, #ff5a5f, #c81e2b)",
                boxShadow:
                  "0 8px 16px -4px rgba(200,30,43,0.55), inset 0 2px 0 rgba(255,255,255,0.35)",
              }}
            >
              <AlertTriangle size={24} strokeWidth={2.6} />
            </span>
            <div>
              <div className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#c81e2b] mb-1">
                Critical deadlines
              </div>
              <h3 className="font-display text-[26px] font-black tracking-[-0.025em] leading-[1.1] text-[var(--color-ink)]">
                {atRisk.length} critical task{atRisk.length === 1 ? "" : "s"}{" "}
                <span className="italic font-bold text-[#c81e2b]">
                  need{atRisk.length === 1 ? "s" : ""} you.
                </span>
              </h3>
              <p className="text-[13px] text-[var(--color-ink-mid)] font-semibold mt-1.5">
                {overdueCount > 0 && (
                  <>
                    {overdueCount} overdue
                    {todayCount > 0 && " · "}
                  </>
                )}
                {todayCount > 0 && <>{todayCount} due today</>}. These have hard,
                business-critical deadlines.
              </p>
            </div>
          </div>
          <button
            onClick={dismiss}
            aria-label="Dismiss"
            className="w-9 h-9 rounded-[12px] bg-[var(--color-bg)] grid place-items-center text-[var(--color-ink-mid)] hover:text-[var(--color-ink)] transition-colors flex-shrink-0"
            title="Dismiss (Esc)"
          >
            <X size={17} />
          </button>
        </header>

        <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-2.5 pr-1">
          {atRisk.map((c) => (
            <CriticalRow
              key={c.task.id}
              entry={c}
              projects={projects}
              goals={goals}
              onClick={() => {
                dismiss();
                onOpenTask(c.task.id);
              }}
            />
          ))}
        </div>

        <div className="flex justify-end mt-5">
          <button
            onClick={dismiss}
            className="px-5 py-2.5 rounded-[16px] font-display font-extrabold text-[14px] text-[var(--color-ink)] bg-[var(--color-bg)] hover:-translate-y-0.5 transition-transform"
            style={{
              boxShadow:
                "0 6px 12px -3px rgba(45,75,156,0.18), inset 0 2px 0 rgba(255,255,255,0.7)",
            }}
          >
            Got it
          </button>
        </div>
      </div>
    </>
  );
}

function CriticalRow({
  entry,
  projects,
  goals,
  onClick,
}: {
  entry: CriticalTask;
  projects: Project[];
  goals: Goal[];
  onClick: () => void;
}) {
  const { task, daysUntilDue } = entry;
  const project = projects.find((p) => p.id === task.projectId);
  const goal = project?.goalId
    ? goals.find((g) => g.id === project.goalId)
    : undefined;
  const variant = pickVariant(goal?.color ?? "#6ba6f5");

  const due = parseISO(task.dueDate!);
  const overdueBy = -daysUntilDue;
  const dueLabel =
    daysUntilDue === 0
      ? "Due today"
      : overdueBy === 1
        ? "1 day overdue"
        : `${overdueBy} days overdue`;

  return (
    <button
      type="button"
      onClick={onClick}
      className="clay-card text-left w-full px-3.5 py-3 flex items-center justify-between gap-3 transition-transform hover:-translate-y-0.5"
    >
      <div className="min-w-0">
        {(goal || project?.title) && (
          <span
            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9.5px] font-extrabold uppercase tracking-[0.04em] mb-1.5 max-w-full truncate"
            style={{ ...variant.surface, color: variant.text }}
          >
            <span className="w-1 h-1 rounded-full bg-white/95 flex-shrink-0" />
            <span className="truncate">{goal?.title ?? project?.title}</span>
          </span>
        )}
        <h4 className="font-display text-[15px] font-bold leading-[1.25] tracking-[-0.015em] text-[var(--color-ink)] truncate">
          {task.title}
        </h4>
      </div>
      <span
        className="inline-flex items-center px-3 py-1 rounded-[10px] text-white text-[11.5px] font-extrabold whitespace-nowrap flex-shrink-0"
        style={{
          background:
            daysUntilDue === 0
              ? "linear-gradient(160deg, var(--color-clay-butter), #f5b834)"
              : "linear-gradient(160deg, #ff5a5f, #c81e2b)",
          color: daysUntilDue === 0 ? "#6b4a00" : "white",
          boxShadow:
            daysUntilDue === 0
              ? "0 4px 8px -2px rgba(212,162,19,0.4), inset 0 2px 0 rgba(255,255,255,0.4)"
              : "0 4px 8px -2px rgba(200,30,43,0.5), inset 0 2px 0 rgba(255,255,255,0.3)",
        }}
        title={format(due, "MMM d, yyyy")}
      >
        {dueLabel}
      </span>
    </button>
  );
}
