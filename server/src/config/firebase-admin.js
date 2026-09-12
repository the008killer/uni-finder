const admin = require('firebase-admin');

function getPrivateKey() {
  const key = (process.env.FIREBASE_PRIVATE_KEY || '').trim();
  if (!key) return null;
  return key.replace(/^["']|["']$/g, '').replace(/\\n/g, '\n');
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: getPrivateKey(),
    }),
  });
}

module.exports = admin;