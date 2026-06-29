import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  type ChatInputCommandInteraction,
  type ButtonInteraction,
  type ModalSubmitInteraction,
} from "discord.js";
import type { Database } from "../db/client";
import {
  listPromptsForGuild,
  getPendingPrompts,
  removePrompt,
  editPendingPrompt,
  getPromptById,
  truncatePromptText,
  type PromptListFilters,
  type PromptListItem,
  type PromptTypeFilter,
  type PromptStatusFilter,
  type PromptSourceFilter,
} from "../services/prompts";
import type { Prompt } from "../db/schema";

export function assertMod(
  interaction: ChatInputCommandInteraction | ButtonInteraction | ModalSubmitInteraction,
): boolean {
  const member = interaction.member;
  if (!member || !("permissions" in member) || typeof member.permissions === "string") {
    return false;
  }
  return member.permissions.has(PermissionFlagsBits.ManageMessages);
}

export function parseListFilters(
  type: string | null,
  status: string | null,
  source: string | null,
): PromptListFilters {
  return {
    type: (type ?? "all") as PromptTypeFilter,
    status: (status ?? "all") as PromptStatusFilter,
    source: (source ?? "all") as PromptSourceFilter,
  };
}

export function parsePromptListCustomId(customId: string): {
  guildId: string;
  page: number;
  filters: PromptListFilters;
} | null {
  const parts = customId.split(":");
  if (parts[0] !== "promptlist" || parts.length !== 6) return null;
  return {
    guildId: parts[1]!,
    page: Number(parts[2]),
    filters: parseListFilters(parts[3], parts[4], parts[5]),
  };
}

export function parsePromptReviewCustomId(customId: string): {
  guildId: string;
  page: number;
} | null {
  const parts = customId.split(":");
  if (parts[0] !== "promptreview" || parts.length !== 3) return null;
  return { guildId: parts[1]!, page: Number(parts[2]) };
}

export function buildListCustomId(
  guildId: string,
  page: number,
  filters: PromptListFilters,
): string {
  return `promptlist:${guildId}:${page}:${filters.type}:${filters.status}:${filters.source}`;
}

export function buildReviewCustomId(guildId: string, page: number): string {
  return `promptreview:${guildId}:${page}`;
}

function formatListEntry(item: PromptListItem): string {
  const source = item.source === "builtin" ? "Built-in" : "Custom";
  return `**#${item.id}** · ${item.type} · ${item.status} · ${source}\n${truncatePromptText(item.text)}`;
}

export function buildListEmbed(
  filters: PromptListFilters,
  items: PromptListItem[],
  page: number,
  totalPages: number,
  total: number,
): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setTitle("Prompt list")
    .setColor(0x9b59b6)
    .setFooter({ text: `Page ${page} of ${totalPages} — ${total} total` });

  const filterLine = `Type: **${filters.type}** · Status: **${filters.status}** · Source: **${filters.source}**`;
  if (items.length === 0) {
    embed.setDescription(`${filterLine}\n\nNo prompts match these filters.`);
    return embed;
  }

  embed.setDescription(`${filterLine}\n\n${items.map(formatListEntry).join("\n\n")}`);
  return embed;
}

export function buildListComponents(
  guildId: string,
  page: number,
  totalPages: number,
  filters: PromptListFilters,
): ActionRowBuilder<ButtonBuilder>[] {
  return [
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(buildListCustomId(guildId, page - 1, filters))
        .setLabel("Previous")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(page <= 1),
      new ButtonBuilder()
        .setCustomId(buildListCustomId(guildId, page + 1, filters))
        .setLabel("Next")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(page >= totalPages),
    ),
  ];
}

export function buildReviewEmbed(prompt: Prompt, index: number, total: number): EmbedBuilder {
  return new EmbedBuilder()
    .setTitle(`Pending ${prompt.type} (#${prompt.id})`)
    .setDescription(prompt.text)
    .addFields({
      name: "Submitted by",
      value: prompt.submittedBy ? `<@${prompt.submittedBy}>` : "Unknown",
    })
    .setColor(0x9b59b6)
    .setFooter({ text: `Pending ${index} of ${total}` });
}

