# Firestore ownership rules deployment

The rules in `firestore.rules` protect patient appointments and bills by Firebase Auth UID. They are not active until deployed. Do not deploy them over an existing production ruleset without reviewing and merging any other collection rules first: a Firestore rules deployment replaces the deployed ruleset.

1. From `frontend/`, run `npm run test:rules` (Java 17 or newer is needed for the pinned emulator CLI). The test project is `demo-physio-isolation`; it does not access production.
2. Set `FIREBASE_PROJECT_ID` to the production Firebase project and `GOOGLE_APPLICATION_CREDENTIALS` to an operator service-account JSON file stored **outside this repository**. Run `npm run firestore:audit-owners`. It prints only document IDs, not patient details, and exits unsuccessfully if an appointment or bill lacks `doctorId`.
3. Resolve every reported document against authoritative clinic records and set its correct clinician's Firebase Auth UID as `doctorId` using a trusted Admin SDK process or the Firebase console. Do not infer ownership from a patient name, phone number, or a possibly duplicated doctor name. Re-run the audit until it passes. Documents without ownership remain inaccessible to clinicians under the new rules.
4. For each existing administrator, run `npm run firestore:grant-admin -- <firebase-auth-uid>` with the same operator credentials. This adds a trusted Auth `admin` custom claim while preserving any existing claims. The administrator must sign out and sign in again. A Firestore `role: "admin"` field or browser local storage does not grant admin access.
5. Review the current deployed rules and indexes, merge any additional policy, then deploy from `frontend/` with `firebase deploy --only firestore --project <production-project-id>`. The two new compound indexes may take time to build; patient-name/contact searches may need to wait until they are ready.

Never place service-account credentials in the frontend bundle, this repository, or a mobile app.
