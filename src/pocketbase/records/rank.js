import { pb } from "../index.js";

export async function getAllRanks() {
  return pb.collection("rank").getFullList();
}

export async function createRank(id, name, minimum, maximum) {
  return pb.collection("rank").create({
    id,
    name,
    minimum,
    maximum,
  });
}

export async function updateRank(id, args) {
  return pb
    .collection("rank")
    .update(id, args)
    .catch(
      (err) => (err.status === 404 ? undefined : err) // can be ignored since we know that the rank might not yet exist
    );
}

export async function getRankById(id) {
  return pb
    .collection("rank")
    .getOne(id)
    .catch(
      (err) => (err.status === 404 ? undefined : err) // can be ignored since we know that the rank might not yet exist
    );
}

export async function getRankByName(name) {
  return pb
    .collection("rank")
    .getFirstListItem(`name="${name}"`)
    .catch(
      (err) => (err.status === 404 ? undefined : err) // can be ignored since we know that the rank might not yet exist
    );
}

export async function getRankByXP(exp) {
  return pb
    .collection("rank")
    .getFirstListItem(`minimum <= "${exp}" && maximum >= "${exp}"`)
    .catch(
      (err) => (err.status === 404 ? undefined : err) // can be ignored since we know that the rank might not yet exist
    );
}
