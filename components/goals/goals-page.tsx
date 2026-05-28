"use client";
import { useEffect, useState } from "react";
import { Plus, Target, Pencil, Archive, Trash2, RotateCcw } from "lucide-react";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { pickVariant } from "@/components/sidebar";
import {
  createGoalAction,
  updateGoalAction,
  archiveGoalAction,
  deleteGoalAction,
} from "@/app/actions/goals";
import type { GoalWithStats } from "@/lib/services/goals";
import type { ProjectWithStats } from "@/lib/services/projects";

const SWATCHES = [
  { hex: "#6ba6f5", label: "Ocean" },
  { hex: "#6dd5c7", label: "Aqua" },
  { hex: "#a995ec", label: "Lilac" },
  { hex: "#f59a98", label: "Coral" },
];

export function GoalsPage({
  goals,
  projects,
}: {
  goals: GoalWithStats[];
  projects: ProjectWithStats[];
}) {
  const [dialogGoal, setDialogGoal] = useState<GoalWithStats | null>(null);
  const [creating, setCreating] = useState(false);

  return (
    <>
      <header className="flex items-center justify-between mb-7">
        <div>
          <h2 className="font-display text-[44px] font-black leading-none tracking-[-0.03em]">
            Your <span className="italic font-bold text-[var(--color-clay-deep)]">goals.</span>
          </h2>
          <p className="text-sm text-[var(--color-ink-mid)] font-semibold mt-2">
            {goals.length} goal{goals.length === 1 ? "" : "s"} ·{" "}
            {goals.reduce((s, g) => s + g.totalTasks, 0)} tasks across all goals
          </p>
        </div>
        <Button onClick={() => setCreating(true)}>
          <Plus size={16} strokeWidth={3} />
          New goal
        </Button>
      </header>

      {goals.length === 0 ? (
        <EmptyState onCreate={() => setCreating(true)} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {goals.map((g) => (
            <GoalCard
              key={g.id}
              goal={g}
              projects={projects.filter((p) => p.goalId === g.id)}
              onEdit={() => setDialogGoal(g)}
            />
          ))}
        </div>
      )}

      <GoalDialog
        open={creating}
        onOpenChange={setCreating}
      />
      <GoalDialog
        open={dialogGoal !== null}
        onOpenChange={(o) => !o && setDialogGoal(null)}
        goal={dialogGoal ?? undefined}
      />
    </>
  );
}

