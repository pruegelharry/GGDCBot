import { logger } from "../logger.js";
import { getAllRanks, getRankByXP } from "../pocketbase/records/rank.js";
import {
  addNewMember,
  getMemberById,
  updateMember,
} from "../pocketbase/records/member.js";

export async function handleNewMessageExp(message) {
  if (message.author.bot) return;

  const expGained = 1;
  let updatedUser;
  try {
    updatedUser = await updateUserExp(message.author.id, message.author.displayName, expGained);
  } catch (error) {
    logger.error(error);
  }
  logger.info(
    `${message.author.tag} hat ${expGained} EXP erhalten. Gesamte EXP: ${updatedUser.exp}`
  );

  const guildMember = await message?.guild?.members?.fetch(message?.author);
  if (guildMember) {
    assignRole(guildMember, updatedUser.exp).catch((error) => {
      logger.error(error);
    });
  }
}

// Rolle basierend auf EXP zuweisen
export async function assignRole(member, exp) {
  const { guild } = member;
  const { tag } = member.user;
  // name is the targetroles name
  const rank = await getRankByXP(exp);

  if (!rank.name) {
    throw Error(`Keine passende Rolle für ${tag} (EXP: ${exp}) gefunden.`);
  }
  const targetRole = await guild.roles.fetch(rank.id);
  if (!targetRole) {
    throw Error(
      `Rolle "${rank.name}" existiert nicht auf dem Server "${guild.name}".`
    );
  }

  // member in der DB updaten
  await updateMember(member.id, { rank: rank.id });

  // Bestehende Ränge entfernen
  const ranks = await getAllRanks();
  const currentRanks = ranks.map((rk) => rk.name);
  const rolesToRemove = member.roles.cache.filter((role) =>
    currentRanks.includes(role.name)
  );

  for (const role of rolesToRemove.values()) {
    await member.roles.remove(role).catch((err) => {
      logger.error(
        `Fehler beim Entfernen der Rolle ${role.name} von ${tag}: ${err.message}`
      );
    });
  }

  // Neue Rolle zuweisen
  if (!member.roles.cache.has(targetRole.id)) {
    await member.roles.add(targetRole).catch((err) => {
      logger.error(
        `Fehler beim Hinzufügen der Rolle ${targetRole.name} zu ${tag}: ${err.message}`
      );
    });
    logger.info(`Rolle "${targetRole.name}" an ${tag} vergeben.`);
  }
}

// Benutzer-EXP aktualisieren
export async function updateUserExp(userId, displayName,  expToAdd) {
  let member = await getMemberById(userId);
  // check ob benutzer schon existiert
  if (!member?.id) {
    member = await addNewMember(userId, displayName);
  }
  const { id, rank, exp } = member;
  // check for rank update
  const newExp = exp + expToAdd;
  let potentiallyNewRank = rank;
  if (newExp < rank.minimum || rank.maximum < newExp) {
    potentiallyNewRank = await getRankByXP(newExp);
  }
  return updateMember(id, { exp: newExp, rank: potentiallyNewRank.id });
}
