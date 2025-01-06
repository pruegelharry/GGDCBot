import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  SlashCommandBuilder,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";


export const data = new SlashCommandBuilder()
  .setName("cointoss")
  .setDescription("Lets gamble your xp to zero");
export async function execute(interaction) {

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
