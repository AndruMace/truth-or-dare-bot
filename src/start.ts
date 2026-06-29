import { loadConfig } from "./config";
import { runMigrations } from "./db/migrate";
import { runSeed } from "./db/seed";
import { closeDb } from "./db/client";

const config = loadConfig();
await runMigrations(config.DATABASE_URL);
await runSeed(config.DATABASE_URL);
await closeDb();

await import("./index");
