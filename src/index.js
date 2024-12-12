require("dotenv").config();
const {
  Client,
  GatewayIntentBits,
  ApplicationRoleConnectionMetadataType,
} = require("discord.js");
const { updateUserExp, getUserExp } = require("./dataManager");
const { logger } = require("./logger");
const { getAllRanks } = require("./pocketbase/records/rank");
const TOKEN = process.env.DISCORD_TOKEN;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMembers,
  ],
});

logger.info("Bot gestartet!");

client.once("ready", () => {
  console.log(`Bot ist online! Eingeloggt als ${client.user.tag}`);
});

// Funktion zum Abrufen der entsprechenden Rolle basierend auf EXP
async function getRoleForExp(exp) {
  const ranks = await getAllRanks();
  return ranks.find((rank) => exp >= rank.minimum && exp <= rank.maximum)?.name;
}

// Rolle basierend auf EXP zuweisen
async function assignRole(member, exp) {
  const ranks = await getAllRanks();
  const guild = member.guild;
  const targetRoleName = await getRoleForExp(exp);

  if (!targetRoleName) {
    logger.info(
      `Keine passende Rolle für ${member.user.tag} (EXP: ${exp}) gefunden.`
    );
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

  for (const role of rolesToRemove.values()) {
    await member.roles.remove(role).catch((err) => {
      logger.error(
        `Fehler beim Entfernen der Rolle ${role.name} von ${member.user.tag}: ${err.message}`
      );
    });
  }

  // Neue Rolle zuweisen
  if (!member.roles.cache.has(targetRole.id)) {
    await member.roles.add(targetRole).catch((err) => {
      logger.error(
        `Fehler beim Hinzufügen der Rolle ${targetRole.name} zu ${member.user.tag}: ${err.message}`
      );
    });
    logger.info(`Rolle "${targetRole.name}" an ${member.user.tag} vergeben.`);
  }
}

// EXP für Nachrichten vergeben und Rolle aktualisieren
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  const expGained = 10;
  const newExp = updateUserExp(message.author.id, expGained);
  logger.info(
    `${message.author.tag} hat ${expGained} EXP erhalten. Gesamte EXP: ${newExp}`
  );

  const member = message.guild.members.cache.get(message.author.id);
  if (member) {
    await assignRole(member, newExp);
  }
});

// EXP für Voice-Channel-Aufenthalt vergeben
setInterval(async () => {
  const guilds = client.guilds.cache;

  for (const guild of guilds.values()) {
    const voiceChannels = guild.channels.cache.filter(
      (channel) => channel.type === 2
    ); // Nur Voice-Channels

    for (const channel of voiceChannels.values()) {
      const members = channel.members.filter((member) => !member.user.bot);

      if (members.size > 0) {
        // Mindestens zwei Mitglieder im Channel
        for (const member of members.values()) {
          const expGained = 5; // EXP pro Intervall
          const newExp = updateUserExp(member.id, expGained);
          logger.info(
            `${member.user.tag} hat ${expGained} EXP erhalten (Voice-Channel). Gesamte EXP: ${newExp}`
          );

          await assignRole(member, newExp);
        }
      }
    }
  }
}, 10000); // Alle 60 Sekunden

client.login(TOKEN);
