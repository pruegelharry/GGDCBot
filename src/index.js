import dotenv from "dotenv";
import {
  Client,
  GatewayIntentBits,
  ApplicationRoleConnectionMetadataType,
} from "discord.js";
import { updateUserExp, getUserExp } from "./dataManager.js";
import { logger } from "./logger.js";
import { getAllRanks, setDiscordId } from "./pocketbase/records/rank.js";
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
export const guildId = "918759632485355521";

async function initializeRankIds(client) {
  const ranks = await getAllRanks();
  const guild = await client.guilds.fetch(guildId);
  const roles = await guild.roles.fetch();
  ranks.forEach(async (rank) => {
    roles.forEach(async (role) => {
      if (rank.name === role.name) {
        await setDiscordId(rank.id, role.id);
      }
    });
  });
}

client.once("ready", async (client) => {
  // set manually and don't forget to change permissions in pocketbase
  // only needs to be run manually should a role have changed or been added
  // await initializeRankIds(client);
  console.log(`Bot ist online! Eingeloggt als ${client.user.tag}`);
});

// EXP für Nachrichten vergeben und Rolle aktualisieren
client.on("messageCreate", async (message) => handleNewMessageExp(message));
// EXP für Voice-Channel-Aufenthalt vergeben

client.login(TOKEN);
