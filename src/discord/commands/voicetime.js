import { SlashCommandBuilder } from "discord.js";
import { getMemberById } from "../../pocketbase/records/member.js";
import { logger } from "../../logger.js";

export const data = new SlashCommandBuilder()
  .setName("voicetime")
  .setDescription("Returns the users total voice time");

export async function execute(interaction) {
  const { totalTime } = await getMemberById(interaction.user.id).catch((e) => {
    logger.error("Voicetime command execution failed with: ", e);
    interaction.reply(`User is unknown`);
  });
  const timeInMinutes = Math.floor(totalTime / 60 / 1000);
  interaction.reply(
    `Your current minutes spent in a voice channel is: ${timeInMinutes} minutes`
  );
}
