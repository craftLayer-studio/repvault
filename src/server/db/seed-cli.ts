/* `pnpm db:seed` seeds an empty database; `pnpm db:seed --reset` wipes it and reseeds the demo gym. */
import { getDb } from "./client";
import { resetDb, seedDemo, seedIfEmpty } from "./seed";

async function main() {
  const db = await getDb(); // getDb already auto-seeds an empty DB
  if (process.argv.includes("--reset")) {
    await resetDb(db);
    await seedDemo(db);
    console.log("Demo data reset.");
  } else {
    const seeded = await seedIfEmpty(db);
    console.log(seeded ? "Seeded demo gym." : "Database already has data (use --reset to wipe and reseed).");
  }
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
