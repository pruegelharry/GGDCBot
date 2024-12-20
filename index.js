require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const { updateUserExp, getUserExp } = require('./dataManager');
const TOKEN = process.env.DISCORD_TOKEN;
const { createLogger, format, transports } = require('winston');
const fs = require('fs');
const path = require('path');
const voiceTimesFile = path.join(__dirname, 'voiceTimes.json');


// Logger konfigurieren
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

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMembers
    ]
});

logger.info('Bot gestartet!');

client.once('ready', () => {
    logger.info(`Bot ist online! Eingeloggt als ${client.user.tag}`);
    
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

//Voice Times in Datei laden
function loadVoiceTimes() {
    if (!fs.existsSync(voiceTimesFile)) {
        return {};
    }
    try {
        const data = fs.readFileSync(voiceTimesFile, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        logger.error('Fehler beim Laden der voiceTimes.json:', error);
        return {};
    }
}

//Voice Times in Datei speichern
function saveVoiceTimes(data) {
    try {
        fs.writeFileSync(voiceTimesFile, JSON.stringify(data, null, 2), 'utf-8');
        logger.info('voiceTimes.json wurde erfolgreich gespeichert.');
    } catch (error) {
        logger.error('Fehler beim Speichern der voiceTimes.json:', error);
    }
}

// Globale Variable für gespeicherte Zeiten
const storedVoiceTimes = loadVoiceTimes();

// Funktion zum Abrufen der entsprechenden Rolle basierend auf EXP
function getRoleForExp(exp) {
    return rankThresholds.find(rank => exp >= rank.minExp && exp <= rank.maxExp)?.role;
}

// Rolle basierend auf EXP zuweisen
async function assignRole(member, exp) {
    logger.info(`AssignRole für ${member.user.tag} mit ${exp} EXP gestartet.`);
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

client.on('voiceStateUpdate', (oldState, newState) => {
    logger.info('DEBUG: Event empfangen');
    const member = newState.member || oldState.member;
    const userId = member.id;

    // Wenn sich der Voice-Channel nicht geändert hat, ignorieren
    if (oldState.channelId === newState.channelId) {
        logger.info(`${member.user.tag} hat keinen Channel gewechselt.`);
        return;
    }

    const oldChannel = oldState.channel?.name || 'None';
    const newChannel = newState.channel?.name || 'None';
    logger.info(`${member.user.tag} wechselte von "${oldChannel}" zu "${newChannel}"`);

    // Verlassen des alten Channels
    if (oldState.channelId) {
        const joinTime = voiceTimes.get(userId);
        if (!joinTime) {
            logger.warn(`Kein Eintrittszeitpunkt für ${member.user.tag} gefunden. Keine EXP-Berechnung möglich.`);
        } else {
            const duration = (Date.now() - joinTime) / 1000; // Dauer in Sekunden
            if (duration >= 60) {
                const minutes = Math.floor(duration / 60);
                const expGained = minutes * 5; // 5 EXP pro Minute
                const userTimes = storedVoiceTimes[userId] || {};
                userTimes[oldChannel] = (userTimes[oldChannel] || 0) + duration; // Dauer kumulieren
                storedVoiceTimes[userId] = userTimes;

            // Speichere die aktualisierten Daten
            saveVoiceTimes(storedVoiceTimes);

            logger.info(`${member.user.tag} hat insgesamt ${Math.floor(userTimes[oldChannel])} Sekunden im Channel "${oldChannel}" verbracht.`);
                try {
                    const newExp = updateUserExp(userId, expGained);
                    logger.info(`${member.user.tag} war ${minutes} Minuten im Voice-Channel "${oldChannel}" und hat ${expGained} EXP erhalten. Gesamte EXP: ${newExp}`);
                } catch (error) {
                    logger.error(`Fehler beim Aktualisieren der EXP für ${member.user.tag}:`, error);
                }
            } else {
                logger.info(`${member.user.tag} war nicht lange genug (${duration} Sekunden) im Voice-Channel, um EXP zu erhalten.`);
            }
        }
        // Alte Join-Zeit löschen
        voiceTimes.delete(userId);
    }

    // Betreten des neuen Channels
    if (newState.channelId) {
        voiceTimes.set(userId, Date.now());
        logger.info(`${member.user.tag} hat den Voice-Channel "${newChannel}" betreten. Eintrittszeit gespeichert.`);
    }
});



/* // Map zur Verhinderung von doppelten Events
const recentChannelUpdates = new Map();

client.on('voiceStateUpdate', async (oldState, newState) => {
    const member = newState.member;

    // Schütze gegen schnelle Doppel-Events
    const now = Date.now();
    if (recentChannelUpdates.has(member.id) && (now - recentChannelUpdates.get(member.id)) < 2000) {
        logger.debug(`${member.user.tag} hat in kurzer Zeit einen weiteren Channel gewechselt. Event ignoriert.`);
        return;
    }
    recentChannelUpdates.set(member.id, now);

    // Rest des Handlers bleibt wie oben
}); */

client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.content.startsWith('!')) return;

    const args = message.content.slice(1).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    if (command === 'voicetime') {
        const userId = message.author.id;

        // Lade die gespeicherten Zeiten aus der Datei
        const storedVoiceTimes = JSON.parse(fs.readFileSync('./voiceTimes.json', 'utf8'));

        // Prüfe, ob der Nutzer in der Datei existiert
        if (!storedVoiceTimes[userId]) {
            message.reply('Du hast noch keine Zeit in einem Voice-Channel verbracht!');
            return;
        }

        // Channel-Daten des Nutzers
        const userChannels = storedVoiceTimes[userId];

        // Zeiten aufteilen: AFK-Zeit und andere Channel-Zeiten
        const afkTime = userChannels['💤 - AFK'] || 0;
        const otherChannelsTime = Object.entries(userChannels)
            .filter(([channelName]) => channelName !== '💤 - AFK') // Alle außer AFK
            .reduce((sum, [, time]) => sum + time, 0); // Summiere die Zeiten

        // Gesamtzeit für andere Channels berechnen
        const totalHours = Math.floor(otherChannelsTime / 3600);
        const totalMinutes = Math.floor((otherChannelsTime % 3600) / 60);
        const totalSeconds = Math.floor(otherChannelsTime % 60);

        // Zeit im AFK-Channel berechnen
        const afkHours = Math.floor(afkTime / 3600);
        const afkMinutes = Math.floor((afkTime % 3600) / 60);
        const afkSeconds = Math.floor(afkTime % 60);

        // Antwort ausgeben
        message.reply(
            `🎧 **Deine Voice-Channel-Zeit:**\n\n` +
            `🟢 Aktive Channels: **${totalHours} Stunden, ${totalMinutes} Minuten und ${totalSeconds} Sekunden**\n` +
            `💤 AFK-Channel: **${afkHours} Stunden, ${afkMinutes} Minuten und ${afkSeconds} Sekunden**\n\n` +
            `✨ Weiter so, bleib aktiv!`
        );
    }
});

client.on('messageCreate', async (message) => {
    if (message.content === '!topAFK') {
        try {
            const storedVoiceTimes = JSON.parse(fs.readFileSync('./voiceTimes.json', 'utf-8'));
            const afkChannelName = '💤 - AFK'; // Name des AFK-Channels
            
            // Filtere und berechne die Zeiten für den AFK-Channel
            const afkTimes = Object.entries(storedVoiceTimes)
                .filter(([_, channels]) => channels[afkChannelName])
                .map(([userId, channels]) => ({
                    userId,
                    time: channels[afkChannelName],
                }));
            
            // Sortiere die Mitglieder nach Zeit im AFK-Channel
            const sortedAfkTimes = afkTimes.sort((a, b) => b.time - a.time).slice(0, 3);

            // Lade Mitgliederinformationen falls nicht gecacht
            const topAfkDetails = await Promise.all(sortedAfkTimes.map(async ({ userId, time }, index) => {
                const member = await message.guild.members.fetch(userId).catch(() => null);
                const userTag = member?.user?.tag || 'Unbekanntes Mitglied';
                const hours = Math.floor(time / 3600);
                const minutes = Math.floor((time % 3600) / 60);
                return `**${index + 1}.** ${userTag} - 🕒 ${hours} Stunden, ${minutes} Minuten`;
            }));

            // Antwort senden
            const reply = topAfkDetails.length > 0
                ? topAfkDetails.join('\n')
                : 'Niemand hat bisher Zeit im AFK-Channel verbracht. 🎉';

            message.reply(`🏆 **Top 3 Mitglieder im AFK-Channel (${afkChannelName})** 💤\n${reply}`);
        } catch (error) {
            console.error('Fehler beim Verarbeiten des Befehls !topAFK:', error);
            message.reply('❌ Es gab ein Problem beim Abrufen der Daten. Bitte versuche es später erneut.');
        }
    }
});







client.login(TOKEN);
