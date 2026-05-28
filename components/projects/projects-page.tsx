"use client";
import { useEffect, useState } from "react";
import { Plus, Layers, Pencil, Trash2, ListPlus } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createProjectAction,
  updateProjectAction,
  deleteProjectAction,
} from "@/app/actions/projects";
import { pickVariant } from "@/components/sidebar";
import type { ProjectWithStats } from "@/lib/services/projects";
import type { Goal, ProjectStatus } from "@/db/schema";
import { PROJECT_STATUS } from "@/db/schema";

const STATUS_LABEL: Record<ProjectStatus, string> = {
  not_started: "Not started",
  active: "Active",
  on_hold: "On hold",
  completed: "Completed",
};

export function ProjectsPage({
  projects,
  goals,
}: {
  projects: ProjectWithStats[];
  goals: Goal[];
}) {
  const [creating, setCreating] = useState(false);
  const [dialogProject, setDialogProject] = useState<ProjectWithStats | null>(
    null,
  );

  return (
    <>
      <header className="flex items-center justify-between mb-7">
        <div>
          <h2 className="font-display text-[44px] font-black leading-none tracking-[-0.03em]">
            Your <span className="italic font-bold text-[var(--color-clay-deep)]">projects.</span>
          </h2>
          <p className="text-sm text-[var(--color-ink-mid)] font-semibold mt-2">
            {projects.length} project{projects.length === 1 ? "" : "s"}
          </p>
        </div>
        <Button onClick={() => setCreating(true)}>
          <Plus size={16} strokeWidth={3} />
          New project
        </Button>
      </header>

      {projects.length === 0 ? (
        <EmptyState onCreate={() => setCreating(true)} />
      ) : (
        <div className="flex flex-col gap-3">
          {projects.map((p) => (
            <ProjectRow
              key={p.id}
              project={p}
              goals={goals}
              onEdit={() => setDialogProject(p)}
            />
          ))}
        </div>
      )}

      <ProjectDialog
        open={creating}
        onOpenChange={setCreating}
        goals={goals}
      />
      <ProjectDialog
        open={dialogProject !== null}
        onOpenChange={(o) => !o && setDialogProject(null)}
        goals={goals}
        project={dialogProject ?? undefined}
      />
    </>
  );
}

