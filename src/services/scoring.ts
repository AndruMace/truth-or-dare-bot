import { eq, and } from "drizzle-orm";
import type { Message } from "discord.js";
import type { Database } from "../db/client";
import { promptMessages, scoreEvents, userScores, type PromptMessage } from "../db/schema";
import { getWeekStart } from "../utils/week";
import { DARE_DEFAULT_POINTS, THUMBS_UP, THUMBS_DOWN } from "./dareVoting";

export const TRUTH_POINTS = 1;

const MEDIA_EXTENSIONS = /\.(png|jpe?g|gif|webp|bmp|mp4|webm|mov|avi|mkv|mp3|wav|ogg|m4a|flac)$/i;

function hasValidDareAttachment(message: Message): boolean {
  if (message.attachments.size === 0) return false;

  for (const attachment of message.attachments.values()) {
    const contentType = attachment.contentType ?? "";
    if (
      contentType.startsWith("image/") ||
      contentType.startsWith("video/") ||
      contentType.startsWith("audio/")
    ) {
      return true;
    }
    if (MEDIA_EXTENSIONS.test(attachment.name ?? "")) {
      return true;
    }
  }
  return false;
}

function hasValidTruthReply(message: Message): boolean {
  return message.content.trim().length > 0;
}

export async function getPromptMessageById(
  db: Database,
  id: number,
  guildId: string,
): Promise<PromptMessage | null> {
  const [row] = await db
    .select()
    .from(promptMessages)
    .where(and(eq(promptMessages.id, id), eq(promptMessages.guildId, guildId)))
    .limit(1);
  return row ?? null;
}

export async function getPromptMessageByDiscordId(
  db: Database,
  messageId: string,
  guildId: string,
): Promise<PromptMessage | null> {
  const [row] = await db
    .select()
    .from(promptMessages)
    .where(and(eq(promptMessages.messageId, messageId), eq(promptMessages.guildId, guildId)))
    .limit(1);
  return row ?? null;
}

export async function awardScore(
  db: Database,
  params: {
    guildId: string;
    userId: string;
    promptMessageId: number;
    sourceId: string;
    points: number;
    type: "truth" | "dare";
  },
): Promise<boolean> {
  const weekStart = getWeekStart();

  try {
    await db.transaction(async (tx) => {
      await tx.insert(scoreEvents).values({
        guildId: params.guildId,
        userId: params.userId,
        promptMessageId: params.promptMessageId,
        replyMessageId: params.sourceId,
        points: params.points,
        type: params.type,
      });

      const [existing] = await tx
        .select()
        .from(userScores)
        .where(
          and(eq(userScores.guildId, params.guildId), eq(userScores.userId, params.userId)),
        )
        .limit(1);

      if (existing) {
        const weeklyPoints =
          existing.weekStart === weekStart ? existing.weeklyPoints + params.points : params.points;

        await tx
          .update(userScores)
          .set({
            allTimePoints: existing.allTimePoints + params.points,
            weeklyPoints,
            weekStart,
          })
          .where(eq(userScores.id, existing.id));
      } else {
        await tx.insert(userScores).values({
          guildId: params.guildId,
          userId: params.userId,
          allTimePoints: params.points,
          weeklyPoints: params.points,
          weekStart,
        });
      }
    });
    return true;
  } catch (err: unknown) {
    const pgErr = err as { code?: string };
    if (pgErr.code === "23505") return false;
    throw err;
  }
}

export async function processReply(db: Database, message: Message): Promise<boolean> {
  let msg = message;
  if (msg.partial) {
    try {
      msg = await msg.fetch();
    } catch {
      return false;
    }
  }

  if (msg.author.bot || !msg.guildId || !msg.reference?.messageId) {
    return false;
  }

  const promptMsg = await getPromptMessageByDiscordId(db, msg.reference.messageId, msg.guildId);
  if (!promptMsg) return false;

  const isValid =
    promptMsg.type === "truth" ? hasValidTruthReply(msg) : hasValidDareAttachment(msg);

  if (!isValid) return false;

  if (promptMsg.type === "dare") {
    const awarded = await awardScore(db, {
      guildId: msg.guildId,
      userId: msg.author.id,
      promptMessageId: promptMsg.id,
      sourceId: msg.id,
      points: DARE_DEFAULT_POINTS,
      type: "dare",
    });

    if (awarded) {
      await msg.react(THUMBS_UP).catch(() => {});
      await msg.react(THUMBS_DOWN).catch(() => {});
    }
    return awarded;
  }

  const awarded = await awardScore(db, {
    guildId: msg.guildId,
    userId: msg.author.id,
    promptMessageId: promptMsg.id,
    sourceId: msg.id,
    points: TRUTH_POINTS,
    type: "truth",
  });

  if (awarded) {
    await msg.react("✅").catch(() => {});
  }
  return awarded;
}

export async function awardTruthAnswer(
  db: Database,
  guildId: string,
  userId: string,
  promptMessageId: number,
  sourceId: string,
  answer: string,
): Promise<{ awarded: boolean; reason?: string }> {
  if (!answer.trim()) {
    return { awarded: false, reason: "Answer cannot be empty." };
  }

  const promptMsg = await getPromptMessageById(db, promptMessageId, guildId);
  if (!promptMsg) {
    return { awarded: false, reason: "This prompt is no longer active." };
  }
  if (promptMsg.type !== "truth") {
    return { awarded: false, reason: "This button is only for truth prompts." };
  }

  const awarded = await awardScore(db, {
    guildId,
    userId,
    promptMessageId: promptMsg.id,
    sourceId,
    points: TRUTH_POINTS,
    type: "truth",
  });

  if (!awarded) {
    return { awarded: false, reason: "You already submitted an answer for this truth." };
  }
  return { awarded: true };
}
