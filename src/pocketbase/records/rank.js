import { pb } from "../index.js";

export async function getAllRanks() {
  const ranks = await pb.collection("rank").getFullList();
  return ranks;
}

export async function setDiscordId(rankId, discordId) {
  const result = await pb.collection("rank").update(rankId, {
    discordId,
  });
  return result;
}