export function buildReviewComponents(
  guildId: string,
  promptId: number,
  page: number,
  totalPages: number,
): ActionRowBuilder<ButtonBuilder>[] {
  return [
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`approve:${promptId}:${page}`)
        .setLabel("Approve")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`reject:${promptId}:${page}`)
        .setLabel("Reject")
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId(`edit:${promptId}:${page}`)
        .setLabel("Edit")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(buildReviewCustomId(guildId, page - 1))
        .setLabel("Previous")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(page <= 1),
    ),
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(buildReviewCustomId(guildId, page + 1))
        .setLabel("Next")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(page >= totalPages),
    ),
  ];
}

export async function renderListPage(
  db: Database,
  guildId: string,
  filters: PromptListFilters,
  page: number,
) {
  const result = await listPromptsForGuild(db, guildId, filters, page);
  return {
    embed: buildListEmbed(filters, result.items, result.page, result.totalPages, result.total),
    components: buildListComponents(guildId, result.page, result.totalPages, filters),
  };
}

export async function renderReviewPage(db: Database, guildId: string, page: number) {
  const pending = await getPendingPrompts(db, guildId);
  const total = pending.length;
  const totalPages = Math.max(1, total);

  if (total === 0) {
    return {
      embed: new EmbedBuilder()
        .setTitle("Pending prompts")
        .setDescription("No pending prompts to review.")
        .setColor(0x9b59b6),
      components: [] as ActionRowBuilder<ButtonBuilder>[],
    };
  }

  const safePage = Math.min(Math.max(1, page), totalPages);
  const prompt = pending[safePage - 1]!;

  return {
    embed: buildReviewEmbed(prompt, safePage, total),
    components: buildReviewComponents(guildId, prompt.id, safePage, totalPages),
  };
}

export async function handleListPrompts(
  interaction: ChatInputCommandInteraction,
  db: Database,
) {
  if (!interaction.guild) {
    await interaction.reply({ content: "This command can only be used in a server.", ephemeral: true });
    return;
  }
  if (!assertMod(interaction)) {
    await interaction.reply({ content: "You need Manage Messages to use this command.", ephemeral: true });
    return;
  }

  const filters = parseListFilters(
    interaction.options.getString("type"),
    interaction.options.getString("status"),
    interaction.options.getString("source"),
  );
  const page = interaction.options.getInteger("page") ?? 1;

  const { embed, components } = await renderListPage(db, interaction.guild.id, filters, page);
  await interaction.reply({ embeds: [embed], components, ephemeral: true });
}

export async function handleListPromptsButton(interaction: ButtonInteraction, db: Database) {
  if (!interaction.guild) return;
  if (!assertMod(interaction)) {
    await interaction.reply({ content: "You need Manage Messages to use this.", ephemeral: true });
    return;
  }

  const parsed = parsePromptListCustomId(interaction.customId);
  if (!parsed || parsed.guildId !== interaction.guild.id) return;

  const { embed, components } = await renderListPage(
    db,
    interaction.guild.id,
    parsed.filters,
    parsed.page,
  );
  await interaction.update({ embeds: [embed], components });
}

export async function handleReviewPrompts(
  interaction: ChatInputCommandInteraction,
  db: Database,
) {
  if (!interaction.guild) {
    await interaction.reply({ content: "This command can only be used in a server.", ephemeral: true });
    return;
  }
  if (!assertMod(interaction)) {
    await interaction.reply({ content: "You need Manage Messages to review prompts.", ephemeral: true });
    return;
  }

  const { embed, components } = await renderReviewPage(db, interaction.guild.id, 1);
  await interaction.reply({ embeds: [embed], components, ephemeral: true });
}