function GoalCard({
  goal,
  projects,
  onEdit,
}: {
  goal: GoalWithStats;
  projects: ProjectWithStats[];
  onEdit: () => void;
}) {
  const variant = pickVariant(goal.color);
  const archived = goal.status === "archived";
  return (
    <button
      id={goal.id}
      type="button"
      onClick={onEdit}
      aria-label={`Edit goal ${goal.title}`}
      className="group text-left relative overflow-hidden p-6 rounded-[28px] transition-all hover:-translate-y-[3px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-clay-deep)]"
      style={{
        ...variant.surface,
        color: variant.text,
        opacity: archived ? 0.6 : 1,
      }}
    >
      <div className="flex items-start justify-between mb-4 gap-3">
        <h3 className="font-display text-[26px] font-black tracking-[-0.02em] leading-[1.05] flex-1 min-w-0">
          {goal.title}
        </h3>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span
            className="font-sans text-[24px] font-extrabold text-[var(--color-ink)] tabular-nums px-3 py-1 rounded-[14px]"
            style={{
              background: "rgba(255,255,255,0.6)",
              boxShadow: "inset 0 2px 4px rgba(0,0,0,0.08)",
            }}
          >
            {goal.progress}%
          </span>
          <span
            className="w-9 h-9 rounded-[12px] grid place-items-center opacity-0 group-hover:opacity-100 transition-opacity"
            style={{
              background: "rgba(255,255,255,0.6)",
              boxShadow: "inset 0 2px 4px rgba(0,0,0,0.08)",
              color: "var(--color-ink)",
            }}
            aria-hidden
          >
            <Pencil size={14} strokeWidth={2.6} />
          </span>
        </div>
      </div>
      {archived && (
        <span className="inline-block text-[10px] font-extrabold uppercase tracking-[0.1em] px-2.5 py-0.5 rounded-full bg-white/40 text-[var(--color-ink)] mb-3">
          Archived
        </span>
      )}
      {goal.description && (
        <p className="text-[13px] mb-4 opacity-90 font-medium">
          {goal.description}
        </p>
      )}
      <div
        className="h-3 rounded-md overflow-hidden mb-4"
        style={{
          background: "rgba(255,255,255,0.45)",
          boxShadow: "inset 0 3px 6px rgba(0,0,0,0.12)",
        }}
      >
        <div
          className="h-full rounded-md"
          style={{
            width: `${goal.progress}%`,
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.7), transparent), rgba(255,255,255,0.85)",
          }}
        />
      </div>
      <div className="flex items-center gap-3 text-[12px] font-bold flex-wrap">
        <span
          className="px-2.5 py-1 rounded-full"
          style={{
            background: "rgba(255,255,255,0.35)",
            boxShadow: "inset 0 2px 4px rgba(0,0,0,0.08)",
          }}
        >
          {goal.projectCount} project{goal.projectCount === 1 ? "" : "s"}
        </span>
        <span
          className="px-2.5 py-1 rounded-full"
          style={{
            background: "rgba(255,255,255,0.35)",
            boxShadow: "inset 0 2px 4px rgba(0,0,0,0.08)",
          }}
        >
          {goal.doneTasks}/{goal.totalTasks} done
        </span>
        {goal.targetDate && (
          <span
            className="px-2.5 py-1 rounded-full"
            style={{
              background: "rgba(255,255,255,0.35)",
              boxShadow: "inset 0 2px 4px rgba(0,0,0,0.08)",
            }}
          >
            by {format(parseISO(goal.targetDate), "MMM d, yyyy")}
          </span>
        )}
      </div>
      {projects.length > 0 && (
        <ul className="mt-4 flex flex-col gap-1.5">
          {projects.slice(0, 4).map((p) => (
            <li
              key={p.id}
              className="text-[12.5px] font-semibold flex items-center justify-between px-3 py-1.5 rounded-[12px]"
              style={{
                background: "rgba(255,255,255,0.35)",
              }}
            >
              <span className="truncate pr-2">{p.title}</span>
              <span className="opacity-80 tabular-nums">{p.progress}%</span>
            </li>
          ))}
        </ul>
      )}
      <span
        className="absolute -bottom-7 -right-7 w-32 h-32 rounded-full pointer-events-none"
        style={{
          background: "rgba(255,255,255,0.18)",
          filter: "blur(12px)",
        }}
      />
    </button>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="clay-card p-12 grid place-items-center text-center">
      <div
        className="w-20 h-20 rounded-[26px] grid place-items-center mb-5"
        style={{
          background:
            "linear-gradient(160deg, var(--color-clay-mint), var(--color-clay-aqua))",
          boxShadow:
            "0 12px 24px -6px rgba(85, 200, 180, 0.5), inset 0 4px 0 rgba(255,255,255,0.5)",
        }}
      >
        <Target size={36} className="text-white" strokeWidth={2.2} />
      </div>
      <h3 className="font-display text-2xl font-black mb-2">No goals yet</h3>
      <p className="text-[var(--color-ink-mid)] text-sm font-semibold mb-5 max-w-xs">
        Goals are the big things you want to make happen. Projects hang off them, tasks hang off projects.
      </p>
      <Button onClick={onCreate}>
        <Plus size={16} strokeWidth={3} />
        Create your first goal
      </Button>
    </div>
  );
}

