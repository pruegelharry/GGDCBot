import { pb } from "../index.js";

export async function createVoiceChannel(discordId, time, otherMembers) {
  return pb.collection("voicechannel").create({
    discordId,
    time,
    otherMembers,
  });
}
