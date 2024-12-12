const fs = require("fs");
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
function updateUserExp(userId, expToAdd) {
  const data = loadData();
  if (!data[userId]) {
    data[userId] = { exp: 0 };
  }
  data[userId].exp += expToAdd;
  saveData(data);
  return data[userId].exp;
}

// Benutzer-EXP abrufen
function getUserExp(userId) {
  const data = loadData();
  return data[userId]?.exp || 0;
}

module.exports = { updateUserExp, getUserExp };
