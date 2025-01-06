import { SlashCommandBuilder } from "discord.js";
import { getMemberById } from "../../pocketbase/records/member.js";
import { logger } from "../../logger.js";

export const data = new SlashCommandBuilder()
  .setName("exp")
  .setDescription("Returns the users amount of exp");

export async function execute(interaction) {
  const { exp } = await getMemberById(interaction.user.id).catch((e) => {
    logger.error("Exp command execution failed with: ", e);
    interaction.reply(`User is unknown`);
  });
  interaction.reply(`Your current amount of xp is: ${exp}`);
}
