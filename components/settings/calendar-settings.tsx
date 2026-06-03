"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { CalendarClock, Plug, RefreshCw, Unplug, CheckCircle2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  connectCalendarAction,
  syncCalendarAction,
  disconnectCalendarAction,
} from "@/app/actions/calendar";

type Connection = {
  icsUrl: string;
  lastSyncedAt: string | null;
  lastSyncStatus: string | null;
  syncWindowDays: number;
};

export function CalendarSettings({
  connection,
}: {
  connection: Connection | null;
}) {
  const router = useRouter();
  const [url, setUrl] = useState(connection?.icsUrl ?? "");
  const [busy, setBusy] = useState<null | "connect" | "sync" | "disconnect">(
    null,
  );

  function afterChange() {
    // Refresh this page's server data and let the board pick up new tasks.
    router.refresh();
    window.dispatchEvent(new CustomEvent("jarvis:refresh"));
  }

  async function connect() {
    setBusy("connect");
    try {
      const r = await connectCalendarAction({ icsUrl: url.trim() });
      toast.success(`Connected — imported ${r.created} meeting${r.created === 1 ? "" : "s"}`);
      afterChange();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not connect");
    } finally {
      setBusy(null);
    }
  }

  async function sync() {
    setBusy("sync");
    try {
      const r = await syncCalendarAction();
      const changed = r.created + r.updated + r.removed;
      toast.success(
        changed === 0
          ? "Calendar up to date"
          : `Synced — ${r.created} new, ${r.updated} updated${r.removed ? `, ${r.removed} removed` : ""}`,
      );
      afterChange();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sync failed");
    } finally {
      setBusy(null);
    }
  }

  async function disconnect() {
    if (!confirm("Disconnect the calendar? Existing meeting tasks are kept.")) {
      return;
    }
    setBusy("disconnect");
    try {
      await disconnectCalendarAction();
      toast.success("Calendar disconnected");
      setUrl("");
      afterChange();
    } catch {
      toast.error("Could not disconnect");
    } finally {
      setBusy(null);
    }
  }

  const synced = connection?.lastSyncedAt
    ? formatDistanceToNow(new Date(connection.lastSyncedAt), { addSuffix: true })
    : null;
  const syncError =
    connection?.lastSyncStatus && connection.lastSyncStatus.startsWith("error:")
      ? connection.lastSyncStatus.slice(6).trim()
      : null;

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
          Workspace
        </span>
        <span className="text-[var(--color-ink-faint)]">›</span>
        <span className="text-[var(--color-ink)]">Settings</span>
      </div>

      <h2 className="font-display text-[44px] font-black leading-none tracking-[-0.03em] text-[var(--color-ink)] mb-7">
        Settings<span className="text-[var(--color-clay-deep)]">.</span>
      </h2>

      <div className="flex-1 overflow-y-auto pr-1">
        <div className="clay-card max-w-[640px] p-7">
          <div className="flex items-start gap-3.5 mb-5">
            <span
              className="w-12 h-12 rounded-[16px] grid place-items-center text-white flex-shrink-0"
              style={{
                background:
                  "linear-gradient(160deg, var(--color-clay-sky), var(--color-clay-deep))",
                boxShadow:
                  "0 8px 16px -4px rgba(85,145,235,0.5), inset 0 2px 0 rgba(255,255,255,0.4)",
              }}
            >
              <CalendarClock size={24} strokeWidth={2.4} />
            </span>
            <div>
              <h3 className="font-display text-[22px] font-black tracking-[-0.02em] text-[var(--color-ink)]">
                Calendar integration
              </h3>
              <p className="text-[13px] text-[var(--color-ink-mid)] font-semibold mt-1">
                Subscribe to your Outlook/Teams calendar so meetings appear as
                tasks. Read-only and one-way.
              </p>
            </div>
          </div>

          <label className="flex flex-col gap-1.5 mb-4">
            <span className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-[var(--color-ink-dim)]">
              ICS calendar URL
            </span>
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://outlook.office365.com/owa/calendar/…/reachcalendar.ics"
              spellCheck={false}
            />
          </label>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              variant="primary"
              onClick={connect}
              disabled={!url.trim() || busy !== null}
            >
              <Plug size={16} strokeWidth={2.6} />
              {busy === "connect"
                ? "Connecting…"
                : connection
                  ? "Update & sync"
                  : "Connect & sync"}
            </Button>
            {connection && (
              <>
                <Button
                  variant="secondary"
                  onClick={sync}
                  disabled={busy !== null}
                >
                  <RefreshCw
                    size={16}
                    strokeWidth={2.6}
                    className={busy === "sync" ? "animate-spin" : undefined}
                  />
                  {busy === "sync" ? "Syncing…" : "Sync now"}
                </Button>
                <Button
                  variant="ghost"
                  onClick={disconnect}
                  disabled={busy !== null}
                >
                  <Unplug size={16} strokeWidth={2.6} />
                  Disconnect
                </Button>
              </>
            )}
          </div>

          {connection && (
            <div className="mt-5 flex items-center gap-2 text-[12.5px] font-semibold">
              {syncError ? (
                <span className="inline-flex items-center gap-1.5 text-[var(--color-clay-coral-2)]">
                  <AlertTriangle size={14} strokeWidth={2.6} />
                  Last sync failed: {syncError}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-[var(--color-ink-mid)]">
                  <CheckCircle2 size={14} strokeWidth={2.6} />
                  {synced ? `Last synced ${synced}` : "Not synced yet"} · meetings
                  land in “Meetings &amp; Admin” (reassign any one from its task
                  drawer)
                </span>
              )}
            </div>
          )}

          <div className="mt-6 pt-5 border-t border-[rgba(45,75,156,0.1)] text-[12px] text-[var(--color-ink-mid)] font-medium leading-relaxed">
            <p className="font-bold text-[var(--color-ink)] mb-1.5">
              Where do I find this URL?
            </p>
            <p>
              Paste any published <strong>ICS</strong> calendar feed. For Outlook
              that means <strong>Calendar → Shared calendars → Publish a
              calendar</strong> with “Can view all details” — but heads up, many{" "}
              <strong>managed work accounts have publishing disabled</strong>, so
              that option may be missing entirely. A personal Outlook/Google
              calendar or any other ICS feed works just as well.
            </p>
            <p className="mt-2.5 text-[var(--color-ink-faint)]">
              Note: published feeds refresh on a provider delay (often 15+ min)
              and usually don’t expose declined meetings.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
