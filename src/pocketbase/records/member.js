import { pb } from "../index.js";

export async function getAllMembers() {
  const ranks = await pb.collection("member").getFullList();
  return ranks;
}

export async function addNewMember(discordId) {
  const member = await pb.collection("member").create({
    discordId,
    exp: 0,
    rank: "zv06b8f2r19fbn2",
  });
  return member;
}

export async function updateMember(id, discordId, exp, rankId) {
  const member = await pb.collection("member").update(id, {
    discordId,
    exp,
    rank: rankId,
  });
  return member;
}
