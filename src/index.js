import dotenv from "dotenv";
import {
  Client,
  GatewayIntentBits,
  ApplicationRoleConnectionMetadataType,
} from "discord.js";
import { updateUserExp, getUserExp } from "./dataManager.js";
import { logger } from "./logger.js";
import { getAllRanks } from "./pocketbase/records/rank.js";
import { handleNewMessageExp } from "./discord/utils.js";
dotenv.config();
const TOKEN = process.env.DISCORD_TOKEN;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMembers,
  ],
});

logger.info("Bot gestartet!");

client.once("ready", () => {
  console.log(`Bot ist online! Eingeloggt als ${client.user.tag}`);
});

// EXP für Nachrichten vergeben und Rolle aktualisieren
client.on("messageCreate", async (message) => handleNewMessageExp(message));
// EXP für Voice-Channel-Aufenthalt vergeben

client.login(TOKEN);
