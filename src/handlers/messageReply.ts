import type { Client, Message } from "discord.js";
import type { Database } from "../db/client";
import { processReply } from "../services/scoring";

export function registerMessageReplyHandler(client: Client, db: Database) {
  client.on("messageCreate", async (message: Message) => {
    try {
      await processReply(db, message);
    } catch (err) {
      console.error("Message reply handler error:", err);
    }
  });
}
