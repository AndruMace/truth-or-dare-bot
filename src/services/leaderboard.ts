import { eq, and, desc } from "drizzle-orm";
import type { Database } from "../db/client";
import { userScores } from "../db/schema";
import { getWeekStart } from "../utils/week";

export type LeaderboardEntry = {
  userId: string;
  points: number;
  rank: number;
};

export async function getAllTimeLeaderboard(
  db: Database,
  guildId: string,
  limit: number,
): Promise<LeaderboardEntry[]> {
  const rows = await db
    .select()
    .from(userScores)
    .where(eq(userScores.guildId, guildId))
    .orderBy(desc(userScores.allTimePoints))
    .limit(limit);

  return rows.map((row, i) => ({
    userId: row.userId,
    points: row.allTimePoints,
    rank: i + 1,
  }));
}

export async function getWeeklyLeaderboard(
  db: Database,
  guildId: string,
  limit: number,
): Promise<LeaderboardEntry[]> {
  const currentWeek = getWeekStart();
  const rows = await db
    .select()
    .from(userScores)
    .where(and(eq(userScores.guildId, guildId), eq(userScores.weekStart, currentWeek)))
    .orderBy(desc(userScores.weeklyPoints))
    .limit(limit);

  return rows.map((row, i) => ({
    userId: row.userId,
    points: row.weeklyPoints,
    rank: i + 1,
  }));
}
