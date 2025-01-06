import {
  Client,
  Collection,
  GatewayIntentBits,
  REST,
  Routes,
} from "discord.js";

import {
  data as lowerHigherData,
  execute as lowerHigherFunc,
} from "./commands/lowerHigher.js";
import { data as expData, execute as expFunc } from "./commands/exp.js";
import {
  data as cointossData,
  execute as cointossFunc,
} from "./commands/cointoss.js";
import {
  data as voicetimeData,
  execute as voicetimeFunc,
} from "./commands/voicetime.js";

export const guildId = "918759632485355521";
export const clientId = "1313854803343839272";
const TOKEN = process.env.DISCORD_TOKEN;

export const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMembers,
  ],
});
client.commands = new Collection();
client.commands.set(lowerHigherData.name, lowerHigherFunc);
client.commands.set(cointossData.name, cointossFunc);
client.commands.set(expData.name, expFunc);
client.commands.set(voicetimeData.name, voicetimeFunc);

const commands = [];
commands.push(lowerHigherData.toJSON());
commands.push(cointossData.toJSON());
commands.push(expData.toJSON());
commands.push(voicetimeData.toJSON());
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

client.login(TOKEN);
