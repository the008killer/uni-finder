const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');

function getPrivateKey() {
  const key = (process.env.FIREBASE_PRIVATE_KEY || '').trim();
  if (!key) return null;
  return key.replace(/^["']|["']$/g, '').replace(/\\n/g, '\n');
}

let app;
const apps = getApps();

if (apps.length > 0) {
  app = apps[0];
} else {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = getPrivateKey();

  if (!projectId || !clientEmail || !privateKey) {
    console.warn('[FIREBASE ADMIN] Credentials missing in environment variables.');
  } else {
    app = initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
    console.log('[FIREBASE ADMIN] Initialized successfully.');
  }
}

const auth = app ? getAuth(app) : null;

module.exports = { auth, app };