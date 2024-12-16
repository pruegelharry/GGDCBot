import { pb } from "../index.js";

export async function getAllRanks() {
  const ranks = await pb.collection("rank").getFullList();
  return ranks;
}
