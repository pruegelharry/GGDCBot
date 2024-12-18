const fs = require('fs');
const path = './data.json';

// Daten aus der Datei laden
function loadData() {
    try {
        const rawData = fs.readFileSync(path, 'utf8');
        return JSON.parse(rawData);
    } catch (err) {
        console.error('Fehler beim Laden der Daten:', err.message);
        return {};
    }
}

// Daten in die Datei speichern
function saveData(data) {
    try {
        fs.writeFileSync(path, JSON.stringify(data, null, 2), 'utf8');
    } catch (err) {
        console.error('Fehler beim Speichern der Daten:', err.message);
    }
}

// Benutzer-EXP aktualisieren
function updateUserExp(userId, expGained) {
    const data = loadData();

    if (!data[userId]) {
        data[userId] = { exp: 0 };
    }

    data[userId].exp += expGained;
    saveData(data);

    return data[userId].exp;
}

// Benutzer-EXP abrufen
function getUserExp(userId) {
    const data = loadData();
    return data[userId]?.exp || 0;
}

module.exports = { updateUserExp, getUserExp };
