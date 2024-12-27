import { SlashCommandBuilder } from "discord.js";
import { getMemberByDiscordId } from "../../pocketbase/records/member.js";
import { updateUserExp } from "../../dataManager.js";

export const data = new SlashCommandBuilder()
  .setName("cointoss")
  .setDescription("Lets gamble your xp to zero")
  .addSubcommand((subcommand) =>
    subcommand
      .setName("head")
      .setDescription("Chooses head")
      .addStringOption((option) =>
        option
          .setName("amount")
          .setDescription("The amount of xp to gamble")
          .setRequired(true)
      )
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("tail")
      .setDescription("Chooses tail")
      .addStringOption((option) =>
        option
          .setName("amount")
          .setDescription("The amount of xp to gamble")
          .setRequired(true)
      )
  );
export async function execute(interaction) {
  const amount = Math.floor(Number(interaction.options.getString("amount")));
  const { exp } = await getMemberByDiscordId(interaction.user.id);
  if (Number.isNaN(amount)) {
    interaction.reply("The amount is not a number!");
    return;
  }
  if (amount <= 0) {
    interaction.reply("The amount is to small!");
    return;
  }
  if (exp < amount) {
    interaction.reply(`Du broke-ass bitch hast nur ${exp} xp`);
    return;
  }
  const subcommand = interaction.options.getSubcommand();
  const result = Math.floor(Math.random() * 100) > 50 ? "head" : "tail";
  const addedExp = result === subcommand ? amount : amount * -1;
  const updatedMember = await updateUserExp(interaction.user.id, addedExp);
  await interaction.reply(
    `The coin landed on ${result}, you have ${
      result === subcommand ? "won" : "lost"
    } ${amount} xp. Your remaining xp is ${updatedMember.exp}`
  );
}