function ProjectRow({
  project,
  goals,
  onEdit,
}: {
  project: ProjectWithStats;
  goals: Goal[];
  onEdit: () => void;
}) {
  const goal = project.goalId
    ? goals.find((g) => g.id === project.goalId)
    : undefined;
  const variant = goal ? pickVariant(goal.color) : null;
  const status = project.status;
  return (
    <button
      type="button"
      onClick={onEdit}
      aria-label={`Edit project ${project.title}`}
      className="group clay-card p-5 flex items-center gap-5 text-left w-full hover:-translate-y-[2px] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-clay-deep)]"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-1.5">
          {goal && variant && (
            <span
              className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-[0.04em]"
              style={{
                ...variant.surface,
                color: variant.text,
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-white/95" />
              {goal.title}
            </span>
          )}
          <StatusPill status={status} />
        </div>
        <h3 className="font-display text-[22px] font-bold leading-tight tracking-[-0.015em] truncate">
          {project.title}
        </h3>
        {project.description && (
          <p className="text-[13px] text-[var(--color-ink-mid)] font-medium mt-1 line-clamp-2">
            {project.description}
          </p>
        )}
      </div>
      <div className="text-right shrink-0">
        <div className="text-[28px] font-display font-black tabular-nums leading-none">
          {project.progress}%
        </div>
        <div className="text-[12px] text-[var(--color-ink-mid)] font-bold mt-1">
          {project.doneTasks}/{project.totalTasks} done
        </div>
        {project.dueDate && (
          <div className="text-[11px] text-[var(--color-ink-dim)] font-semibold mt-1">
            due {format(parseISO(project.dueDate), "MMM d")}
          </div>
        )}
      </div>
      <div
        className="w-32 h-2.5 rounded-md overflow-hidden flex-shrink-0"
        style={{
          background: "var(--color-bg-2)",
          boxShadow: "inset 0 2px 4px rgba(45, 75, 156, 0.1)",
        }}
      >
        <div
          className="h-full rounded-md"
          style={{
            width: `${project.progress}%`,
            background:
              "linear-gradient(160deg, var(--color-clay-sky), var(--color-clay-deep))",
          }}
        />
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <span
          role="button"
          tabIndex={0}
          aria-label={`Add task to ${project.title}`}
          title="Add task"
          onClick={(e) => {
            e.stopPropagation();
            window.dispatchEvent(
              new CustomEvent("jarvis:new-task", {
                detail: { projectId: project.id },
              }),
            );
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              e.stopPropagation();
              window.dispatchEvent(
                new CustomEvent("jarvis:new-task", {
                  detail: { projectId: project.id },
                }),
              );
            }
          }}
          className="w-9 h-9 rounded-[12px] grid place-items-center text-white cursor-pointer transition-transform hover:-translate-y-0.5 active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-clay-deep)]"
          style={{
            background:
              "linear-gradient(160deg, var(--color-clay-deep), var(--color-clay-deep-2))",
            boxShadow:
              "0 6px 12px -3px rgba(71,131,219,0.5), inset 0 2px 0 rgba(255,255,255,0.35), inset 0 -2px 4px rgba(0,0,0,0.08)",
          }}
        >
          <ListPlus size={15} strokeWidth={2.6} />
        </span>
        <span
          className="w-9 h-9 rounded-[12px] grid place-items-center clay-inset text-[var(--color-ink-mid)] opacity-0 group-hover:opacity-100 transition-opacity"
          aria-hidden
        >
          <Pencil size={14} strokeWidth={2.6} />
        </span>
      </div>
    </button>
  );
}

function StatusPill({ status }: { status: ProjectStatus }) {
  const map: Record<ProjectStatus, string> = {
    not_started: "var(--color-bg-2)",
    active: "linear-gradient(160deg, var(--color-clay-mint), var(--color-clay-aqua))",
    on_hold:
      "linear-gradient(160deg, var(--color-clay-butter), #f5b834)",
    completed:
      "linear-gradient(160deg, var(--color-clay-lilac), var(--color-clay-lavender))",
  };
  const textColor: Record<ProjectStatus, string> = {
    not_started: "var(--color-ink-mid)",
    active: "#0e4a3e",
    on_hold: "#6b4a00",
    completed: "white",
  };
  return (
    <span
      className="text-[10px] font-extrabold uppercase tracking-[0.06em] px-2.5 py-0.5 rounded-full"
      style={{
        background: map[status],
        color: textColor[status],
        boxShadow: "inset 0 2px 4px rgba(0,0,0,0.05)",
      }}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="clay-card p-12 grid place-items-center text-center">
      <div
        className="w-20 h-20 rounded-[26px] grid place-items-center mb-5 text-white"
        style={{
          background:
            "linear-gradient(160deg, var(--color-clay-sky), var(--color-clay-deep))",
          boxShadow:
            "0 12px 24px -6px rgba(85, 145, 235, 0.5), inset 0 4px 0 rgba(255,255,255,0.5)",
        }}
      >
        <Layers size={36} strokeWidth={2.2} />
      </div>
      <h3 className="font-display text-2xl font-black mb-2">No projects yet</h3>
      <p className="text-[var(--color-ink-mid)] text-sm font-semibold mb-5 max-w-xs">
        Projects bundle the tasks for a body of work. Attach them to a goal to track progress.
      </p>
      <Button onClick={onCreate}>
        <Plus size={16} strokeWidth={3} />
        Create your first project
      </Button>
    </div>
  );
}

function ProjectDialog({
  open,
  onOpenChange,
  goals,
  project,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  goals: Goal[];
  project?: ProjectWithStats;
}) {
  const editing = !!project;
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [goalId, setGoalId] = useState<string>("");
  const [status, setStatus] = useState<ProjectStatus>("active");
  const [dueDate, setDueDate] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (project) {
      setTitle(project.title);
      setDescription(project.description ?? "");
      setGoalId(project.goalId ?? "");
      setStatus(project.status);
      setDueDate(project.dueDate ? project.dueDate.slice(0, 10) : "");
    } else {
      setTitle("");
      setDescription("");
      setGoalId(goals[0]?.id ?? "");
      setStatus("active");
      setDueDate("");
    }
  }, [open, project, goals]);

  async function submit() {
    if (!title.trim()) {
      toast.error("Give the project a title");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || null,
        goalId: goalId || null,
        status,
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
      };
      if (editing && project) {
        await updateProjectAction({ id: project.id, ...payload });
        toast.success("Project updated");
      } else {
        await createProjectAction(payload);
        toast.success("Project created");
      }
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      toast.error(
        editing ? "Could not update project" : "Could not create project",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function remove() {
    if (!project) return;
    const tasksMsg =
      project.totalTasks > 0
        ? `\n\nThis project has ${project.totalTasks} task${project.totalTasks === 1 ? "" : "s"}. Deleting the project will delete every task on it.`
        : "";
    if (!confirm(`Delete "${project.title}"?${tasksMsg}`)) return;
    setSubmitting(true);
    try {
      await deleteProjectAction(project.id);
      toast.success("Project deleted");
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      toast.error("Could not delete project");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Edit project" : "New project"}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <Input
            autoFocus
            placeholder="What are you building?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Textarea
            rows={3}
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-[var(--color-ink-dim)]">
                Goal
              </span>
              <Select
                value={goalId || "__none__"}
                onValueChange={(v) => setGoalId(v === "__none__" ? "" : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Standalone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">— Standalone —</SelectItem>
                  {goals.map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-[var(--color-ink-dim)]">
                Status
              </span>
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as ProjectStatus)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROJECT_STATUS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {STATUS_LABEL[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>
            <label className="flex flex-col gap-1.5 col-span-2">
              <span className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-[var(--color-ink-dim)]">
                Due date
              </span>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </label>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between gap-2 flex-wrap">
          <div>
            {editing && (
              <button
                onClick={remove}
                disabled={submitting}
                className="inline-flex items-center gap-1.5 text-[var(--color-clay-coral-2)] font-bold text-sm disabled:opacity-50"
              >
                <Trash2 size={15} />
                Delete
              </button>
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
                  : "Create project"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
