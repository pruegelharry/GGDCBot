import { logger } from "../logger.js";
import { updateUserExp, getUserExp } from "../dataManager.js";
import { getAllRanks } from "../pocketbase/records/rank.js";

export async function handleNewMessageExp(message) {
  if (message.author.bot) return;

  const expGained = 10;
  const newExp = updateUserExp(message.author.id, expGained);
  logger.info(
    `${message.author.tag} hat ${expGained} EXP erhalten. Gesamte EXP: ${newExp}`
  );

  const guildMember = await message?.guild?.members?.fetch(message?.author);
  if (guildMember) {
    await assignRole(guildMember, newExp);
  }
}

// Rolle basierend auf EXP zuweisen
export async function assignRole(member, exp) {
  const ranks = await getAllRanks();
  const { guild } = member;
  const { tag } = member.user;

  const targetRoleName = ranks.find(
    (rank) => exp >= rank.minimum && exp <= rank.maximum
  )?.name;
  if (!targetRoleName) {
    logger.info(`Keine passende Rolle für ${tag} (EXP: ${exp}) gefunden.`);
    return;
  }

  const targetRole = guild.roles.cache.find(
    (role) => role.name === targetRoleName
  );
  if (!targetRole) {
    logger.warn(
      `Rolle "${targetRoleName}" existiert nicht auf dem Server "${guild.name}".`
    );
    return;
  }

  // Bestehende Ränge entfernen
  const currentRanks = ranks.map((rank) => rank.name);
  const rolesToRemove = member.roles.cache.filter((role) =>
    currentRanks.includes(role.name)
  );
  console.log("-----", getMethods(member.roles.cache));

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

function getMethods(obj) {
  var result = [];
  for (var id in obj) {
    try {
      if (typeof obj[id] == "function") {
        result.push(id + ": " + obj[id].toString());
      }
    } catch (err) {
      result.push(id + ": inaccessible");
    }
  }
  return result;
}
