import { eq, and, isNull } from "drizzle-orm";
import { getDb } from "./client";
import { prompts } from "./schema";
import defaultPrompts from "../data/default-prompts.json";

export async function runSeed(databaseUrl: string) {
  const db = getDb(databaseUrl);

  const existing = await db
    .select({ id: prompts.id })
    .from(prompts)
    .where(and(isNull(prompts.guildId), eq(prompts.status, "approved")))
    .limit(1);

  if (existing.length > 0) {
    console.log("Default prompts already seeded, skipping.");
    return;
  }

  const rows = [
    ...defaultPrompts.truths.map((text) => ({
      guildId: null,
      type: "truth" as const,
      text,
      status: "approved" as const,
    })),
    ...defaultPrompts.dares.map((text) => ({
      guildId: null,
      type: "dare" as const,
      text,
      status: "approved" as const,
    })),
  ];

  await db.insert(prompts).values(rows);
  console.log(`Seeded ${rows.length} default prompts.`);
}

if (import.meta.main) {
  const { loadConfig } = await import("../config");
  const { closeDb } = await import("./client");
  await runSeed(loadConfig().DATABASE_URL);
  await closeDb();
}
