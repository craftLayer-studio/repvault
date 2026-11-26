import { mkdirSync } from "node:fs";
import path from "node:path";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import * as schema from "./schema";

export type Db = PgDatabase<PgQueryResultHKT, typeof schema>;
export type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];

const MIGRATIONS = path.join(process.cwd(), "drizzle");

/** In-memory PGlite with migrations applied. Used by tests. */
export async function createMemoryDb(): Promise<Db> {
  const { PGlite } = await import("@electric-sql/pglite");
  const { drizzle } = await import("drizzle-orm/pglite");
  const { migrate } = await import("drizzle-orm/pglite/migrator");
  const db = drizzle(new PGlite(), { schema });
  await migrate(db, { migrationsFolder: MIGRATIONS });
  return db as unknown as Db;
}

/**
 * The app database: node-postgres when DATABASE_URL is set, otherwise a PGlite file DB under
 * ./.data/pglite. Migrations run on first use.
 */
async function openAppDb(): Promise<Db> {
  const url = process.env.DATABASE_URL;
  if (url) {
    const { Pool } = await import("pg");
    const { drizzle } = await import("drizzle-orm/node-postgres");
    const { migrate } = await import("drizzle-orm/node-postgres/migrator");
    const db = drizzle(new Pool({ connectionString: url, max: 10 }), { schema });
    await migrate(db, { migrationsFolder: MIGRATIONS });
    return db as unknown as Db;
  }
  const { PGlite } = await import("@electric-sql/pglite");
  const { drizzle } = await import("drizzle-orm/pglite");
  const { migrate } = await import("drizzle-orm/pglite/migrator");
  const dir = process.env.PGLITE_DIR ?? path.join(process.cwd(), ".data", "pglite");
  mkdirSync(dir, { recursive: true });
  const db = drizzle(new PGlite(dir), { schema });
  await migrate(db, { migrationsFolder: MIGRATIONS });
  return db as unknown as Db;
}

const g = globalThis as unknown as { __repvaultDb?: Promise<Db> };

/** Process-wide database (survives dev hot reloads). Seeds the demo gym into an empty DB. */
export function getDb(): Promise<Db> {
  if (!g.__repvaultDb) {
    g.__repvaultDb = (async () => {
      const db = await openAppDb();
      const { seedIfEmpty } = await import("./seed");
      await seedIfEmpty(db);
      return db;
    })().catch((err) => {
      g.__repvaultDb = undefined;
      throw err;
    });
  }
  return g.__repvaultDb;
}
