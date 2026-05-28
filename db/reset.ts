import { existsSync, rmSync } from "node:fs";
import { resolve } from "node:path";

const DB_PATH = resolve(process.cwd(), "data", "jarvis.db");
for (const p of [DB_PATH, `${DB_PATH}-shm`, `${DB_PATH}-wal`]) {
  if (existsSync(p)) {
    rmSync(p);
    console.log(`Removed ${p}`);
  }
}
console.log("Reset done. Run `npm run db:migrate` and `npm run db:seed`.");
