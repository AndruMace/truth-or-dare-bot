import { eq, and, isNull } from "drizzle-orm";
import { getDb } from "./client";
import { prompts } from "./schema";
import { loadDefaultPrompts } from "../data/prompts/manifest";

const INSERT_BATCH = 100;

export async function runSeed(databaseUrl: string) {
  const db = getDb(databaseUrl);
  const { truths, dares } = loadDefaultPrompts();
  const allTexts = [...truths, ...dares];

  const existing = await db
    .select({ text: prompts.text })
    .from(prompts)
    .where(and(isNull(prompts.guildId), eq(prompts.status, "approved")));

  const existingTexts = new Set(existing.map((r) => r.text));

  const rows = [
    ...truths
      .filter((text) => !existingTexts.has(text))
      .map((text) => ({
        guildId: null,
        type: "truth" as const,
        text,
        status: "approved" as const,
      })),
    ...dares
      .filter((text) => !existingTexts.has(text))
      .map((text) => ({
        guildId: null,
        type: "dare" as const,
        text,
        status: "approved" as const,
      })),
  ];

  if (rows.length === 0) {
    console.log(`Default prompts up to date (${existingTexts.size} built-ins in DB).`);
    return;
  }

  for (let i = 0; i < rows.length; i += INSERT_BATCH) {
    await db.insert(prompts).values(rows.slice(i, i + INSERT_BATCH));
  }

  console.log(
    `Seeded ${rows.length} new default prompts (${existingTexts.size} already existed, ${allTexts.length} in manifest).`,
  );
}

if (import.meta.main) {
  const { loadConfig } = await import("../config");
  const { closeDb } = await import("./client");
  await runSeed(loadConfig().DATABASE_URL);
  await closeDb();
}
