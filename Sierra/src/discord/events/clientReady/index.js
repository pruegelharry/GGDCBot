import { Events } from "discord.js";
import { client } from "../../index.js";
import { logger } from "../../../logger.js";
import {
  initializeMembers,
  initializeRankIds,
  initVoiceChannels,
} from "./initHelpers.js";
import { initializePoketBase } from "../../../pocketbase/index.js";

const POCKETBASE_AUTH = process.env.POCKETBASE_AUTH;

client.once(Events.ClientReady, async (client) => {
  initializePoketBase(POCKETBASE_AUTH);
  await initializeRankIds(client);
  await initializeMembers(client);
  await initVoiceChannels(client);
  // initially look for ppl in voiceChannels to start counting voicetime
  logger.info(`Bot ist online! Eingeloggt als ${client.user.tag}`);
});
