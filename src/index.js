import dotenv from "dotenv";
import {
  Client,
  Collection,
  GatewayIntentBits,
  Events,
  REST,
  Routes,
} from "discord.js";
import { logger } from "./logger.js";
import { handleNewMessageExp } from "./discord/utils.js";
import { initializePoketBase } from "./pocketbase/index.js";
import { initializeMembers, initializeRankIds } from "./initHelpers.js";
import {
  data as lowerHigherData,
  execute as lowerHigherFunc,
} from "./discord/commands/lowerHigher.js";
import {
  data as cointossData,
  execute as cointossFunc,
} from "./discord/commands/cointoss.js";
import { handleVoiceStateUpdate } from "./discord/voiceStateUpdateUtils.js";
dotenv.config();
const TOKEN = process.env.DISCORD_TOKEN;
const POCKETBASE_AUTH = process.env.POCKETBASE_AUTH;
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMembers,
  ],
});
export const guildId = "918759632485355521";
export const clientId = "1313854803343839272";

client.commands = new Collection();
client.commands.set(lowerHigherData.name, lowerHigherFunc);
client.commands.set(cointossData.name, cointossFunc);

// registers the commands immediately with the guild
const commands = [];
commands.push(lowerHigherData.toJSON());
commands.push(cointossData.toJSON());
const rest = new REST().setToken(TOKEN);
(async () => {
  try {
    const data = await rest.put(
      Routes.applicationGuildCommands(clientId, guildId),
      { body: commands }
    );
  } catch (e) {
    console.error("HERE", e);
  }
})();

client.once(Events.ClientReady, async (client) => {
  initializePoketBase(POCKETBASE_AUTH);
  await initializeRankIds(client);
  await initializeMembers(client);
  // initially look for ppl in voiceChannels to start counting voicetime
  logger.info(`Bot ist online! Eingeloggt als ${client.user.tag}`);
});

// EXP für Nachrichten vergeben und Rolle aktualisieren
client.on(Events.MessageCreate, async (message) =>
  handleNewMessageExp(message)
);

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const execute = interaction.client.commands.get(interaction.commandName);
  if (execute) {
    await execute(interaction);
  }
});

client.on(Events.VoiceStateUpdate, (oldState, newState) =>
  handleVoiceStateUpdate(oldState, newState)
);

client.login(TOKEN);
