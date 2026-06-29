import { loadConfig } from "./config";
import { createClient } from "./bot/client";
import { getDb, closeDb } from "./db/client";
import { registerInteractionHandler } from "./handlers/interactions";
import { registerMessageReplyHandler } from "./handlers/messageReply";
import { registerMessageReactionHandler } from "./handlers/messageReaction";

const config = loadConfig();
const db = getDb(config.DATABASE_URL);
const client = createClient();

registerInteractionHandler(client, db, config);
registerMessageReplyHandler(client, db);
registerMessageReactionHandler(client, db);

client.once("ready", () => {
  console.log(`Logged in as ${client.user?.tag}`);
});

process.on("SIGINT", async () => {
  console.log("Shutting down...");
  client.destroy();
  await closeDb();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  client.destroy();
  await closeDb();
  process.exit(0);
});

await client.login(config.DISCORD_TOKEN);
