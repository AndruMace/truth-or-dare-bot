import { REST, Routes } from "discord.js";
import { loadConfig } from "../config";
import { commands } from "../commands/handlers";

const config = loadConfig();
const rest = new REST().setToken(config.DISCORD_TOKEN);

console.log("Registering slash commands...");

if (config.GUILD_ID) {
  await rest.put(Routes.applicationGuildCommands(config.CLIENT_ID, config.GUILD_ID), {
    body: commands,
  });
  console.log(`Registered ${commands.length} guild commands.`);
} else {
  await rest.put(Routes.applicationCommands(config.CLIENT_ID), { body: commands });
  console.log(`Registered ${commands.length} global commands.`);
}
