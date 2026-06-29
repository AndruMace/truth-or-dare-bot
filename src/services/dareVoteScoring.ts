import type { Message, PartialMessage, User } from "discord.js";
import { eq, and } from "drizzle-orm";
import type { Database } from "../db/client";
import { scoreEvents, userScores } from "../db/schema";
import { getWeekStart } from "../utils/week";
import {
  calculateDareVotePoints,
  THUMBS_UP,
  THUMBS_DOWN,
  DARE_DEFAULT_POINTS,
} from "./dareVoting";

async function countReactionUsers(
  message: Message | PartialMessage,
  emoji: string,
  excludeIds: Set<string>,
): Promise<number> {
  const reaction = message.reactions?.cache.find(
    (r) =>
      r.emoji.name === emoji ||
      (emoji === THUMBS_UP && r.emoji.name === "👍") ||
      (emoji === THUMBS_DOWN && r.emoji.name === "👎"),
  );
  if (!reaction) return 0;

  const users = await reaction.users.fetch();
  return users.filter((u: User) => !excludeIds.has(u.id)).size;
}

export async function countDareVotes(
  message: Message | PartialMessage,
  submitterId: string,
  botId: string,
): Promise<{ upVotes: number; downVotes: number }> {
  const exclude = new Set([submitterId, botId]);
  const [upVotes, downVotes] = await Promise.all([
    countReactionUsers(message, THUMBS_UP, exclude),
    countReactionUsers(message, THUMBS_DOWN, exclude),
  ]);
  return { upVotes, downVotes };
}

export async function updateDareScoreFromVotes(
  db: Database,
  replyMessageId: string,
  guildId: string,
  upVotes: number,
  downVotes: number,
): Promise<number | null> {
  const newPoints = calculateDareVotePoints(upVotes, downVotes);

  const [event] = await db
    .select()
    .from(scoreEvents)
    .where(and(eq(scoreEvents.replyMessageId, replyMessageId), eq(scoreEvents.guildId, guildId)))
    .limit(1);

  if (!event || event.type !== "dare") return null;

  if (event.points === newPoints) return newPoints;

  const delta = newPoints - event.points;
  const weekStart = getWeekStart();

  await db.transaction(async (tx) => {
    await tx
      .update(scoreEvents)
      .set({ points: newPoints })
      .where(eq(scoreEvents.id, event.id));

    const [existing] = await tx
      .select()
      .from(userScores)
      .where(and(eq(userScores.guildId, guildId), eq(userScores.userId, event.userId)))
      .limit(1);

    if (existing) {
      const weeklyPoints =
        existing.weekStart === weekStart
          ? Math.max(0, existing.weeklyPoints + delta)
          : Math.max(0, delta);

      await tx
        .update(userScores)
        .set({
          allTimePoints: Math.max(0, existing.allTimePoints + delta),
          weeklyPoints,
          weekStart,
        })
        .where(eq(userScores.id, existing.id));
    }
  });

  return newPoints;
}

export async function recalculateDareScoreForMessage(
  db: Database,
  message: Message | PartialMessage,
  botId: string,
): Promise<number | null> {
  if (!message.guildId) return null;

  const [event] = await db
    .select()
    .from(scoreEvents)
    .where(
      and(eq(scoreEvents.replyMessageId, message.id), eq(scoreEvents.guildId, message.guildId)),
    )
    .limit(1);

  if (!event || event.type !== "dare") return null;

  const { upVotes, downVotes } = await countDareVotes(message, event.userId, botId);
  return updateDareScoreFromVotes(db, message.id, message.guildId, upVotes, downVotes);
}

export { DARE_DEFAULT_POINTS };