export async function handleReviewPromptsButton(interaction: ButtonInteraction, db: Database) {
  if (!interaction.guild) return;
  if (!assertMod(interaction)) {
    await interaction.reply({ content: "You need Manage Messages to review prompts.", ephemeral: true });
    return;
  }

  const parsed = parsePromptReviewCustomId(interaction.customId);
  if (!parsed || parsed.guildId !== interaction.guild.id) return;

  const { embed, components } = await renderReviewPage(db, interaction.guild.id, parsed.page);
  await interaction.update({ embeds: [embed], components });
}

export async function handleRemovePrompt(
  interaction: ChatInputCommandInteraction,
  db: Database,
) {
  if (!interaction.guild) {
    await interaction.reply({ content: "This command can only be used in a server.", ephemeral: true });
    return;
  }
  if (!assertMod(interaction)) {
    await interaction.reply({ content: "You need Manage Messages to remove prompts.", ephemeral: true });
    return;
  }

  const id = interaction.options.getInteger("id", true);
  const result = await removePrompt(db, interaction.guild.id, id, interaction.user.id);
  await interaction.reply({
    content: result.message,
    ephemeral: true,
  });
}

export async function renderReviewPageAfterAction(db: Database, guildId: string, page: number) {
  const pending = await getPendingPrompts(db, guildId);
  if (pending.length === 0) {
    return {
      content: "Queue empty — no more pending prompts.",
      embeds: [] as EmbedBuilder[],
      components: [] as ActionRowBuilder<ButtonBuilder>[],
    };
  }

  const totalPages = pending.length;
  const safePage = Math.min(page, totalPages);
  const { embed, components } = await renderReviewPage(db, guildId, safePage);
  return { embeds: [embed], components };
}

export async function handleEditPromptButton(interaction: ButtonInteraction, db: Database) {
  if (!interaction.guild) return;
  if (!assertMod(interaction)) {
    await interaction.reply({ content: "You need Manage Messages to edit prompts.", ephemeral: true });
    return;
  }

  const parts = interaction.customId.split(":");
  const promptId = Number(parts[1]);
  const page = Number(parts[2]) || 1;
  if (!promptId) return;

  const prompt = await getPromptById(db, promptId);
  if (!prompt || prompt.guildId !== interaction.guild.id || prompt.status !== "pending") {
    await interaction.reply({ content: "This prompt cannot be edited.", ephemeral: true });
    return;
  }

  const modal = new ModalBuilder()
    .setCustomId(`edit-prompt-modal:${promptId}:${page}`)
    .setTitle(`Edit ${prompt.type} #${prompt.id}`)
    .addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId("text")
          .setLabel("Prompt text")
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(true)
          .setMaxLength(500)
          .setValue(prompt.text),
      ),
    );

  await interaction.showModal(modal);
}

export async function handleEditPromptModal(interaction: ModalSubmitInteraction, db: Database) {
  if (!interaction.guild) return;
  if (!assertMod(interaction)) {
    await interaction.reply({ content: "You need Manage Messages to edit prompts.", ephemeral: true });
    return;
  }

  const parts = interaction.customId.replace("edit-prompt-modal:", "").split(":");
  const promptId = Number(parts[0]);
  const page = Number(parts[1]) || 1;
  if (!promptId) return;

  const text = interaction.fields.getTextInputValue("text");
  const updated = await editPendingPrompt(db, promptId, interaction.guild.id, text);

  if (!updated) {
    await interaction.reply({
      content: "Could not update prompt. It may no longer be pending or the text was empty.",
      ephemeral: true,
    });
    return;
  }

  const refreshed = await renderReviewPage(db, interaction.guild.id, page);

  if (interaction.message?.editable) {
    await interaction.message.edit({
      content: null,
      embeds: [refreshed.embed],
      components: refreshed.components,
    });
    await interaction.reply({ content: "Prompt text updated.", ephemeral: true });
    return;
  }

  await interaction.reply({
    embeds: [refreshed.embed],
    components: refreshed.components,
    ephemeral: true,
  });
}
