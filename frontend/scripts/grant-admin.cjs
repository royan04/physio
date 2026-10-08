const { applicationDefault, initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');

const uid = process.argv[2];
const projectId = process.env.FIREBASE_PROJECT_ID;

if (!uid || !projectId || !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  console.error('Usage: set FIREBASE_PROJECT_ID and GOOGLE_APPLICATION_CREDENTIALS, then run npm run firestore:grant-admin -- <uid>');
  process.exit(1);
}

initializeApp({ credential: applicationDefault(), projectId });

async function main() {
  const auth = getAuth();
  const user = await auth.getUser(uid);
  await auth.setCustomUserClaims(uid, { ...user.customClaims, admin: true });
  console.log(`Admin claim granted to ${uid} (${user.email || 'no email'}). The user must sign out and sign in again.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
