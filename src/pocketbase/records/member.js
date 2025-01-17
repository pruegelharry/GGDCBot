import { pb } from "../index.js";
import {  getRankByName } from "./rank.js";

export async function getAllMembers() {
  return pb.collection("member").getFullList();
}

export async function addNewMember(id, displayName) {
  const rank = await getRankByName("Plastik");
  return pb.collection("member").create({
    id,
    exp: 0,
    rank: rank.id,
    displayName,
  });
}

export async function getMemberById(id) {
  return pb
    .collection("member")
    .getOne(id)
    .catch(
      (err) => (err.status === 404 ? undefined : err) // can be ignored since we know the member might not yet exist
    );
}

export async function updateMember(id, args) {
  return pb
    .collection("member")
    .update(id, args)
    .catch(
      (err) => (err.status === 404 ? undefined : err) // can be ignored since we know the member might not yet exist
    );
}
