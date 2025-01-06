import { Events } from "discord.js";
import { client } from "../../index.js";

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const execute = interaction.client.commands.get(interaction.commandName);
  if (execute) {
    await execute(interaction);
  }
});
