# Jarvis

A single-user personal digital assistant and project planner. Local-only, kanban-first, with an AI chat that can read and modify the board through tool calls.

Built for one user. No auth, no hosting, no multi-tenancy — runs on `localhost`, data lives in `./data/jarvis.db`.

Design direction: **Clay / Ocean** — soft sky-blue, aqua, lilac palette with neumorphic clay surfaces. Display type is Fraunces; UI type is Plus Jakarta Sans.

## Prerequisites

- Node.js **24 LTS** (or 20.9+)
- A Vercel AI Gateway API key (for the chat assistant). Sign up at vercel.com → AI Gateway, then create a key.

## Install

```bash
cd app-jarvis
npm install
cp .env.local.example .env.local       # then paste your AI_GATEWAY_API_KEY
git config core.hooksPath .githooks     # one-time: enable pre-commit safety hook
npm run db:migrate
npm run db:seed                         # optional — gives you a starter board
npm run dev
```

Open http://localhost:3000.

The pre-commit hook in `.githooks/pre-commit` blocks accidental commits of `*.db` SQLite files, anything under a top-level `data/` folder, or `.env*` files (except `.env.local.example`). Bypass with `git commit --no-verify` if you ever need to.

## Scripts

| Command               | What it does                                              |
| --------------------- | --------------------------------------------------------- |
| `npm run dev`         | Start the Next.js dev server on :3000                     |
| `npm run build`       | Production build                                          |
| `npm run start`       | Run the production build                                  |
| `npm run db:generate` | Generate a new Drizzle migration from schema changes      |
| `npm run db:migrate`  | Apply migrations (creates `data/jarvis.db` on first run)  |
| `npm run db:seed`     | Seed an example dataset (3 goals, 3 projects, 11 tasks)   |
| `npm run db:studio`   | Launch Drizzle Studio for ad-hoc DB inspection            |
| `npm run db:reset`    | Delete the SQLite file (then re-migrate + re-seed)        |

## Environment

`.env.local`:

```
AI_GATEWAY_API_KEY=     # required for chat
USER_NAME=James         # the name Jarvis calls you
JARVIS_MODEL=anthropic/claude-sonnet-4.6  # optional override
```

## Keyboard shortcuts

| Key             | Action                                        |
| --------------- | --------------------------------------------- |
| `⌘K` / `Ctrl+K` | Open command palette (navigate + run actions) |
| `N`             | New task                                      |
| `Esc`           | Close drawer / dialog / palette               |

## Architecture (one paragraph)

Next.js 16 (App Router, Turbopack) with React 19 Server Components. SQLite via `better-sqlite3` and Drizzle ORM, file lives at `./data/jarvis.db`. All UI is a single shell (`AppShell`) with a sidebar (goals + nav), main route content, and a persistent chat panel on the right — backed by Server Actions in `app/actions/*` that revalidate paths after mutation. The chat (`/api/chat`) uses Vercel AI SDK v6 (`streamText`) with `anthropic/claude-sonnet-4.6` via the AI Gateway and exposes 12 tools (CRUD over goals/projects/tasks plus a dashboard summary) wired straight into the same service-layer functions the Server Actions use. The kanban board uses `@dnd-kit` for cross-column drag and within-column reorder; updates are optimistic and reconcile via `router.refresh()` plus a custom `jarvis:refresh` event the chat dispatches when the assistant has mutated data. Dark mode is a `class="dark"` toggle on `<html>`, persisted to localStorage. No tests beyond manual smoke runs — this is a personal tool.

## Project layout

```
app/
  api/chat/route.ts         AI SDK streamText + Jarvis tools
  actions/                  Server Actions (goals, projects, tasks)
  page.tsx                  Kanban board (/)
  goals/page.tsx
  projects/page.tsx
  chat/page.tsx             Full-screen chat
components/
  app-shell.tsx             Three-column layout
  sidebar.tsx
  board/                    KanbanBoard, TaskCard, TaskDrawer
  goals/, projects/
  chat/                     ChatPanel (slide-in), FullChat (route)
  command-palette.tsx
  statusbar.tsx
  ui/                       Button, Input, Dialog, Select primitives
db/
  schema.ts                 Drizzle tables
  index.ts                  better-sqlite3 client
  migrate.ts, seed.ts, reset.ts
  migrations/               Auto-generated SQL
lib/
  services/                 Pure data access (used by Actions AND AI tools)
  ai/tools.ts               12 Jarvis tools (zod-validated, call services directly)
  schemas.ts                Shared zod schemas
data/
  jarvis.db                 SQLite file (gitignored)
```

## Out of scope (v1, by design)

Authentication, hosting, deployment, multi-user, calendar/email integrations, time tracking, recurring tasks, subtasks, mobile-first layout, automated tests beyond a smoke level.
