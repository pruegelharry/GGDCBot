import fs from "node:fs";
import {
  addNewMember,
  getMemberByDiscordId,
  updateMember,
} from "./pocketbase/records/member.js";
import { getAllRanks } from "./pocketbase/records/rank.js";
const path = "./src/data.json";

// Daten laden
function loadData() {
  if (!fs.existsSync(path)) {
    fs.writeFileSync(path, "{}");
  }
  const rawData = fs.readFileSync(path);
  return JSON.parse(rawData);
}

// Daten speichern
function saveData(data) {
  fs.writeFileSync(path, JSON.stringify(data, null, 2));
}

// Benutzer-EXP aktualisieren
export async function updateUserExp(userId, expToAdd) {
  let member = await getMemberByDiscordId(userId);

  // check ob benutzer schon existiert
  if (!member?.id) {
    member = await addNewMember(userId);
  }
  const { id, rank, exp, discordId } = member;
  // check for rank update
  const newExp = exp + expToAdd;
  let potentiallyNewRank = rank;
  if (newExp < rank.minimum || rank.maximum < newExp) {
    const ranks = await getAllRanks();
    potentiallyNewRank = ranks.find(
      (rk) => rk.maximum > newExp && newExp > rk.minimum
    );
  }
  return updateMember(id, discordId, newExp, potentiallyNewRank);
}

// Benutzer-EXP abrufen
export function getUserExp(userId) {
  const data = loadData();
  return data[userId]?.exp || 0;
}
