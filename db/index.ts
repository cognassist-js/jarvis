import "server-only";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { mkdirSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import * as schema from "./schema";

const DB_PATH = resolve(process.cwd(), "data", "jarvis.db");

if (!existsSync(dirname(DB_PATH))) {
  mkdirSync(dirname(DB_PATH), { recursive: true });
}

declare global {
  // eslint-disable-next-line no-var
  var __jarvis_sqlite: Database.Database | undefined;
}

const sqlite = globalThis.__jarvis_sqlite ?? new Database(DB_PATH);
if (!globalThis.__jarvis_sqlite) {
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  globalThis.__jarvis_sqlite = sqlite;
}

export const db = drizzle(sqlite, { schema });
export { schema };
