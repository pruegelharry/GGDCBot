const { pb } = require("../index");

async function getAllRanks() {
  const ranks = await pb.collection("rank").getFullList();
  return ranks;
}
module.exports = { getAllRanks };
