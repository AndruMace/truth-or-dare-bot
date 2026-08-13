import { eq, and, isNull, inArray } from "drizzle-orm";
import { getDb } from "./client";
import { prompts } from "./schema";
import { loadDefaultPrompts } from "../data/prompts/manifest";

const INSERT_BATCH = 100;

export async function runSeed(databaseUrl: string) {
  const db = getDb(databaseUrl);
  const { truths, dares } = loadDefaultPrompts();
  const allTexts = [...truths, ...dares];
  const manifestSet = new Set(allTexts);

  const existing = await db
    .select({ id: prompts.id, text: prompts.text })
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

  for (let i = 0; i < rows.length; i += INSERT_BATCH) {
    await db.insert(prompts).values(rows.slice(i, i + INSERT_BATCH));
  }

  const staleIds = existing.filter((r) => !manifestSet.has(r.text)).map((r) => r.id);
  let retired = 0;
  for (let i = 0; i < staleIds.length; i += INSERT_BATCH) {
    const batch = staleIds.slice(i, i + INSERT_BATCH);
    await db
      .update(prompts)
      .set({ status: "rejected", updatedAt: new Date() })
      .where(and(isNull(prompts.guildId), inArray(prompts.id, batch)));
    retired += batch.length;
  }

  console.log(
    `Seeded ${rows.length} new default prompts; retired ${retired} removed built-ins (${allTexts.length} in manifest).`,
  );
}

if (import.meta.main) {
  const { loadConfig } = await import("../config");
  const { closeDb } = await import("./client");
  await runSeed(loadConfig().DATABASE_URL);
  await closeDb();
}
