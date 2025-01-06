import { Events } from "discord.js";
import { client } from "../../index.js";
import { handleVoiceStateUpdate } from "./voiceStateUpdateUtils.js";

client.on(Events.VoiceStateUpdate, (oldState, newState) =>
  handleVoiceStateUpdate(oldState, newState)
);
