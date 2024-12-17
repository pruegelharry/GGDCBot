import { pb } from "../index.js";

export async function getAllMembers() {
  const ranks = await pb.collection("member").getFullList();
  return ranks;
}

export async function addNewMember(discordId) {
  const member = await pb.collection("member").create({
    discordId,
    exp: 0,
  });
  return member;
}

export async function updateMember(discordId, exp) {
  const member = await pb.collection("member").create({
    discordId,
    exp,
  });
  return member;
}
