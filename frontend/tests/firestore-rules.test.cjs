const { after, before, test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} = require('@firebase/rules-unit-testing');
const {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
} = require('firebase/firestore');

let env;
let clinicianA;
let clinicianB;
let admin;
let guest;

before(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-physio-isolation',
    firestore: {
      rules: fs.readFileSync(path.join(__dirname, '..', 'firestore.rules'), 'utf8'),
    },
  });

  await env.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await Promise.all([
      setDoc(doc(db, 'doctors', 'clinician-a'), { uid: 'clinician-a', name: 'A' }),
      setDoc(doc(db, 'doctors', 'clinician-b'), { uid: 'clinician-b', name: 'B' }),
      setDoc(doc(db, 'appointments', 'visit-a'), { doctorId: 'clinician-a', patientName: 'Alex', contact: '123' }),
      setDoc(doc(db, 'appointments', 'visit-b'), { doctorId: 'clinician-b', patientName: 'Alex', contact: '123' }),
      setDoc(doc(db, 'appointments', 'legacy-visit'), { patientName: 'Legacy', contact: '456' }),
      setDoc(doc(db, 'bills', 'bill-a'), { doctorId: 'clinician-a', amount: 100 }),
      setDoc(doc(db, 'bills', 'bill-b'), { doctorId: 'clinician-b', amount: 200 }),
      setDoc(doc(db, 'counters', 'bills'), { seq: 2 }),
    ]);
  });

  clinicianA = env.authenticatedContext('clinician-a').firestore();
  clinicianB = env.authenticatedContext('clinician-b').firestore();
  admin = env.authenticatedContext('admin', { admin: true }).firestore();
  guest = env.unauthenticatedContext().firestore();
});

after(async () => {
  await env?.cleanup();
});

test('clinician search returns only own appointments', async () => {
  const byName = query(collection(clinicianA, 'appointments'), where('doctorId', '==', 'clinician-a'), where('patientName', '==', 'Alex'));
  const byContact = query(collection(clinicianA, 'appointments'), where('doctorId', '==', 'clinician-a'), where('contact', '==', '123'));
  const [nameResult, contactResult] = await Promise.all([assertSucceeds(getDocs(byName)), assertSucceeds(getDocs(byContact))]);
  assert.deepEqual(nameResult.docs.map((item) => item.id), ['visit-a']);
  assert.deepEqual(contactResult.docs.map((item) => item.id), ['visit-a']);
});

test('clinicians cannot list, query, or read another clinician\'s visits', async () => {
  await assertFails(getDocs(collection(clinicianA, 'appointments')));
  await assertFails(getDocs(query(collection(clinicianA, 'appointments'), where('patientName', '==', 'Alex'))));
  await assertFails(getDocs(query(collection(clinicianA, 'appointments'), where('doctorId', '==', 'clinician-b'))));
  await assertFails(getDoc(doc(clinicianA, 'appointments', 'visit-b')));
  await assertFails(getDoc(doc(clinicianA, 'appointments', 'legacy-visit')));
  await assertFails(getDoc(doc(guest, 'appointments', 'visit-a')));
});

test('clinicians cannot forge or transfer ownership', async () => {
  await assertSucceeds(setDoc(doc(clinicianA, 'appointments', 'new-a'), { doctorId: 'clinician-a', patientName: 'Sam' }));
  await assertFails(setDoc(doc(clinicianA, 'appointments', 'forged'), { doctorId: 'clinician-b', patientName: 'Sam' }));
  await assertFails(updateDoc(doc(clinicianA, 'appointments', 'visit-a'), { doctorId: 'clinician-b' }));
  await assertFails(updateDoc(doc(clinicianA, 'appointments', 'visit-b'), { patientName: 'Changed' }));
  await assertSucceeds(setDoc(doc(clinicianA, 'bills', 'new-a'), { doctorId: 'clinician-a', amount: 50 }));
  await assertFails(setDoc(doc(clinicianA, 'bills', 'forged'), { doctorId: 'clinician-b', amount: 50 }));
  await assertFails(getDoc(doc(clinicianA, 'bills', 'bill-b')));
  await assertFails(updateDoc(doc(clinicianA, 'bills', 'bill-a'), { doctorId: 'clinician-b' }));
});

test('profile role cannot be self-elevated and admins are claim-based', async () => {
  await assertSucceeds(getDoc(doc(clinicianA, 'doctors', 'clinician-a')));
  await assertFails(getDoc(doc(clinicianA, 'doctors', 'clinician-b')));
  await assertFails(getDocs(collection(clinicianA, 'doctors')));
  await assertFails(updateDoc(doc(clinicianA, 'doctors', 'clinician-a'), { role: 'admin' }));
  const newClinician = env.authenticatedContext('new-clinician').firestore();
  const selfPromotingClinician = env.authenticatedContext('self-promoting-clinician').firestore();
  await assertSucceeds(setDoc(doc(newClinician, 'doctors', 'new-clinician'), { uid: 'new-clinician', name: 'New' }));
  await assertFails(setDoc(doc(selfPromotingClinician, 'doctors', 'self-promoting-clinician'), { uid: 'self-promoting-clinician', role: 'admin' }));
  await assertSucceeds(getDocs(collection(admin, 'appointments')));
  await assertSucceeds(getDocs(collection(admin, 'doctors')));
  await assertSucceeds(getDoc(doc(admin, 'bills', 'bill-b')));
});

test('shared bill counter only increments by one', async () => {
  await assertSucceeds(getDoc(doc(clinicianA, 'counters', 'bills')));
  await assertSucceeds(updateDoc(doc(clinicianA, 'counters', 'bills'), { seq: 3 }));
  await assertFails(updateDoc(doc(clinicianB, 'counters', 'bills'), { seq: 99 }));
  await assertFails(updateDoc(doc(clinicianB, 'counters', 'bills'), { other: 'value' }));
});
