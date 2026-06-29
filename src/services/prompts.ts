import { eq, and, or, isNull, sql, notInArray } from "drizzle-orm";
import type { Database } from "../db/client";
import { prompts, blockedPrompts, promptCycleUsed, type Prompt } from "../db/schema";

export type PromptTypeFilter = "truth" | "dare" | "all";
export type PromptStatusFilter = "approved" | "pending" | "rejected" | "blocked" | "all";
export type PromptSourceFilter = "builtin" | "custom" | "all";
export type EffectiveStatus = "approved" | "pending" | "rejected" | "blocked";

export type PromptListFilters = {
  type: PromptTypeFilter;
  status: PromptStatusFilter;
  source: PromptSourceFilter;
};

export type PromptListItem = {
  id: number;
  type: "truth" | "dare";
  text: string;
  source: "builtin" | "custom";
  status: EffectiveStatus;
  submittedBy: string | null;
};

export type RemovePromptResult =
  | { ok: true; message: string }
  | { ok: false; message: string };

const LIST_PAGE_SIZE = 10;

export function getListPageSize() {
  return LIST_PAGE_SIZE;
}

export function truncatePromptText(text: string, max = 80) {
  return text.length <= max ? text : `${text.slice(0, max - 3)}...`;
}

async function getBlockedPromptIds(db: Database, guildId: string): Promise<Set<number>> {
  const rows = await db
    .select({ promptId: blockedPrompts.promptId })
    .from(blockedPrompts)
    .where(eq(blockedPrompts.guildId, guildId));
  return new Set(rows.map((r) => r.promptId));
}

function toListItem(prompt: Prompt, blockedIds: Set<number>): PromptListItem {
  const isBuiltin = prompt.guildId === null;
  return {
    id: prompt.id,
    type: prompt.type,
    text: prompt.text,
    source: isBuiltin ? "builtin" : "custom",
    status: isBuiltin
      ? blockedIds.has(prompt.id)
        ? "blocked"
        : "approved"
      : prompt.status,
    submittedBy: prompt.submittedBy,
  };
}

function matchesFilters(item: PromptListItem, filters: PromptListFilters): boolean {
  if (filters.type !== "all" && item.type !== filters.type) return false;
  if (filters.source !== "all" && item.source !== filters.source) return false;
  if (filters.status !== "all" && item.status !== filters.status) return false;
  return true;
}

async function getAllListItems(db: Database, guildId: string): Promise<PromptListItem[]> {
  const blockedIds = await getBlockedPromptIds(db, guildId);

  const rows = await db
    .select()
    .from(prompts)
    .where(or(isNull(prompts.guildId), eq(prompts.guildId, guildId)))
    .orderBy(prompts.id);

  return rows.map((row) => toListItem(row, blockedIds));
}

export async function listPromptsForGuild(
  db: Database,
  guildId: string,
  filters: PromptListFilters,
  page: number,
  pageSize = LIST_PAGE_SIZE,
): Promise<{ items: PromptListItem[]; total: number; page: number; totalPages: number }> {
  const all = (await getAllListItems(db, guildId)).filter((item) => matchesFilters(item, filters));
  const total = all.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;

  return {
    items: all.slice(start, start + pageSize),
    total,
    page: safePage,
    totalPages,
  };
}

export async function countPromptsForGuild(
  db: Database,
  guildId: string,
  filters: PromptListFilters,
): Promise<number> {
  const all = await getAllListItems(db, guildId);
  return all.filter((item) => matchesFilters(item, filters)).length;
}

function eligiblePromptConditions(
  guildId: string,
  type: "truth" | "dare",
  blockedArray: number[],
) {
  return and(
    eq(prompts.type, type),
    eq(prompts.status, "approved"),
    or(isNull(prompts.guildId), eq(prompts.guildId, guildId)),
    blockedArray.length > 0 ? notInArray(prompts.id, blockedArray) : undefined,
  );
}

async function getUsedPromptIds(
  db: Database,
  guildId: string,
  type: "truth" | "dare",
): Promise<number[]> {
  const rows = await db
    .select({ promptId: promptCycleUsed.promptId })
    .from(promptCycleUsed)
    .where(and(eq(promptCycleUsed.guildId, guildId), eq(promptCycleUsed.type, type)));
  return rows.map((r) => r.promptId);
}

async function clearPromptCycle(db: Database, guildId: string, type: "truth" | "dare") {
  await db
    .delete(promptCycleUsed)
    .where(and(eq(promptCycleUsed.guildId, guildId), eq(promptCycleUsed.type, type)));
}

async function markPromptUsedInCycle(
  db: Database,
  guildId: string,
  type: "truth" | "dare",
  promptId: number,
) {
  await db
    .insert(promptCycleUsed)
    .values({ guildId, type, promptId })
    .onConflictDoNothing();
}

