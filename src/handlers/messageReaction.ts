import type { Client, MessageReaction, PartialMessageReaction, User, PartialUser } from "discord.js";
import type { Database } from "../db/client";
import { isVoteEmoji } from "../services/dareVoting";
import { recalculateDareScoreForMessage } from "../services/dareVoteScoring";

export function registerMessageReactionHandler(client: Client, db: Database) {
  const handler = async (
    reaction: MessageReaction | PartialMessageReaction,
    user: User | PartialUser,
  ) => {
    try {
      if (user.bot) return;
      if (!isVoteEmoji(reaction.emoji.name)) return;

      if (reaction.partial) await reaction.fetch();
      const message = reaction.message.partial ? await reaction.message.fetch() : reaction.message;
      if (!message.guildId || !client.user) return;

      await recalculateDareScoreForMessage(db, message, client.user.id);
    } catch (err) {
      console.error("Message reaction handler error:", err);
    }
  };

  client.on("messageReactionAdd", handler);
  client.on("messageReactionRemove", handler);
}
