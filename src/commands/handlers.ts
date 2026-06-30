import {
  EmbedBuilder,
  SlashCommandBuilder,
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  type ChatInputCommandInteraction,
  type ButtonInteraction,
  type Client,
} from "discord.js";
import type { Database } from "../db/client";
import { promptMessages } from "../db/schema";
import { pickRandomPrompt, submitPrompt } from "../services/prompts";
import { getAllTimeLeaderboard, getWeeklyLeaderboard } from "../services/leaderboard";
import { TRUTH_POINTS } from "../services/scoring";
import {
  DARE_DEFAULT_POINTS,
  DARE_VOTE_BONUS,
} from "../services/dareVoting";
import type { Config } from "../config";

export {
  handleListPrompts,
  handleReviewPrompts,
  handleRemovePrompt,
} from "./promptAdmin";

export const commands = [
  new SlashCommandBuilder().setName("truth").setDescription("Get a random truth prompt"),
  new SlashCommandBuilder().setName("dare").setDescription("Get a random dare prompt"),
  new SlashCommandBuilder()
    .setName("leaderboard")
    .setDescription("View the server leaderboard")
    .addStringOption((opt) =>
      opt
        .setName("period")
        .setDescription("Leaderboard period")
        .addChoices(
          { name: "All-time", value: "all-time" },
          { name: "Weekly", value: "weekly" },
        ),
    )
    .addIntegerOption((opt) =>
      opt
        .setName("limit")
        .setDescription("Number of players to show (default 10)")
        .setMinValue(1)
        .setMaxValue(25),
    ),
  new SlashCommandBuilder()
    .setName("submit-truth")
    .setDescription("Submit a custom truth for mod approval")
    .addStringOption((opt) =>
      opt.setName("text").setDescription("The truth prompt").setRequired(true).setMaxLength(500),
    ),
  new SlashCommandBuilder()
    .setName("submit-dare")
    .setDescription("Submit a custom dare for mod approval")
    .addStringOption((opt) =>
      opt.setName("text").setDescription("The dare prompt").setRequired(true).setMaxLength(500),
    ),
  new SlashCommandBuilder()
    .setName("review-prompts")
    .setDescription("Review pending custom prompts (mods only)")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
  new SlashCommandBuilder()
    .setName("list-prompts")
    .setDescription("Browse all prompts for this server (mods only)")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addStringOption((opt) =>
      opt
        .setName("type")
        .setDescription("Filter by type")
        .addChoices(
          { name: "All", value: "all" },
          { name: "Truth", value: "truth" },
          { name: "Dare", value: "dare" },
        ),
    )
    .addStringOption((opt) =>
      opt
        .setName("status")
        .setDescription("Filter by status")
        .addChoices(
          { name: "All", value: "all" },
          { name: "Approved", value: "approved" },
          { name: "Pending", value: "pending" },
          { name: "Rejected", value: "rejected" },
          { name: "Blocked", value: "blocked" },
        ),
    )
    .addStringOption((opt) =>
      opt
        .setName("source")
        .setDescription("Filter by source")
        .addChoices(
          { name: "All", value: "all" },
          { name: "Built-in", value: "builtin" },
          { name: "Custom", value: "custom" },
        ),
    )
    .addIntegerOption((opt) =>
      opt.setName("page").setDescription("Page number (default 1)").setMinValue(1),
    ),
  new SlashCommandBuilder()
    .setName("remove-prompt")
    .setDescription("Remove a prompt from this server (mods only)")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addIntegerOption((opt) =>
      opt.setName("id").setDescription("Prompt ID from /list-prompts").setRequired(true),
    ),
  new SlashCommandBuilder()
    .setName("post-instructions")
    .setDescription("Post the game instructions and play buttons in this channel (mods only)")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
].map((c) => c.toJSON());

export function buildInstructionsEmbed(): EmbedBuilder {
  return new EmbedBuilder()
    .setTitle("Truth or Dare")
    .setColor(0x5865f2)
    .setDescription(
      "Play truths and dares to earn points and climb the server leaderboard!",
    )
    .addFields(
      {
        name: "Truth",
        value: `${TRUTH_POINTS} point — reply to the prompt with text.`,
      },
      {
        name: "Dare",
        value: [
          "Reply to the dare with an image, video, or audio proof.",
          "The bot adds 👍/👎 — **everyone votes on your proof:**",
          `• **${DARE_DEFAULT_POINTS} pts** if no votes or votes tie`,
          `• **+${DARE_VOTE_BONUS} pts** for each extra 👍 over 👎`,
          "• More 👎 than 👍 = **0 pts**",
        ].join("\n"),
      },
      {
        name: "Suggest prompts",
        value: [
          "• `/submit-truth text:your prompt here`",
          "• `/submit-dare text:your prompt here`",
        ].join("\n"),
      },
    )
    .setFooter({ text: "Use the buttons below to play" });
}

export function buildInstructionsComponents(): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("play:truth")
      .setLabel("Truth")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId("play:dare")
      .setLabel("Dare")
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId("play:leaderboard")
      .setLabel("Leaderboard")
      .setStyle(ButtonStyle.Secondary),
  );
}

type PlayInteraction = ChatInputCommandInteraction | ButtonInteraction;

