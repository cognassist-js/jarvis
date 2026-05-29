"use client";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Trash2, X, Clock, Pencil } from "lucide-react";
import { toast } from "sonner";
import type { Goal, Project, Task, TaskPriority, TaskStatus } from "@/db/schema";
import { TASK_PRIORITY, TASK_STATUS } from "@/db/schema";
import { Input, Textarea } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  updateTaskAction,
  deleteTaskAction,
} from "@/app/actions/tasks";
import { formatMinutes } from "./time-spent-dialog";

const STATUS_LABEL: Record<TaskStatus, string> = {
  backlog: "Backlog",
  todo: "To Do",
  in_progress: "In Progress",
  blocked: "Blocked",
  done: "Done",
};

const PRIORITY_LABEL: Record<TaskPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

export function TaskDrawer({
  taskId,
  tasks,
  projects,
  onClose,
}: {
  taskId: string | null;
  tasks: Task[];
  projects: Project[];
  goals: Goal[];
  onClose: () => void;
}) {
  const task = taskId ? tasks.find((t) => t.id === taskId) : null;
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<TaskStatus>("backlog");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [dueDate, setDueDate] = useState("");
  const [projectId, setProjectId] = useState<string>("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!task) return;
    setTitle(task.title);
    setDescription(task.description ?? "");
    setStatus(task.status);
    setPriority(task.priority);
    setDueDate(task.dueDate ? task.dueDate.slice(0, 10) : "");
    setProjectId(task.projectId);
  }, [task]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && taskId) onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [taskId, onClose]);

  if (!task) return null;

  async function save(opts?: { thenPromptTime?: boolean }) {
    if (!task) return;
    setSaving(true);
    const wasDone = task.status === "done";
    const nowDone = status === "done";
    try {
      await updateTaskAction({
        id: task.id,
        title,
        description: description || null,
        status,
        priority,
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
        projectId,
      });
      toast.success("Saved");
      onClose();
      // Prompt for time when transitioning into Done, or when the caller
      // explicitly asked to open the time dialog (e.g. "Log time" button).
      const autoPrompt = nowDone && !wasDone;
      if (autoPrompt || opts?.thenPromptTime) {
        window.dispatchEvent(
          new CustomEvent("jarvis:task-completed", {
            detail: {
              taskId: task.id,
              taskTitle: title,
              initialMinutes: task.timeSpentMinutes ?? null,
            },
          }),
        );
      }
    } catch (err) {
      console.error(err);
      toast.error("Could not save");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!task) return;
    if (!confirm("Delete this task?")) return;
    try {
      await deleteTaskAction(task.id);
      toast.success("Deleted");
      onClose();
    } catch {
      toast.error("Could not delete");
    }
  }

  return (
    <>
      <div
        onClick={onClose}
        className="fixed inset-0 z-40 bg-[rgba(30,55,110,0.35)] backdrop-blur-sm"
      />
      <div
        className="fixed right-7 top-7 bottom-7 w-[440px] z-50 flex flex-col p-7 rounded-[36px] bg-white overflow-hidden"
        style={{
          boxShadow:
            "0 30px 60px -15px rgba(45,75,156,0.35), inset 0 3px 0 rgba(255,255,255,0.8)",
        }}
      >
        <div className="flex items-start justify-between mb-5">
          <div>
            <div className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-[var(--color-ink-dim)] mb-1.5">
              Task
            </div>
            <h3 className="font-display text-[26px] font-black tracking-[-0.025em] leading-[1.1] text-[var(--color-ink)]">
              Edit task
            </h3>
            <p className="text-[11.5px] text-[var(--color-ink-mid)] font-semibold mt-1">
              Created {format(new Date(task.createdAt), "MMM d, yyyy")}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-[12px] bg-[var(--color-bg)] grid place-items-center text-[var(--color-ink-mid)] hover:text-[var(--color-ink)]"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto flex flex-col gap-4 pr-1">
          <Field label="Title">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </Field>
          <Field label="Description">
            <Textarea
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add detail, links, context…"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Status">
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as TaskStatus)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TASK_STATUS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {STATUS_LABEL[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Priority">
              <Select
                value={priority}
                onValueChange={(v) => setPriority(v as TaskPriority)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TASK_PRIORITY.map((p) => (
                    <SelectItem key={p} value={p}>
                      {PRIORITY_LABEL[p]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Due date">
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </Field>
            <Field label="Project">
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
          <Field label="Time spent">
            <div
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-[14px] clay-inset"
            >
              <Clock size={15} className="text-[var(--color-ink-mid)]" />
              <span
                className={
                  task.timeSpentMinutes
                    ? "text-[var(--color-ink)] font-semibold text-sm"
                    : "text-[var(--color-ink-faint)] italic text-sm"
                }
              >
                {task.timeSpentMinutes
                  ? formatMinutes(task.timeSpentMinutes)
                  : "Not logged"}
              </span>
              <button
                type="button"
                disabled={saving}
                onClick={() => {
                  // Save pending drawer edits first, then open the time
                  // dialog. Avoids clobbering an unsaved status change.
                  save({ thenPromptTime: true });
                }}
                className="ml-auto inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-[0.08em] text-[var(--color-clay-deep)] hover:underline disabled:opacity-50"
              >
                <Pencil size={11} strokeWidth={2.6} />
                {task.timeSpentMinutes ? "Edit" : "Log time"}
              </button>
            </div>
          </Field>
        </div>

        <div className="mt-5 flex items-center justify-between">
          <button
            onClick={remove}
            className="inline-flex items-center gap-2 text-[var(--color-clay-coral-2)] hover:text-[var(--color-clay-coral-2)] font-bold text-sm"
          >
            <Trash2 size={16} />
            Delete
          </button>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => save()} disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-[var(--color-ink-dim)]">
        {label}
      </span>
      {children}
    </label>
  );
}
