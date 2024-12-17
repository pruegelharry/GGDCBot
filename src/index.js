import dotenv from "dotenv";
import { Client, GatewayIntentBits } from "discord.js";
import { logger } from "./logger.js";
import { handleNewMessageExp } from "./discord/utils.js";
import { initializePoketBase } from "./pocketbase/index.js";
import { initializeMembers, initializeRankIds } from "./initHelpers.js";
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

client.once("ready", async (client) => {
  initializePoketBase(POCKETBASE_AUTH);
  await initializeRankIds(client);
  await initializeMembers(client);
  logger.info(`Bot ist online! Eingeloggt als ${client.user.tag}`);
});

// EXP für Nachrichten vergeben und Rolle aktualisieren
client.on("messageCreate", async (message) => handleNewMessageExp(message));

client.login(TOKEN);
