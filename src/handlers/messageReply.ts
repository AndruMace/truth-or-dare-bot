import type { Client, Message } from "discord.js";
import type { Database } from "../db/client";
import { processReply } from "../services/scoring";

export function registerMessageReplyHandler(client: Client, db: Database) {
  client.on("messageCreate", async (message: Message) => {
    try {
      // Temporary diagnostics: confirm gateway delivery after outages / intent issues.
      if (!message.author.bot && message.guildId) {
        console.log(
          `messageCreate guild=${message.guildId} channel=${message.channelId} ` +
            `ref=${message.reference?.messageId ?? "none"} contentLen=${message.content.length}`,
        );
      }
      await processReply(db, message);
    } catch (err) {
      console.error("Message reply handler error:", err);
    }
  });
}
