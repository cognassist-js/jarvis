"use client";
import { useEffect, useRef, useState } from "react";
import { Clock } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateTaskAction } from "@/app/actions/tasks";

export function TimeSpentDialog({
  open,
  onOpenChange,
  taskId,
  taskTitle,
  initialMinutes,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  taskId: string | null;
  taskTitle: string | null;
  initialMinutes: number | null;
}) {
  const [hours, setHours] = useState("");
  const [minutes, setMinutes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const hoursRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    if (initialMinutes != null && initialMinutes > 0) {
      setHours(String(Math.floor(initialMinutes / 60)));
      setMinutes(String(initialMinutes % 60));
    } else {
      setHours("");
      setMinutes("");
    }
    // Focus hours input on open
    setTimeout(() => hoursRef.current?.focus(), 50);
  }, [open, initialMinutes, taskId]);

  function parseTotal(): number | null {
    const h = parseInt(hours, 10);
    const m = parseInt(minutes, 10);
    const hv = Number.isFinite(h) && h >= 0 ? h : 0;
    const mv = Number.isFinite(m) && m >= 0 ? m : 0;
    const total = hv * 60 + mv;
    return total > 0 ? total : null;
  }

  async function save() {
    if (!taskId) return;
    const total = parseTotal();
    if (total == null) {
      toast.error("Enter a time greater than zero, or hit Skip");
      return;
    }
    if (total > 525_600) {
      toast.error("That's more than a year — pick a smaller number");
      return;
    }
    setSubmitting(true);
    try {
      await updateTaskAction({ id: taskId, timeSpentMinutes: total });
      toast.success(`Logged ${formatMinutes(total)}`);
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      toast.error("Could not save");
    } finally {
      setSubmitting(false);
    }
  }

  function skip() {
    onOpenChange(false);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      save();
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            <span className="inline-flex items-center gap-2.5">
              <span
                className="w-9 h-9 rounded-[14px] grid place-items-center text-white"
                style={{
                  background:
                    "linear-gradient(160deg, var(--color-clay-lilac), var(--color-clay-lavender))",
                  boxShadow:
                    "0 6px 12px -3px rgba(160,130,220,0.5), inset 0 2px 0 rgba(255,255,255,0.4)",
                }}
              >
                <Clock size={16} strokeWidth={2.6} />
              </span>
              How long did it take?
            </span>
          </DialogTitle>
          <DialogDescription>
            {taskTitle ? (
              <>Logging time for <strong className="text-[var(--color-ink)]">{taskTitle}</strong>. Optional — skip if you'd rather not.</>
            ) : (
              "Optional — skip if you'd rather not."
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-end gap-3">
          <label className="flex flex-col gap-1.5 flex-1">
            <span className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-[var(--color-ink-dim)]">
              Hours
            </span>
            <Input
              ref={hoursRef}
              type="number"
              inputMode="numeric"
              min={0}
              max={24 * 365}
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="0"
            />
          </label>
          <label className="flex flex-col gap-1.5 flex-1">
            <span className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-[var(--color-ink-dim)]">
              Minutes
            </span>
            <Input
              type="number"
              inputMode="numeric"
              min={0}
              max={59}
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="0"
            />
          </label>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="secondary" onClick={skip} disabled={submitting}>
            Skip
          </Button>
          <Button onClick={save} disabled={submitting}>
            {submitting ? "Saving…" : "Save time"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function formatMinutes(total: number | null | undefined): string {
  if (total == null || total <= 0) return "—";
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}
