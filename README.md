# Shreeji Physiotherapy & Rehab Center — Web App

A full-stack web application for managing patient visits, appointments, follow-ups, and billing for a physiotherapy clinic.

## Tech Stack

| Layer    | Technology                          |
| -------- | ----------------------------------- |
| Frontend | React 19 + Vite + React Router      |
| Backend  | Node.js + Express 5                 |
| Database | PostgreSQL                          |
| Auth     | Firebase Authentication             |
| Storage  | Firebase Cloud Storage              |
| Mobile   | Capacitor (Android)                 |

## Project Structure

```
physio/
├── backend/           # Express API server
│   ├── server.js      # All routes & DB logic
│   ├── uploads/       # Patient prescription images (gitignored)
│   ├── bills/         # Generated PDF bills (gitignored)
│   └── .env.example   # Environment variable template
├── frontend/          # React + Vite SPA
│   ├── src/
│   │   ├── pages/     # Login, Dashboard, Appointments, Bills, etc.
│   │   ├── components/# Header, Footer, Layout
│   │   └── firebaseConfig.js
│   ├── android/       # Capacitor Android project
│   └── .env.example   # Environment variable template
└── .gitignore
```

## Getting Started

### Prerequisites

- **Node.js** (v18+)
- **PostgreSQL** (v14+)
- A **Firebase** project with Auth, Firestore, and Storage enabled

### 1. Clone the repository

```bash
git clone https://github.com/<your-username>/physio.git
cd physio
```

### 2. Set up the backend

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your PostgreSQL credentials
```

Create the required PostgreSQL tables:

```sql
CREATE TABLE doctors (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255),
  email VARCHAR(255),
  password_hash VARCHAR(255),
  specialization VARCHAR(255),
  phone_number VARCHAR(20)
);

CREATE TABLE patients (
  id SERIAL PRIMARY KEY,
  doctor_id INTEGER REFERENCES doctors(id),
  name VARCHAR(255),
  age INTEGER,
  gender VARCHAR(10),
  phone_number VARCHAR(20),
  address TEXT,
  medical_history TEXT
);

CREATE TABLE patient_visits (
  id SERIAL PRIMARY KEY,
  patient_name VARCHAR(255),
  age INTEGER,
  gender VARCHAR(10),
  contact VARCHAR(20),
  visit_date DATE,
  symptoms TEXT,
  diagnosis TEXT,
  prescription TEXT,
  doctor_name VARCHAR(255),
  department VARCHAR(255),
  prescription_file_path TEXT
);

CREATE TABLE followups (
  id SERIAL PRIMARY KEY,
  patient_id INTEGER,
  notes TEXT,
  visits TEXT,
  prescription_file_path TEXT
);
```

Start the backend:

```bash
npm start
```

The server runs on `http://localhost:4000` by default.

### 3. Set up the frontend

```bash
cd frontend
npm install
cp .env.example .env
# Edit .env with your Firebase credentials
```

Start the dev server:

```bash
npm run dev
```

The app runs on `http://localhost:5173` by default.

### 4. (Optional) Build for Android

```bash
cd frontend
npm run build
npx cap sync
npx cap open android
```

## Environment Variables

### Backend (`backend/.env`)

| Variable      | Description               |
| ------------- | ------------------------- |
| `DB_USER`     | PostgreSQL username       |
| `DB_HOST`     | PostgreSQL host           |
| `DB_NAME`     | PostgreSQL database name  |
| `DB_PASSWORD` | PostgreSQL password       |
| `DB_PORT`     | PostgreSQL port           |
| `PORT`        | Server port (default 4000)|

### Frontend (`frontend/.env`)

| Variable                            | Description                |
| ----------------------------------- | -------------------------- |
| `VITE_FIREBASE_API_KEY`             | Firebase API key           |
| `VITE_FIREBASE_AUTH_DOMAIN`         | Firebase Auth domain       |
| `VITE_FIREBASE_PROJECT_ID`          | Firebase project ID        |
| `VITE_FIREBASE_STORAGE_BUCKET`      | Firebase storage bucket    |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender  |
| `VITE_FIREBASE_APP_ID`              | Firebase app ID            |
| `VITE_FIREBASE_MEASUREMENT_ID`      | Firebase measurement ID    |

## License

ISC
