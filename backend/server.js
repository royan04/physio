require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const multer = require('multer');
const path = require('path');
const PDFDocument = require('pdfkit');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Make sure this folder exists
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// PostgreSQL connection
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'physio_app',
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
});

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve generated bills statically
app.use('/bills', express.static(path.join(__dirname, 'bills')));

// API to get all doctors
app.get('/doctors', async (req, res) => {
  const result = await pool.query('SELECT * FROM doctors');
  res.json(result.rows);
});

// API to create a new doctor
app.post('/doctors', async (req, res) => {
  const { name, email, password_hash, specialization, phone_number } = req.body;
  const result = await pool.query(
    `INSERT INTO doctors (name, email, password_hash, specialization, phone_number) 
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [name, email, password_hash, specialization, phone_number]
  );
  res.json(result.rows[0]);
});

// Get all patients
app.get('/patients', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM patients');
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
});

// Add a patient
app.post('/patients', async (req, res) => {
  try {
    const { doctor_id, name, age, gender, phone_number, address, medical_history } = req.body;
    const result = await pool.query(
      `INSERT INTO patients 
        (doctor_id, name, age, gender, phone_number, address, medical_history)
        VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [doctor_id, name, age, gender, phone_number, address, medical_history]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
});

// Patient visit creation route with image upload
app.post('/api/patient-visits', upload.single('prescriptionFile'), async (req, res) => {
  try {
    const {
      patientName,
      age,
      gender,
      contact,
      visitDate,
      symptoms,
      diagnosis,
      prescription,
      doctorName,
      department
    } = req.body;

    const prescriptionFilePath = req.file ? req.file.path : null;

    const result = await pool.query(
      `INSERT INTO patient_visits
       (patient_name, age, gender, contact, visit_date, symptoms, diagnosis, prescription, doctor_name, department, prescription_file_path)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       RETURNING *`,
      [patientName, age, gender, contact, visitDate, symptoms, diagnosis, prescription, doctorName, department, prescriptionFilePath]
    );

    return res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Failed to save visit:', error);
    return res.status(500).json({ error: 'Failed to save visit', details: error.message });
  }
});


// Patient search route
// Patient search route - CORRECTED to search in patient_visits table
app.get('/api/patient-visits/search', async (req, res) => {
  const { q } = req.query; 
  try {
    const result = await pool.query(
      `SELECT * FROM patient_visits 
      WHERE LOWER(patient_name) LIKE LOWER($1) OR LOWER(contact) = LOWER($2)
      ORDER BY visit_date DESC`,
      [`%${q}%`, q]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});


// Follow-up creation with image upload
app.post('/api/followup', upload.single('prescription'), async (req, res) => {
  try {
    const { patientId, notes, visits } = req.body;
    const prescriptionFilePath = req.file ? req.file.path : null;

    await pool.query(
      `INSERT INTO followups (patient_id, notes, visits, prescription_file_path) VALUES ($1, $2, $3, $4)`,
      [patientId, notes, visits, prescriptionFilePath]
    );

    res.status(201).json({ message: 'Follow-up saved successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save follow-up', details: err.message });
  }
});

// Bill generation endpoint using pdfkit
app.post('/api/generate-bill', async (req, res) => {
  const {
    srNo,
    date,
    patientName,
    amount,
    paymentMode,   // e.g. Cash or Cheque
    chequeNo,
    chequeDate,
    treatment,
    duration,
    sessions,
    ratePerSession,
    sessionsDate
  } = req.body;

  try {
    // Create bills directory if not exists
    const billsDir = path.join(__dirname, 'bills');
    if (!fs.existsSync(billsDir)) {
      fs.mkdirSync(billsDir);
    }

    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const fileName = `bill-${Date.now()}.pdf`;
    const filePath = path.join(billsDir, fileName);

    const writeStream = fs.createWriteStream(filePath);
    doc.pipe(writeStream);

    // Rendering the bill (simplified, matching your uploaded image)
    doc.fontSize(12).text(`REG NO.: L-13481 (MIAP)`, 50, 30);
    doc.fontSize(20).font('Helvetica-Bold').text('RECEIPT CUM BILL', { align: 'center' });
    doc.fontSize(20).font('Helvetica-Bold').text('SHREEJI PHYSIOTHERAPY & REHAB CENTER', { align: 'center' });
    doc.fontSize(16).font('Helvetica').text('Dr. DHAVAL SHAH', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(10).text('B.PT(MIAP), CMP(NZ), CMT(AUS), C/NDT(USA), CDNP(SA), DAC, DMT', { align: 'center' });
    doc.moveDown(0.8);
    doc.fontSize(10).text('Clinic: 86/857, Ground Floor, Siddhivinayak Society, Mahavir Nagar, Near Bharat Petrol Pump Link Rd., Kandivali (W). Mumbai - 67', 50, doc.y, { align: 'center' });
    doc.text('Timing: Mon to Sat', { align: 'center' });
    doc.text('Morning 9.00am to 1.00pm & Evening 3.00pm to 8.00pm', { align: 'center' });
    doc.moveDown(1);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();

    // Bill fields
    doc.moveDown();
    doc.fontSize(12).text(`Sr. No.: ${srNo}`, 50, doc.y, { continued: true });
    doc.text(`Date: ${date}`, { align: 'right' });

    doc.moveDown();
    doc.text(`RECEIVED from Mr./Mrs.: ${patientName}`, 50);
    doc.text(`The sum of Rs.: ${amount}`, 50);
    doc.text(`In ${paymentMode} / Cheque No.: ${chequeNo}    Dated: ${chequeDate}  being fees for treatment of ${treatment}`, 50);
    doc.moveDown();
    doc.text(`Duration: ${duration}`, 50);
    doc.text(`No. of Sessions: ${sessions}`, 50);
    doc.text(`Rate per session: ${ratePerSession}`, 50);
    doc.text(`Sessions Date: ${sessionsDate}`, 50);

    doc.moveDown(4);
    doc.fontSize(14).text('Dr. Dhaval Shah', { align: 'right' });

    doc.end();

    writeStream.on('finish', () => {
      res.json({ url: `/bills/${fileName}` });
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate PDF bill' });
  }
});

// Start server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
