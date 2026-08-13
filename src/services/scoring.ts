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

  // Only log when someone uses Discord Reply — avoids noise from normal chat.
  if (msg.author.bot || !msg.guildId || !msg.reference?.messageId) {
    return false;
  }

  console.log(
    `Reply from ${msg.author.id} to ${msg.reference.messageId} (contentLen=${msg.content.length}, attachments=${msg.attachments.size})`,
  );

  const promptMsg = await getPromptMessageByDiscordId(db, msg.reference.messageId, msg.guildId);
  if (!promptMsg) {
    console.log(`Reply ignored: no prompt_messages row for message ${msg.reference.messageId}`);
    return false;
  }

  const isValid =
    promptMsg.type === "truth" ? hasValidTruthReply(msg) : hasValidDareAttachment(msg);

  if (!isValid) {
    console.log(
      `Reply ignored: invalid ${promptMsg.type} submission (need ${
        promptMsg.type === "truth" ? "non-empty text" : "image/video/audio attachment"
      })`,
    );
    return false;
  }

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
      await msg.react(THUMBS_UP).catch((err) => console.error("Failed to add 👍:", err));
      await msg.react(THUMBS_DOWN).catch((err) => console.error("Failed to add 👎:", err));
      console.log(`Dare scored for ${msg.author.id} on promptMessage ${promptMsg.id}`);
    } else {
      console.log(`Dare not scored for ${msg.author.id}: already scored this prompt or DB conflict`);
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
    await msg.react("✅").catch((err) => console.error("Failed to add ✅:", err));
    console.log(`Truth scored for ${msg.author.id} on promptMessage ${promptMsg.id}`);
  } else {
    console.log(`Truth not scored for ${msg.author.id}: already scored this prompt or DB conflict`);
  }
  return awarded;
}
