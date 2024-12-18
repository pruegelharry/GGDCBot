const { updateUserExp, getUserExp } = require('./dataManager');

function testUpdateExp() {
    const userId = '192708045191643136'; // Test-User-ID (nimm eine bestehende ID aus deiner data.json)
    const expToAdd = 100; // Menge an EXP, die hinzugefügt werden soll

    console.log(`Aktuelle EXP für User ${userId}: ${getUserExp(userId)}`);

    const newExp = updateUserExp(userId, expToAdd);

    console.log(`Nach Update: Neue EXP für User ${userId}: ${newExp}`);
}

// Testfunktion ausführen
testUpdateExp();
