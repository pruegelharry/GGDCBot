import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  SlashCommandBuilder,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";
import { getMemberById } from "../../pocketbase/records/member.js";
import { updateUserExp } from "../utils.js";

export const data = new SlashCommandBuilder()
  .setName("cointoss")
  .setDescription("Lets gamble your xp to zero");
export async function execute(interaction) {
  // const amount = Math.floor(Number(interaction.options.getString("amount")));
  // const { exp } = await getMemberById(interaction.user.id);
  // if (Number.isNaN(amount)) {
  //   interaction.reply("The amount is not a number!");
  //   return;
  // }
  // if (amount <= 0) {
  //   interaction.reply("The amount is to small!");
  //   return;
  // }
  // if (exp < amount) {
  //   interaction.reply(`Du broke-ass bitch hast nur ${exp} xp`);
  //   return;
  // }
  // const subcommand = interaction.options.getSubcommand();
  // const result = Math.floor(Math.random() * 100) > 50 ? "head" : "tail";
  // const addedExp = result === subcommand ? amount : amount * -1;
  // const updatedMember = await updateUserExp(interaction.user.id, addedExp);
  // const msg = await interaction.reply(
  //   `The coin landed on ${result}, you have ${
  //     result === subcommand ? "won" : "lost"
  //   } ${amount} xp. Your remaining xp is ${updatedMember.exp}`
  // );
  const headButton = new ButtonBuilder()
    .setCustomId("cointoss_head")
    .setLabel("Kopf")
    .setStyle(ButtonStyle.Success);
  const tailButton = new ButtonBuilder()
    .setCustomId("cointoss_tail")
    .setLabel("Zahl")
    .setStyle(ButtonStyle.Danger);
  const row = new ActionRowBuilder().addComponents([headButton, tailButton]);
  let response = await interaction.reply({
    content: "Wähle Kopf oder Zahl",
    components: [row],
  });

  try {
    const confirmation = await response.awaitMessageComponent({
      filter: (i) => i.user.id === interaction.user.id,
      time: 60000,
    });
    const textInput = new TextInputBuilder()
      .setCustomId("cointoss_xp")
      .setLabel("Menge an xp")
      .setStyle(TextInputStyle.Short);
    const t = new ActionRowBuilder().addComponents(textInput);
    const modal = new ModalBuilder()
      .setCustomId("myModal")
      .setTitle("My Modal");
    modal.addComponents(t);
    const test = await confirmation.showModal(modal);
    console.log({ test });
  } catch (e) {
    console.log({ e });
    response = await interaction.editReply({
      content: "Confirmation not received within 1 minute, cancelling",
      components: [],
    });
  }

  setTimeout(() => {
    response.delete();
  }, 60000 * 0.5);
}
