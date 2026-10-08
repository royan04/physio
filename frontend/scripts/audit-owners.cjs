const { applicationDefault, initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const projectId = process.env.FIREBASE_PROJECT_ID;

if (!projectId || !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  console.error('Set FIREBASE_PROJECT_ID and GOOGLE_APPLICATION_CREDENTIALS before running this audit.');
  process.exit(1);
}

initializeApp({ credential: applicationDefault(), projectId });

async function main() {
  const db = getFirestore();
  let missing = 0;

  for (const name of ['appointments', 'bills']) {
    const snapshot = await db.collection(name).select('doctorId').get();
    const ids = snapshot.docs
      .filter((item) => typeof item.get('doctorId') !== 'string' || !item.get('doctorId').trim())
      .map((item) => item.id);
    missing += ids.length;
    console.log(`${name}: ${ids.length} of ${snapshot.size} documents missing doctorId`);
    if (ids.length) console.log(`Document IDs: ${ids.join(', ')}`);
  }

  if (missing) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