function GoalDialog({
  open,
  onOpenChange,
  goal,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  goal?: GoalWithStats;
}) {
  const editing = !!goal;
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(SWATCHES[0].hex);
  const [targetDate, setTargetDate] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Reset fields whenever the dialog opens or the goal changes
  useEffect(() => {
    if (!open) return;
    if (goal) {
      setTitle(goal.title);
      setDescription(goal.description ?? "");
      setColor(goal.color);
      setTargetDate(goal.targetDate ? goal.targetDate.slice(0, 10) : "");
    } else {
      setTitle("");
      setDescription("");
      setColor(SWATCHES[0].hex);
      setTargetDate("");
    }
  }, [open, goal]);

  async function submit() {
    if (!title.trim()) {
      toast.error("Give the goal a title");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || null,
        color,
        targetDate: targetDate ? new Date(targetDate).toISOString() : null,
      };
      if (editing && goal) {
        await updateGoalAction({ id: goal.id, ...payload });
        toast.success("Goal updated");
      } else {
        await createGoalAction(payload);
        toast.success("Goal created");
      }
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      toast.error(editing ? "Could not update goal" : "Could not create goal");
    } finally {
      setSubmitting(false);
    }
  }

  async function archive() {
    if (!goal) return;
    setSubmitting(true);
    try {
      await archiveGoalAction(goal.id);
      toast.success("Goal archived");
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      toast.error("Could not archive goal");
    } finally {
      setSubmitting(false);
    }
  }

  async function unarchive() {
    if (!goal) return;
    setSubmitting(true);
    try {
      await updateGoalAction({ id: goal.id, status: "active" });
      toast.success("Goal restored");
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      toast.error("Could not restore goal");
    } finally {
      setSubmitting(false);
    }
  }

  async function remove() {
    if (!goal) return;
    const projectsMsg =
      goal.projectCount > 0
        ? `\n\nThis goal has ${goal.projectCount} project${goal.projectCount === 1 ? "" : "s"} attached. Deleting the goal will leave those projects standalone (they won't be deleted).`
        : "";
    if (!confirm(`Delete "${goal.title}"?${projectsMsg}`)) return;
    setSubmitting(true);
    try {
      await deleteGoalAction(goal.id);
      toast.success("Goal deleted");
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      toast.error("Could not delete goal");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Edit goal" : "New goal"}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <Input
            autoFocus
            placeholder="e.g. Learn Spanish"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Textarea
            rows={3}
            placeholder="Why does this matter to you? (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <div className="grid grid-cols-[1fr_auto] gap-3 items-end">
            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-[var(--color-ink-dim)]">
                Target date
              </span>
              <Input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
              />
            </label>
            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-[var(--color-ink-dim)]">
                Color tag
              </span>
              <div className="flex gap-2">
                {SWATCHES.map((s) => (
                  <button
                    key={s.hex}
                    type="button"
                    onClick={() => setColor(s.hex)}
                    className="w-10 h-10 rounded-[12px] transition-transform hover:-translate-y-0.5"
                    style={{
                      background: s.hex,
                      boxShadow:
                        color === s.hex
                          ? `0 0 0 3px var(--color-clay-deep), 0 8px 16px -4px ${s.hex}, inset 0 3px 0 rgba(255,255,255,0.4)`
                          : `0 8px 16px -4px ${s.hex}, inset 0 3px 0 rgba(255,255,255,0.4)`,
                    }}
                    aria-label={s.label}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-3">
            {editing && (
              <>
                {goal?.status === "archived" ? (
                  <button
                    onClick={unarchive}
                    disabled={submitting}
                    className="inline-flex items-center gap-1.5 text-[var(--color-ink-mid)] hover:text-[var(--color-ink)] font-bold text-sm disabled:opacity-50"
                  >
                    <RotateCcw size={15} />
                    Restore
                  </button>
                ) : (
                  <button
                    onClick={archive}
                    disabled={submitting}
                    className="inline-flex items-center gap-1.5 text-[var(--color-ink-mid)] hover:text-[var(--color-ink)] font-bold text-sm disabled:opacity-50"
                  >
                    <Archive size={15} />
                    Archive
                  </button>
                )}
                <button
                  onClick={remove}
                  disabled={submitting}
                  className="inline-flex items-center gap-1.5 text-[var(--color-clay-coral-2)] font-bold text-sm disabled:opacity-50"
                >
                  <Trash2 size={15} />
                  Delete
                </button>
              </>
            )}
          </div>
          <div className="flex gap-2 ml-auto">
            <Button variant="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={submit} disabled={submitting}>
              {submitting
                ? editing
                  ? "Saving…"
                  : "Creating…"
                : editing
                  ? "Save"
                  : "Create goal"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
