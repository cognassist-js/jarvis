@AGENTS.md

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> **Read `AGENTS.md` first** — Next.js 16 has breaking changes from training data. Consult `node_modules/next/dist/docs/` before writing routing, cache, or data-fetching code. Async `cookies/headers/params/searchParams`, `revalidateTag(tag, profile)`, `middleware.ts` → `proxy.ts`. See parent `../CLAUDE.md` for the full Next 16 cheat sheet.

## Common commands

```bash
npm run dev          # dev server on :3000 (Turbopack, default in Next 16)
npm run build        # production build
npm run db:migrate   # apply Drizzle migrations to ./data/jarvis.db
npm run db:seed      # reset + reseed example data
npm run db:generate  # generate a new migration after editing db/schema.ts
npm run db:studio    # Drizzle Studio for ad-hoc inspection
npm run db:reset     # delete the SQLite file (then re-migrate + re-seed)
npx tsc --noEmit     # typecheck — no lint or test scripts exist
```

`next lint` was removed in Next 16. There is no test suite by design (personal tool).

## The architectural rule (read this before adding features)

**Server Actions and AI chat tools share one service layer.** When adding a mutation or query:

1. Write/extend the function in `lib/services/{goals,projects,tasks}.ts` (synchronous, calls Drizzle directly).
2. If the user-facing UI needs it → expose via `app/actions/*` (Server Action, validates with `lib/schemas.ts`, calls `revalidatePath`).
3. If the AI needs it → add a tool entry in `lib/ai/tools.ts` (same zod schema, same service call).

Never duplicate the logic. Never have a Server Action talk to the DB directly — go through `lib/services/`.

## Live-refresh wiring

After the AI mutates data via a tool, the kanban board must update without a full reload. The wiring:

- `components/chat/chat-panel.tsx` and `components/chat/full-chat.tsx` call `window.dispatchEvent(new CustomEvent("jarvis:refresh"))` in `useChat`'s `onFinish`.
- `components/board/board-page.tsx` listens for `jarvis:refresh` and calls `router.refresh()`.

Don't break this loop. If you add another mutation surface (e.g. a new client-side action that doesn't go through a Server Action), dispatch `jarvis:refresh` after it too.

A parallel event `jarvis:new-task` opens the global new-task dialog (handled by `components/global-commands.tsx`). The board's "N" key handler and the "New task" button both dispatch this event rather than holding their own dialog state.

## Calendar integration (ICS sync)

`lib/services/calendar.ts` mirrors an Outlook/Teams **ICS** feed into tasks (read-only, one-way — chosen over Graph OAuth to avoid Azure setup on this local tool). Key points if you touch it:

- Tasks carry provenance columns: `source` (`manual` | `calendar`), `externalId` (`${UID}::${startISO}`, unique — recurring instances are distinct), `meetingStart`, `meetingEnd`. Connection state lives in the single-row `calendar_connection` table.
- **Override-preservation rule:** on re-sync, only calendar-owned fields (`title`, `dueDate`, `meeting*`, `description`) are updated for existing tasks. **Never** overwrite `projectId`, `priority`, `status`, `sortOrder`, `timeSpentMinutes`, or `completedAt` — that's what lets the user reassign a meeting's project/priority and have it stick.
- Cancellation cleanup only deletes calendar tasks whose date is **inside** the sync window `[today, +windowDays]`; past meetings are deliberately kept.
- Meetings default to the auto-created **"Meetings & Admin"** project, `status='todo'`, `priority='medium'`.
- Entry points: `app/actions/calendar.ts` (Server Actions) and the `syncCalendar`/`getCalendarStatus` AI tools — same service layer, per the architectural rule. Sync is triggered on board load (when stale) and via "Sync now"; both dispatch `jarvis:refresh` afterward.
- Uses `ical-expander` (wraps `ical.js`, which is untyped — see `types/ical.d.ts`) to expand recurrences within the window.

## AI SDK v6 gotchas

`app/api/chat/route.ts` is the chat endpoint. Things that differ from v4/v5 training data:

- `tool()` helper is imported from `@ai-sdk/provider-utils`, **not** `ai`.
- `convertToModelMessages(...)` returns a `Promise` — must `await`.
- Model id is `anthropic/claude-sonnet-4.6` (a dot, not `4-6` with a dash).
- `streamText` returns a result with `.toUIMessageStreamResponse({ onFinish })` — that's where assistant messages get persisted to `chat_messages`.
- `useChat` is from `@ai-sdk/react`; `DefaultChatTransport` is from `ai`.
- Stop condition: `stopWhen: stepCountIs(10)` caps the tool-call loop.

## Styling: Clay/Ocean direction

Tokens live in `app/globals.css` under `@theme`. The visual signature is layered shadows — outer drop + inset highlight + inset lowlight — applied via inline `style` (not Tailwind shadow utilities, which can't express three stacked shadows). Copy the shadow recipe from an existing surface (e.g. `clay-card` in `globals.css`, or the task card in `components/board/task-card.tsx`) when adding new ones. The canonical visual reference is `../designs/04b-clay-ocean.html`.

Dark mode is `class="dark"` on `<html>`, managed by `components/theme-provider.tsx`. Custom rules in `globals.css` rewrite `clay-surface`/`clay-card`/`clay-inset` for dark mode.

Display font: Fraunces (headings, numerals). UI font: Plus Jakarta Sans. Both loaded via `next/font/google` in `app/layout.tsx`.

## Out of scope (per the product brief)

Don't add auth, hosting, Dockerfiles, multi-user logic, time tracking, recurring tasks, subtasks, mobile-first layouts, or test suites unless the user explicitly asks. The product is scoped to one user running locally.
