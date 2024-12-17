import { pb } from "../index.js";

export async function getAllRanks() {
  return pb.collection("rank").getFullList();
}

export async function setDiscordId(rankId, discordId) {
  return pb.collection("rank").update(rankId, {
    discordId,
  });
}
