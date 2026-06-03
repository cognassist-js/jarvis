import "server-only";
import { and, eq, sql } from "drizzle-orm";
import { addDays, startOfDay } from "date-fns";
import IcalExpander from "ical-expander";
import { db } from "@/db";
import {
  calendarConnection,
  projects,
  tasks,
  type CalendarConnection,
} from "@/db/schema";
import { newId, now } from "@/lib/id";
import type { CalendarConnectionInput } from "@/lib/schemas";

// Single logical connection row.
const CONN_ID = "calendar";
const MEETINGS_PROJECT_TITLE = "Meetings & Admin";

export type SyncResult = { created: number; updated: number; removed: number };

export async function getConnection(): Promise<CalendarConnection | undefined> {
  return db
    .select()
    .from(calendarConnection)
    .where(eq(calendarConnection.id, CONN_ID))
    .get();
}

/** Find (or create) the dedicated project meetings land in by default. */
function ensureMeetingsProject(): string {
  const existing = db
    .select({ id: projects.id })
    .from(projects)
    .where(eq(projects.title, MEETINGS_PROJECT_TITLE))
    .get();
  if (existing) return existing.id;
  const ts = now();
  const maxSort = db
    .select({ m: sql<number>`coalesce(max(${projects.sortOrder}), -1)` })
    .from(projects)
    .get();
  const id = newId();
  db.insert(projects)
    .values({
      id,
      goalId: null,
      title: MEETINGS_PROJECT_TITLE,
      description: "Meetings synced from your calendar, plus general admin.",
      status: "active",
      dueDate: null,
      tags: ["meetings"],
      sortOrder: (maxSort?.m ?? -1) + 1,
      createdAt: ts,
      updatedAt: ts,
    })
    .run();
  return id;
}

export async function saveConnection(
  input: CalendarConnectionInput,
): Promise<CalendarConnection> {
  const ts = now();
  const existing = await getConnection();
  const defaultProjectId = existing?.defaultProjectId ?? ensureMeetingsProject();
  if (existing) {
    db.update(calendarConnection)
      .set({
        icsUrl: input.icsUrl,
        syncWindowDays: input.syncWindowDays ?? existing.syncWindowDays,
        defaultProjectId,
        updatedAt: ts,
      })
      .where(eq(calendarConnection.id, CONN_ID))
      .run();
  } else {
    db.insert(calendarConnection)
      .values({
        id: CONN_ID,
        icsUrl: input.icsUrl,
        defaultProjectId,
        syncWindowDays: input.syncWindowDays ?? 14,
        lastSyncedAt: null,
        lastSyncStatus: null,
        createdAt: ts,
        updatedAt: ts,
      })
      .run();
  }
  return (await getConnection())!;
}

/** Remove the connection. Leaves already-synced meeting tasks in place. */
export async function disconnect(): Promise<void> {
  db.delete(calendarConnection).where(eq(calendarConnection.id, CONN_ID)).run();
}

function markSync(status: string): void {
  db.update(calendarConnection)
    .set({ lastSyncedAt: now(), lastSyncStatus: status, updatedAt: now() })
    .where(eq(calendarConnection.id, CONN_ID))
    .run();
}

type MappedEvent = {
  externalId: string;
  title: string;
  description: string | null;
  dueDate: string;
  meetingStart: string;
  meetingEnd: string;
  status: string | null;
};

// ical.js types are untyped (see types/ical.d.ts); event/time are `any`.
function mapEvent(
  event: any,
  startTime: any,
  endTime: any,
): MappedEvent | null {
  const uid: string = event?.uid ?? "";
  if (!uid) return null;
  const start: Date = startTime.toJSDate();
  const end: Date = endTime ? endTime.toJSDate() : start;
  const summary: string = (event?.summary ?? "").trim();
  const location: string = (event?.location ?? "").trim();
  const rawDescription: string = event?.description ?? "";
  const status: string | null =
    event?.component?.getFirstPropertyValue?.("status") ?? null;

  // Pull a Teams/meeting join link out of the body if present.
  const joinMatch = rawDescription.match(
    /https:\/\/teams\.microsoft\.com\/l\/meetup-join\/\S+/i,
  );
  const descLines = [
    location ? `📍 ${location}` : null,
    joinMatch ? `Join: ${joinMatch[0]}` : null,
  ].filter(Boolean) as string[];

  const startISO = start.toISOString();
  return {
    externalId: `${uid}::${startISO}`,
    title: summary || "(No title) meeting",
    description: descLines.length ? descLines.join("\n\n") : null,
    dueDate: startISO,
    meetingStart: startISO,
    meetingEnd: end.toISOString(),
    status: typeof status === "string" ? status.toUpperCase() : null,
  };
}

