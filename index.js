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

// Voice-Channel-Zeiterfassung
const voiceTimes = new Map();

client.on('voiceStateUpdate', async (oldState, newState) => {
    const member = newState.member;

    // Logge Bewegungen zwischen Voice-Channels
    if (oldState.channelId && newState.channelId && oldState.channelId !== newState.channelId) {
        logger.info(`${member.user.tag} hat den Voice-Channel "${oldState.channel?.name}" verlassen und ist in den Channel "${newState.channel?.name}" gewechselt.`);
    }

    // Wenn das Mitglied einen Voice-Channel betritt
    if (!oldState.channelId && newState.channelId) {
        voiceTimes.set(member.id, Date.now());
        logger.info(`${member.user.tag} hat den Voice-Channel "${newState.channel?.name}" betreten. Eintrittszeit gespeichert.`);
        return;
    }

    // Wenn das Mitglied einen Voice-Channel verlässt
    if (oldState.channelId && !newState.channelId) {
        const joinTime = voiceTimes.get(member.id);

        if (!joinTime) {
            logger.warn(`Kein Eintrittszeitpunkt für ${member.user.tag} gefunden. Keine EXP-Berechnung möglich.`);
            return;
        }

        const duration = (Date.now() - joinTime) / 1000; // Dauer in Sekunden
        voiceTimes.delete(member.id);

        if (duration < 60) {
            logger.info(`${member.user.tag} war weniger als 1 Minute im Voice-Channel "${oldState.channel?.name}". Keine EXP vergeben.`);
            return;
        }

        // EXP basierend auf der Aufenthaltsdauer berechnen
        const minutes = Math.floor(duration / 60);
        const expGained = minutes * 5; // 5 EXP pro Minute
        const newExp = updateUserExp(member.id, expGained);

        if (newExp === undefined) {
            logger.error(`Fehler: EXP für ${member.user.tag} konnten nicht aktualisiert werden. EXP-Zuweisung abgebrochen.`);
            return;
        }

        logger.info(`${member.user.tag} war ${minutes} Minuten im Voice-Channel "${oldState.channel?.name}" und hat ${expGained} EXP erhalten. Gesamte EXP: ${newExp}`);

        // Rolle basierend auf EXP zuweisen
        try {
            await assignRole(member, newExp);
        } catch (err) {
            logger.error(`Fehler bei der Rollenzuweisung für ${member.user.tag}: ${err.message}`);
        }
    }
});



client.login(TOKEN);
