import type { Client, Interaction } from "discord.js";
import type { Database } from "../db/client";
import type { Config } from "../config";
import {
  handleTruthOrDare,
  handleLeaderboard,
  handleSubmitPrompt,
  handleReviewPrompts,
  handleListPrompts,
  handleRemovePrompt,
  handlePlayButton,
  handlePostInstructions,
} from "../commands/handlers";
import {
  assertMod,
  handleListPromptsButton,
  handleReviewPromptsButton,
  handleEditPromptButton,
  handleEditPromptModal,
  renderReviewPageAfterAction,
} from "../commands/promptAdmin";
import { reviewPrompt } from "../services/prompts";
import { replyInteractionError } from "../utils/interactionError";

export function registerInteractionHandler(client: Client, db: Database, config: Config) {
  client.on("interactionCreate", async (interaction: Interaction) => {
    try {
      if (interaction.isChatInputCommand()) {
        switch (interaction.commandName) {
          case "truth":
            await handleTruthOrDare(interaction, db, "truth");
            break;
          case "dare":
            await handleTruthOrDare(interaction, db, "dare");
            break;
          case "leaderboard":
            await handleLeaderboard(interaction, db, client);
            break;
          case "submit-truth":
            await handleSubmitPrompt(interaction, db, config, "truth");
            break;
          case "submit-dare":
            await handleSubmitPrompt(interaction, db, config, "dare");
            break;
          case "review-prompts":
            await handleReviewPrompts(interaction, db);
            break;
          case "list-prompts":
            await handleListPrompts(interaction, db);
            break;
          case "remove-prompt":
            await handleRemovePrompt(interaction, db);
            break;
          case "post-instructions":
            await handlePostInstructions(interaction);
            break;
        }
        return;
      }

      if (interaction.isButton() && interaction.guild) {
        const action = interaction.customId.split(":")[0];

        if (action === "play") {
          await handlePlayButton(interaction, db, client);
          return;
        }

        if (action === "promptlist") {
          await handleListPromptsButton(interaction, db);
          return;
        }

        if (action === "promptreview") {
          await handleReviewPromptsButton(interaction, db);
          return;
        }

        if (action === "edit") {
          await handleEditPromptButton(interaction, db);
          return;
        }

        if (action === "approve" || action === "reject") {
          if (!assertMod(interaction)) {
            await interaction.reply({
              content: "You need Manage Messages to review prompts.",
              ephemeral: true,
            });
            return;
          }

          const parts = interaction.customId.split(":");
          const promptId = Number(parts[1]);
          const page = Number(parts[2]) || 1;
          if (!promptId) return;

          const status = action === "approve" ? "approved" : "rejected";
          const updated = await reviewPrompt(
            db,
            promptId,
            interaction.guild.id,
            status,
            interaction.user.id,
          );

          if (!updated) {
            await interaction.reply({ content: "Prompt not found or already reviewed.", ephemeral: true });
            return;
          }

          const refreshed = await renderReviewPageAfterAction(db, interaction.guild.id, page);
          await interaction.update({
            content: refreshed.content ?? null,
            embeds: refreshed.embeds,
            components: refreshed.components,
          });
        }
        return;
      }

      if (interaction.isModalSubmit()) {
        if (interaction.customId.startsWith("edit-prompt-modal:")) {
          await handleEditPromptModal(interaction, db);
        }
        return;
      }
    } catch (err) {
      console.error("Interaction error:", err);
      await replyInteractionError(interaction);
    }
  });
}
