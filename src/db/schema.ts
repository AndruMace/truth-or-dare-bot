import {
  pgTable,
  serial,
  text,
  timestamp,
  integer,
  uniqueIndex,
  index,
  pgEnum,
} from "drizzle-orm/pg-core";

export const promptTypeEnum = pgEnum("prompt_type", ["truth", "dare"]);
export const promptStatusEnum = pgEnum("prompt_status", ["approved", "pending", "rejected"]);

export const prompts = pgTable(
  "prompts",
  {
    id: serial("id").primaryKey(),
    guildId: text("guild_id"),
    type: promptTypeEnum("type").notNull(),
    text: text("text").notNull(),
    status: promptStatusEnum("status").notNull().default("pending"),
    submittedBy: text("submitted_by"),
    reviewedBy: text("reviewed_by"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("prompts_guild_type_status_idx").on(table.guildId, table.type, table.status),
  ],
);

export const promptMessages = pgTable(
  "prompt_messages",
  {
    id: serial("id").primaryKey(),
    guildId: text("guild_id").notNull(),
    channelId: text("channel_id").notNull(),
    messageId: text("message_id").notNull(),
    promptId: integer("prompt_id")
      .notNull()
      .references(() => prompts.id),
    type: promptTypeEnum("type").notNull(),
    authorId: text("author_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("prompt_messages_message_id_idx").on(table.messageId),
    index("prompt_messages_guild_message_idx").on(table.guildId, table.messageId),
  ],
);

export const scoreEvents = pgTable(
  "score_events",
  {
    id: serial("id").primaryKey(),
    guildId: text("guild_id").notNull(),
    userId: text("user_id").notNull(),
    promptMessageId: integer("prompt_message_id")
      .notNull()
      .references(() => promptMessages.id),
    replyMessageId: text("reply_message_id").notNull(),
    points: integer("points").notNull(),
    type: promptTypeEnum("type").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("score_events_reply_message_id_idx").on(table.replyMessageId),
    uniqueIndex("score_events_user_prompt_message_idx").on(
      table.userId,
      table.promptMessageId,
    ),
    index("score_events_guild_created_idx").on(table.guildId, table.createdAt),
  ],
);

export const userScores = pgTable(
  "user_scores",
  {
    id: serial("id").primaryKey(),
    guildId: text("guild_id").notNull(),
    userId: text("user_id").notNull(),
    allTimePoints: integer("all_time_points").notNull().default(0),
    weeklyPoints: integer("weekly_points").notNull().default(0),
    weekStart: text("week_start").notNull(),
  },
  (table) => [
    uniqueIndex("user_scores_guild_user_idx").on(table.guildId, table.userId),
    index("user_scores_guild_all_time_idx").on(table.guildId, table.allTimePoints),
    index("user_scores_guild_weekly_idx").on(table.guildId, table.weeklyPoints),
  ],
);

export const blockedPrompts = pgTable(
  "blocked_prompts",
  {
    id: serial("id").primaryKey(),
    guildId: text("guild_id").notNull(),
    promptId: integer("prompt_id")
      .notNull()
      .references(() => prompts.id),
    blockedBy: text("blocked_by").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("blocked_prompts_guild_prompt_idx").on(table.guildId, table.promptId),
    index("blocked_prompts_guild_idx").on(table.guildId),
  ],
);

/** Tracks prompts already dealt this shuffle cycle (per guild + type). */
export const promptCycleUsed = pgTable(
  "prompt_cycle_used",
  {
    id: serial("id").primaryKey(),
    guildId: text("guild_id").notNull(),
    type: promptTypeEnum("type").notNull(),
    promptId: integer("prompt_id")
      .notNull()
      .references(() => prompts.id),
    usedAt: timestamp("used_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("prompt_cycle_used_guild_type_prompt_idx").on(
      table.guildId,
      table.type,
      table.promptId,
    ),
    index("prompt_cycle_used_guild_type_idx").on(table.guildId, table.type),
  ],
);

export type Prompt = typeof prompts.$inferSelect;
export type PromptMessage = typeof promptMessages.$inferSelect;
export type ScoreEvent = typeof scoreEvents.$inferSelect;
export type UserScore = typeof userScores.$inferSelect;
export type BlockedPrompt = typeof blockedPrompts.$inferSelect;
