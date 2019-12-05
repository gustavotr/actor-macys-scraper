const Apify = require('apify');

const pickSession = (sessions, maxSessions = 100) => {
    const sessionsKeys = Object.keys(sessions);

    console.log(`Currently we have ${sessionsKeys.length} working sessions`);

    const randomNumber = Math.random();
    const chanceToPickSession = sessionsKeys.length / maxSessions;

    console.log(`Chance to pick a working session is ${Math.round(chanceToPickSession * 100)}%`);

    const willPickSession = chanceToPickSession > randomNumber;

    if (willPickSession) {
        const indexToPick = Math.floor(sessionsKeys.length * Math.random());
        const nameToPick = sessionsKeys[indexToPick];

        console.log(`We picked a working session: ${nameToPick} on index ${indexToPick}`);

        return sessions[nameToPick];
    }

    console.log(`Creating new session: ${randomNumber}`);

    return {
        name: randomNumber.toString(),
        userAgent: Apify.utils.getRandomUserAgent(),
    };
};

module.exports = {
    pickSession,
};