async function runTruthOrDare(interaction: PlayInteraction, db: Database, type: "truth" | "dare") {
  if (!interaction.guild || !interaction.channelId) {
    await interaction.reply({ content: "This can only be used in a server channel.", ephemeral: true });
    return;
  }

  await interaction.deferReply();

  const prompt = await pickRandomPrompt(db, interaction.guild.id, type);
  if (!prompt) {
    await interaction.editReply(`No ${type} prompts available yet.`);
    return;
  }

  const scoringHint =
    type === "truth"
      ? `Reply with text to earn ${TRUTH_POINTS} point`
      : `Reply with media, then community votes with 👍/👎 (${DARE_DEFAULT_POINTS} pts base; +${DARE_VOTE_BONUS} per extra 👍)`;

  const embed = new EmbedBuilder()
    .setTitle(type === "truth" ? "Truth" : "Dare")
    .setDescription(prompt.text)
    .setColor(type === "truth" ? 0x3498db : 0xe74c3c)
    .setFooter({ text: `Prompt #${prompt.id} · ${scoringHint}` });

  const message = await interaction.editReply({ embeds: [embed] });

  await db.insert(promptMessages).values({
      guildId: interaction.guild.id,
      channelId: interaction.channelId,
      messageId: message.id,
      promptId: prompt.id,
      type,
      authorId: interaction.user.id,
    });

  await interaction.editReply({
    embeds: [embed],
    components: [buildInstructionsComponents()],
  });
}

export async function handleTruthOrDare(
  interaction: ChatInputCommandInteraction,
  db: Database,
  type: "truth" | "dare",
) {
  await runTruthOrDare(interaction, db, type);
}

export async function handlePlayButton(
  interaction: ButtonInteraction,
  db: Database,
  client: Client,
) {
  const action = interaction.customId.split(":")[1];
  if (action === "truth" || action === "dare") {
    await runTruthOrDare(interaction, db, action);
    return;
  }
  if (action === "leaderboard") {
    await runLeaderboard(interaction, db, client, "all-time", 10);
  }
}

export async function handlePostInstructions(
  interaction: ChatInputCommandInteraction,
) {
  if (!interaction.guild || !interaction.channel?.isSendable()) {
    await interaction.reply({ content: "This command can only be used in a server channel.", ephemeral: true });
    return;
  }

  const member = interaction.member;
  const isMod =
    member &&
    "permissions" in member &&
    typeof member.permissions !== "string" &&
    member.permissions.has(PermissionFlagsBits.ManageMessages);

  if (!isMod) {
    await interaction.reply({ content: "You need Manage Messages to post instructions.", ephemeral: true });
    return;
  }

  await interaction.reply({
    embeds: [buildInstructionsEmbed()],
    components: [buildInstructionsComponents()],
  });
}

async function formatLeaderboard(
  client: Client,
  guildId: string,
  entries: { userId: string; points: number; rank: number }[],
  title: string,
): Promise<EmbedBuilder> {
  const embed = new EmbedBuilder().setTitle(title).setColor(0xf1c40f);

  if (entries.length === 0) {
    embed.setDescription("No scores yet. Play some truths and dares!");
    return embed;
  }

  const guild = client.guilds.cache.get(guildId);
  const lines = await Promise.all(
    entries.map(async (entry) => {
      const member = guild
        ? await guild.members.fetch(entry.userId).catch(() => null)
        : null;
      const name = member?.displayName ?? `<@${entry.userId}>`;
      const medal =
        entry.rank === 1 ? "🥇" : entry.rank === 2 ? "🥈" : entry.rank === 3 ? "🥉" : `${entry.rank}.`;
      return `${medal} **${name}** — ${entry.points} pts`;
    }),
  );

  embed.setDescription(lines.join("\n"));
  return embed;
}

export async function handleLeaderboard(
  interaction: ChatInputCommandInteraction,
  db: Database,
  client: Client,
) {
  if (!interaction.guild) {
    await interaction.reply({ content: "This command can only be used in a server.", ephemeral: true });
    return;
  }

  const period = interaction.options.getString("period") ?? "all-time";
  const limit = interaction.options.getInteger("limit") ?? 10;
  await runLeaderboard(interaction, db, client, period, limit);
}

async function runLeaderboard(
  interaction: ChatInputCommandInteraction | ButtonInteraction,
  db: Database,
  client: Client,
  period: string,
  limit: number,
) {
  if (!interaction.guild) {
    await interaction.reply({ content: "This command can only be used in a server.", ephemeral: true });
    return;
  }

  await interaction.deferReply();

  if (period === "weekly") {
    const entries = await getWeeklyLeaderboard(db, interaction.guild.id, limit);
    const embed = await formatLeaderboard(client, interaction.guild.id, entries, "Weekly Leaderboard");
    await interaction.editReply({ embeds: [embed] });
  } else {
    const entries = await getAllTimeLeaderboard(db, interaction.guild.id, limit);
    const embed = await formatLeaderboard(client, interaction.guild.id, entries, "All-Time Leaderboard");
    await interaction.editReply({ embeds: [embed] });
  }
}

export async function handleSubmitPrompt(
  interaction: ChatInputCommandInteraction,
  db: Database,
  config: Config,
  type: "truth" | "dare",
) {
  if (!interaction.guild) {
    await interaction.reply({ content: "This command can only be used in a server.", ephemeral: true });
    return;
  }

  const text = interaction.options.getString("text", true);
  const prompt = await submitPrompt(db, interaction.guild.id, type, text, interaction.user.id);

  await interaction.reply({
    content: `Your ${type} has been submitted for review (ID: ${prompt.id}).`,
    ephemeral: true,
  });

  if (config.MOD_LOG_CHANNEL_ID) {
    const channel = interaction.guild.channels.cache.get(config.MOD_LOG_CHANNEL_ID);
    if (channel?.isSendable()) {
      const embed = new EmbedBuilder()
        .setTitle(`New ${type} submission`)
        .setDescription(text)
        .addFields(
          { name: "Submitted by", value: `<@${interaction.user.id}>`, inline: true },
          { name: "ID", value: String(prompt.id), inline: true },
        )
        .setColor(0x9b59b6);
      await channel.send({ embeds: [embed] }).catch(() => {});
    }
  }
}