/**
 * Fetch the ICS feed and reconcile it into tasks. Calendar-owned fields
 * (title/dates) are refreshed; user overrides (project, priority, status,
 * sortOrder, logged time) are never touched once a task exists.
 */
export async function syncCalendar(): Promise<SyncResult> {
  const conn = await getConnection();
  if (!conn) throw new Error("No calendar connected");

  // Fetch.
  let icsText: string;
  try {
    const url = conn.icsUrl.replace(/^webcal:\/\//i, "https://");
    const res = await fetch(url, {
      headers: { Accept: "text/calendar" },
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`Calendar fetch failed (HTTP ${res.status})`);
    icsText = await res.text();
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Calendar fetch failed";
    markSync(`error: ${msg}`);
    throw new Error(msg);
  }

  // Parse + expand recurrences within the sync window.
  const windowStart = startOfDay(new Date());
  const windowEnd = addDays(windowStart, conn.syncWindowDays);
  let fresh: MappedEvent[];
  try {
    const expander = new IcalExpander({ ics: icsText, maxIterations: 5000 });
    const { events, occurrences } = expander.between(windowStart, windowEnd);
    const mapped: MappedEvent[] = [];
    for (const ev of events) {
      const m = mapEvent(ev, ev.startDate, ev.endDate);
      if (m) mapped.push(m);
    }
    for (const o of occurrences) {
      const m = mapEvent(o.item, o.startDate, o.endDate);
      if (m) mapped.push(m);
    }
    // Drop cancelled events and de-dupe by externalId.
    const seen = new Set<string>();
    fresh = mapped.filter((m) => {
      if (m.status === "CANCELLED") return false;
      if (seen.has(m.externalId)) return false;
      seen.add(m.externalId);
      return true;
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Could not parse calendar";
    markSync(`error: ${msg}`);
    throw new Error(msg);
  }

  const projectId = conn.defaultProjectId ?? ensureMeetingsProject();
  const winStartISO = windowStart.toISOString();
  const winEndISO = windowEnd.toISOString();
  const ts = now();

  let created = 0;
  let updated = 0;
  let removed = 0;

  db.transaction((tx) => {
    for (const m of fresh) {
      const existing = tx
        .select()
        .from(tasks)
        .where(eq(tasks.externalId, m.externalId))
        .get();
      if (existing) {
        // Refresh only calendar-owned fields — never clobber user overrides.
        tx.update(tasks)
          .set({
            title: m.title,
            description: m.description,
            dueDate: m.dueDate,
            meetingStart: m.meetingStart,
            meetingEnd: m.meetingEnd,
            updatedAt: ts,
          })
          .where(eq(tasks.id, existing.id))
          .run();
        updated++;
      } else {
        const maxSort = tx
          .select({ m: sql<number>`coalesce(max(${tasks.sortOrder}), -1)` })
          .from(tasks)
          .where(and(eq(tasks.projectId, projectId), eq(tasks.status, "todo")))
          .get();
        tx.insert(tasks)
          .values({
            id: newId(),
            projectId,
            title: m.title,
            description: m.description,
            status: "todo",
            priority: "medium",
            dueDate: m.dueDate,
            sortOrder: (maxSort?.m ?? -1) + 1,
            completedAt: null,
            timeSpentMinutes: null,
            source: "calendar",
            externalId: m.externalId,
            meetingStart: m.meetingStart,
            meetingEnd: m.meetingEnd,
            createdAt: ts,
            updatedAt: ts,
          })
          .run();
        created++;
      }
    }

    // Reconcile cancellations: drop calendar tasks that fall inside the synced
    // window but were absent from this fetch. Past meetings (before the window)
    // are deliberately left untouched.
    const freshIds = new Set(fresh.map((m) => m.externalId));
    const calTasks = tx
      .select()
      .from(tasks)
      .where(eq(tasks.source, "calendar"))
      .all();
    for (const t of calTasks) {
      if (!t.externalId || freshIds.has(t.externalId)) continue;
      const when = t.dueDate ?? t.meetingStart;
      if (!when) continue;
      if (when >= winStartISO && when <= winEndISO) {
        tx.delete(tasks).where(eq(tasks.id, t.id)).run();
        removed++;
      }
    }
  });

  markSync("ok");
  return { created, updated, removed };
}
