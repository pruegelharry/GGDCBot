require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const { updateUserExp, getUserExp } = require('./dataManager');
const TOKEN = process.env.DISCORD_TOKEN;
const { createLogger, format, transports } = require('winston');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMembers
    ]
});

const logger = createLogger({
    level: 'info',
    format: format.combine(
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        format.printf(({ timestamp, level, message }) => `${timestamp} [${level}]: ${message}`)
    ),
    transports: [
        new transports.Console(),
        new transports.File({ filename: 'bot.log' })
    ]
});

logger.info('Bot gestartet!');

client.once('ready', () => {
    console.log(`Bot ist online! Eingeloggt als ${client.user.tag}`);
});

// Schwellenwerte und Ränge definieren
const rankThresholds = [
    { role: 'Plastik', minExp: 0, maxExp: 99 },
    { role: 'Eisen', minExp: 100, maxExp: 499 },
    { role: 'Kupfer', minExp: 500, maxExp: 999 },
    { role: 'Silber', minExp: 1000, maxExp: 2499 },
    { role: 'Gold', minExp: 2500, maxExp: 4999 },
    { role: 'Platin', minExp: 5000, maxExp: 9999 },
    { role: 'Diamand', minExp: 10000, maxExp: 14999 },
    { role: 'Master', minExp: 15000, maxExp: 19999 },
    { role: '✨ - Legende', minExp: 20000, maxExp: 29999 },
    { role: 'Champion', minExp: 30000, maxExp: Infinity }
];

// Funktion zum Abrufen der entsprechenden Rolle basierend auf EXP
function getRoleForExp(exp) {
    return rankThresholds.find(rank => exp >= rank.minExp && exp <= rank.maxExp)?.role;
}

// Rolle basierend auf EXP zuweisen
async function assignRole(member, exp) {
    const guild = member.guild;
    const targetRoleName = getRoleForExp(exp);

    if (!targetRoleName) {
        logger.info(`Keine passende Rolle für ${member.user.tag} (EXP: ${exp}) gefunden.`);
        return;
    }

    const targetRole = guild.roles.cache.find(role => role.name === targetRoleName);

    if (!targetRole) {
        logger.warn(`Rolle "${targetRoleName}" existiert nicht auf dem Server "${guild.name}".`);
        return;
    }

    // Bestehende Ränge entfernen
    const currentRanks = rankThresholds.map(rank => rank.role);
    const rolesToRemove = member.roles.cache.filter(role => currentRanks.includes(role.name));

    for (const role of rolesToRemove.values()) {
        await member.roles.remove(role).catch(err => {
            logger.error(`Fehler beim Entfernen der Rolle ${role.name} von ${member.user.tag}: ${err.message}`);
        });
    }

    // Neue Rolle zuweisen
    if (!member.roles.cache.has(targetRole.id)) {
        await member.roles.add(targetRole).catch(err => {
            logger.error(`Fehler beim Hinzufügen der Rolle ${targetRole.name} zu ${member.user.tag}: ${err.message}`);
        });
        logger.info(`Rolle "${targetRole.name}" an ${member.user.tag} vergeben.`);
    }
}

// EXP für Nachrichten vergeben und Rolle aktualisieren
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    const expGained = 10;
    const newExp = updateUserExp(message.author.id, expGained);
    logger.info(`${message.author.tag} hat ${expGained} EXP erhalten. Gesamte EXP: ${newExp}`);

    const member = message.guild.members.cache.get(message.author.id);
    if (member) {
        await assignRole(member, newExp);
    }
});

// EXP für Voice-Channel-Aufenthalt vergeben
setInterval(async () => {
    const guilds = client.guilds.cache;

    for (const guild of guilds.values()) {
        const voiceChannels = guild.channels.cache.filter(channel => channel.type === 2); // Nur Voice-Channels

        for (const channel of voiceChannels.values()) {
            const members = channel.members.filter(member => !member.user.bot);

            if (members.size > 0) { // Mindestens zwei Mitglieder im Channel
                for (const member of members.values()) {
                    const expGained = 5; // EXP pro Intervall
                    const newExp = updateUserExp(member.id, expGained);
                    logger.info(`${member.user.tag} hat ${expGained} EXP erhalten (Voice-Channel). Gesamte EXP: ${newExp}`);

                    await assignRole(member, newExp);
                }
            }
        }
    }
}, 10000); // Alle 60 Sekunden

client.login(TOKEN);