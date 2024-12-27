import { logger } from "../logger.js";
import { updateUserExp } from "../dataManager.js";
import { getAllRanks } from "../pocketbase/records/rank.js";

export async function handleNewMessageExp(message) {
  if (message.author.bot) return;

  const expGained = 10;
  let updatedUser;
  try {
    updatedUser = await updateUserExp(message.author.id, expGained);
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
  const ranks = await getAllRanks();
  const { guild } = member;
  const { tag } = member.user;
  // name is the targetroles name
  const { name, discordId } = ranks.find(
    (rank) => exp >= rank.minimum && exp <= rank.maximum
  );

  if (!name) {
    throw Error(`Keine passende Rolle für ${tag} (EXP: ${exp}) gefunden.`);
  }
  const targetRole = await guild.roles.fetch(discordId);
  if (!targetRole) {
    throw Error(
      `Rolle "${name}" existiert nicht auf dem Server "${guild.name}".`
    );
  }

  // Bestehende Ränge entfernen
  const currentRanks = ranks.map((rank) => rank.name);
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
