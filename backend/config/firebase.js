const { initializeApp, getApps, cert } = require("firebase-admin/app");

if (!getApps().length) {
    initializeApp({
        credential: cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY
                ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
                : undefined
        })
    });
}

const { getAuth } = require("firebase-admin/auth");

module.exports = { getAuth };
