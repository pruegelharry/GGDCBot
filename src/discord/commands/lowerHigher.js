import { SlashCommandBuilder } from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("gamble")
  .setDescription("Lets you gamble your xp");
export async function execute(interaction) {
  await interaction.reply("Test");
}
