import { pb } from "../index.js";

export async function getAllMembers() {
  return pb.collection("member").getFullList();
}

export async function addNewMember(discordId) {
  return pb.collection("member").create({
    discordId,
    exp: 0,
    rank: "zv06b8f2r19fbn2",
  });
}

export async function getMemberByDiscordId(discordId) {
  return pb.collection("member").getFirstListItem(`discordId="${discordId}"`);
}

export async function updateMember(id, discordId, exp, rankId) {
  return pb.collection("member").update(id, {
    discordId,
    exp,
    rank: rankId,
  });
}