async function pickFromPool(
  db: Database,
  guildId: string,
  type: "truth" | "dare",
  blockedArray: number[],
  excludeUsed: number[],
): Promise<Prompt | null> {
  const rows = await db
    .select()
    .from(prompts)
    .where(
      and(
        eligiblePromptConditions(guildId, type, blockedArray),
        excludeUsed.length > 0 ? notInArray(prompts.id, excludeUsed) : undefined,
      ),
    )
    .orderBy(sql`random()`)
    .limit(1);

  return rows[0] ?? null;
}

export async function pickRandomPrompt(
  db: Database,
  guildId: string,
  type: "truth" | "dare",
): Promise<Prompt | null> {
  const blockedIds = await getBlockedPromptIds(db, guildId);
  const blockedArray = [...blockedIds];

  const usedIds = await getUsedPromptIds(db, guildId, type);
  let prompt = await pickFromPool(db, guildId, type, blockedArray, usedIds);

  if (!prompt && usedIds.length > 0) {
    await clearPromptCycle(db, guildId, type);
    prompt = await pickFromPool(db, guildId, type, blockedArray, []);
  }

  if (!prompt) return null;

  await markPromptUsedInCycle(db, guildId, type, prompt.id);
  return prompt;
}

export async function submitPrompt(
  db: Database,
  guildId: string,
  type: "truth" | "dare",
  text: string,
  submittedBy: string,
) {
  const [row] = await db
    .insert(prompts)
    .values({
      guildId,
      type,
      text,
      status: "pending",
      submittedBy,
    })
    .returning();
  return row;
}

export async function getPendingPrompts(db: Database, guildId: string) {
  return db
    .select()
    .from(prompts)
    .where(and(eq(prompts.guildId, guildId), eq(prompts.status, "pending")))
    .orderBy(prompts.createdAt);
}

export async function reviewPrompt(
  db: Database,
  promptId: number,
  guildId: string,
  status: "approved" | "rejected",
  reviewedBy: string,
) {
  const [row] = await db
    .update(prompts)
    .set({ status, reviewedBy, updatedAt: new Date() })
    .where(and(eq(prompts.id, promptId), eq(prompts.guildId, guildId), eq(prompts.status, "pending")))
    .returning();
  return row ?? null;
}

export async function editPendingPrompt(
  db: Database,
  promptId: number,
  guildId: string,
  text: string,
): Promise<Prompt | null> {
  const trimmed = text.trim();
  if (!trimmed) return null;

  const [row] = await db
    .update(prompts)
    .set({ text: trimmed, updatedAt: new Date() })
    .where(and(eq(prompts.id, promptId), eq(prompts.guildId, guildId), eq(prompts.status, "pending")))
    .returning();
  return row ?? null;
}

export async function getPromptById(db: Database, promptId: number) {
  const rows = await db.select().from(prompts).where(eq(prompts.id, promptId)).limit(1);
  return rows[0] ?? null;
}

export async function isPromptBlocked(
  db: Database,
  guildId: string,
  promptId: number,
): Promise<boolean> {
  const [row] = await db
    .select({ id: blockedPrompts.id })
    .from(blockedPrompts)
    .where(and(eq(blockedPrompts.guildId, guildId), eq(blockedPrompts.promptId, promptId)))
    .limit(1);
  return !!row;
}

export async function removePrompt(
  db: Database,
  guildId: string,
  promptId: number,
  modUserId: string,
): Promise<RemovePromptResult> {
  const prompt = await getPromptById(db, promptId);
  if (!prompt) {
    return { ok: false, message: `Prompt #${promptId} not found.` };
  }

  if (prompt.guildId === null) {
    if (await isPromptBlocked(db, guildId, promptId)) {
      return { ok: false, message: `Built-in ${prompt.type} #${promptId} is already removed for this server.` };
    }

    await db.insert(blockedPrompts).values({
      guildId,
      promptId,
      blockedBy: modUserId,
    });

    return {
      ok: true,
      message: `Removed ${prompt.type} #${promptId} (built-in, blocked for this server).`,
    };
  }

  if (prompt.guildId !== guildId) {
    return { ok: false, message: `Prompt #${promptId} does not belong to this server.` };
  }

  if (prompt.status === "rejected") {
    return { ok: false, message: `${prompt.type} #${promptId} is already removed.` };
  }

  await db
    .update(prompts)
    .set({ status: "rejected", reviewedBy: modUserId, updatedAt: new Date() })
    .where(eq(prompts.id, promptId));

  return {
    ok: true,
    message: `Removed custom ${prompt.type} #${promptId}.`,
  };
}
