import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { db, auth } from "../firebaseConfig";
import { Capacitor } from "@capacitor/core";
import { Filesystem, Directory, Encoding } from "@capacitor/filesystem";
import {
  collection,
  addDoc,
  doc,
  getDoc,
  runTransaction,
} from "firebase/firestore";
import "./PatientVisitForm.css";

function NewAppointment() {
  const navigate = useNavigate();
  const location = useLocation();
  const prefilled = location.state?.patient || {};
  const timingSelection = location.state?.timingSelection || localStorage.getItem('doctorTimingSelection') || 'morning';
  const [prescriptionImage, setPrescriptionImage] = useState(null);

  // Patient Info
  const [patientName, setPatientName] = useState(prefilled.patientName || "");
  const [age, setAge] = useState(prefilled.age || "");
  const [gender, setGender] = useState(prefilled.gender || "");
  const [contact, setContact] = useState(prefilled.contact || "");

  // Doctor Info
  const [doctorName, setDoctorName] = useState("");
  const [department, setDepartment] = useState("");
  const [doctorEmail, setDoctorEmail] = useState("");

  // Visit Info
  const [visitDate, setVisitDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [diagnosis, setDiagnosis] = useState(prefilled.diagnosis || "");
  const [symptoms, setSymptoms] = useState(prefilled.symptoms || "");
  const [prescription, setPrescription] = useState(prefilled.prescription || "");
  const [loading, setLoading] = useState(false);

  // Session / Billing additions
  const [session, setSession] = useState({
    durationMins: "",
    fees: "",
    amountPaid: "",
    notes: "",
    noOfSessions: "",
    ratePerSession: "",
    sessionsDateText: "",
    payMode: "Cash",
    chequeNo: "",
    chequeDate: "",
    upiId: "",
    upiTxnId: "",
  });
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [billNo, setBillNo] = useState("");
  const [billModalHtml, setBillModalHtml] = useState(null);
  const [billModalFileName, setBillModalFileName] = useState("");

  // 👈 NEW: Dynamic clinic timing based on login selection
  const getClinicTiming = () => {
    switch (timingSelection) {
      case 'morning':
        return {
          timing1: "Timing: Mon to Sat",
          timing2: "Morning 8.00am to 1.00pm",
          timing3: "",
        };
      case 'evening':
        return {
          timing1: "Timing: Mon to Sat",
          timing2: "Evening 2.00pm to 7.00pm",
          timing3: "",
        };
      case 'both':
        return {
          timing1: "Timing: Mon to Sat",
          timing2: "Morning 8.00am to 1.00pm",
          timing3: "Evening 2.00pm to 7.00pm",
        };
      default:
        return {
          timing1: "Timing: Mon to Sat",
          timing2: "Morning 8.00am to 1.00pm",
          timing3: "Evening 2.00pm to 7.00pm",
        };
    }
  };

  // Fetch logged-in doctor's info using UID
  useEffect(() => {
    const fetchDoctorData = async () => {
      const user = auth.currentUser;
      if (user) {
        setDoctorEmail(user.email || "");
        try {
          const docRef = doc(db, "doctors", user.uid);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            const data = docSnap.data();
            setDoctorName(data.name || "");
            setDepartment(data.department || "");
          } else {
            console.warn("⚠️ No doctor profile found for UID:", user.uid);
          }
        } catch (error) {
          console.error("Error fetching doctor data:", error);
        }
      }
    };
    fetchDoctorData();

    if (prefilled.session) {
      setSession((prev) => ({
        ...prev,
        durationMins: String(prefilled.session.durationMins ?? "") || "",
        fees: String(prefilled.session.fees ?? "") || "",
        amountPaid: String(prefilled.session.amountPaid ?? "") || "",
        notes: prefilled.session.notes ?? "",
        noOfSessions:
          prefilled.session.noOfSessions !== undefined
            ? String(prefilled.session.noOfSessions)
            : "",
        ratePerSession:
          prefilled.session.ratePerSession !== undefined
            ? String(prefilled.session.ratePerSession)
            : "",
        sessionsDateText: prefilled.session.sessionsDateText || "",
        payMode: prefilled.session.payMode || "Cash",
        chequeNo: prefilled.session.chequeNo || "",
        chequeDate: prefilled.session.chequeDate || "",
        upiId: prefilled.session.upiId || "",
        upiTxnId: prefilled.session.upiTxnId || "",
      }));
    }
  }, [prefilled]);
  // 🔹 Upload prescription image to GoDaddy
  async function uploadPrescriptionImage(file) {
    const formData = new FormData();
    formData.append("image", file);

    const response = await fetch("http://metamorphhr.in/upload.php", {
      method: "POST",
      body: formData
    });

    const data = await response.json();
    return data.url;
  }

  // Firestore atomic bill counter -> BILL-YYYYMMDD-00001
  async function nextBillNumber(db) {
    const counterRef = doc(db, "counters", "bills");
    const seq = await runTransaction(db, async (tx) => {
      const snap = await tx.get(counterRef);
      const current = snap.exists() ? snap.data().seq || 0 : 0;
      const next = current + 1;
      tx.set(counterRef, { seq: next }, { merge: true });
      return next;
    });
    const d = new Date();
    const yyyymmdd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(
      2,
      "0"
    )}${String(d.getDate()).padStart(2, "0")}`;
    return `BILL-${yyyymmdd}-${String(seq).padStart(5, "0")}`;
  }

  // 👈 SAME EXACT BILL PRINT FUNCTION FROM DASHBOARD
  async function openReceiptBill({
    billNo,
    billDate,
    clinic = {
      regNo: "L-13481 (MIAP)",
      name: "SHREEJI PHYSIOTHERAPY & REHAB CENTER",
      doctor: doctorName || "Dr. DHAVAL SHAH",
      quals:
        "B.PT(MIAP), CMP(NZ), CMT(AUS), C/NDT(USA), CDNP(SA), DAC, DMT",
      address:
        "86/857, Ground Floor, Siddhivinayak Society, Mahavir Nagar, Near Bharat Petrol Pump Link Rd., Kandivali (W). Mumbai - 67",
      phone: "Mob.: 98924 09810",
      email: "Email: dhavalphysio@yahoo.co.in",
      ...getClinicTiming() // 👈 DYNAMIC TIMING FROM LOGIN
    },
    patientName,
    amount,
    payMode,
    chequeNo,
    chequeDate,
    upiId,
    upiTxnId,
    treatmentOf,
    durationText,
    noOfSessions,
    ratePerSession,
    sessionsDateText,
    doctorSign,
  }) {
    const rupees = (Number(amount) || 0).toFixed(2);
    const dateStr =
      billDate instanceof Date
        ? billDate.toLocaleDateString()
        : String(billDate || "");

    const html = `
    <div style="font-family: Arial, sans-serif; color:#000; padding:24px 28px; width:900px; margin:0 auto;">
      <div style="display:flex; justify-content:space-between; font-size:12px;">
        <div>REG NO.: ${clinic.regNo}</div>
        <div style="text-align:right">${clinic.phone}<br/>${clinic.email}</div>
      </div>

      <h2 style="text-align:center; margin:8px 0 0; letter-spacing:1px;">RECEIPT CUM BILL</h2>
      <h1 style="text-align:center; margin:6px 0 0; font-size:26px;">${clinic.name}</h1>
      <h2 style="text-align:center; margin:6px 0 0; font-size:22px;">${clinic.doctor}</h2>
      <div style="text-align:center; font-size:12px; margin-top:4px;">${clinic.quals}</div>

      <div style="display:flex; gap:12px; align-items:flex-start; margin:14px 0;">
        <div style="border-left:4px solid #1f1f1f; padding-left:10px; flex:1; font-size:12px;">
          Clinic: ${clinic.address}
        </div>
        <div style="text-align:center; font-size:12px; padding:0 8px; white-space:nowrap;">
          <div style="font-weight:bold;">${clinic.timing1}</div>
          <div>${clinic.timing2}</div>
          
          <div>${clinic.timing3}</div>
        </div>
      </div>

      <div style="height:1px; background:#000; margin:10px 0;"></div>

      <div style="display:flex; justify-content:space-between; margin:10px 0 18px; font-size:16px;">
        <div>Sr. No.: <span style="display:inline-block; min-width:180px; border-bottom:1px solid #000;">${billNo}</span></div>
        <div>Date: <span style="display:inline-block; min-width:160px; border-bottom:1px solid #000;">${dateStr}</span></div>
      </div>

      <div style="font-size:16px; margin:10px 0;">
        RECEIVED from Mr./Mrs.
        <span style="display:inline-block; min-width:650px; border-bottom:1px solid #000;">${patientName || ""}</span>
      </div>

      <div style="font-size:16px; margin:14px 0;">
        The sum of Rs.
        <span style="display:inline-block; min-width:720px; border-bottom:1px solid #000;">${rupees}</span>
      </div>

      <div style="font-size:16px; margin:14px 0;">
        In ${payMode}
        ${payMode === "Cheque"
          ? `/ Cheque No.
        <span style="display:inline-block; min-width:220px; border-bottom:1px solid #000;">${chequeNo || ""}</span>
        Dated
        <span style="display:inline-block; min-width:220px; border-bottom:1px solid #000;">${chequeDate || ""}</span>`
          : payMode === "UPI"
            ? `/ UPI ID
        <span style="display:inline-block; min-width:220px; border-bottom:1px solid #000;">${upiId || ""}</span>
        Txn ID
        <span style="display:inline-block; min-width:220px; border-bottom:1px solid #000;">${upiTxnId || ""}</span>`
            : ""}
        being fees for the treatment of
      </div>

      <span style="display:inline-block; min-width:260px; border-bottom:1px solid #000; padding:0 4px;">
      ${treatmentOf || ""}
    </span>

      <div style="font-size:16px; margin:12px 0;">
        Duration
        <span style="display:inline-block; min-width:300px; border-bottom:1px solid #000;">${durationText || ""}</span>
      </div>

      <div style="font-size:16px; margin:12px 0;">
        No. of Sessions
        <span style="display:inline-block; min-width:260px; border-bottom:1px solid #000;">${noOfSessions ?? ""}</span>
      </div>

      <div style="font-size:16px; margin:12px 0;">
        Rate per session
        <span style="display:inline-block; min-width:260px; border-bottom:1px solid #000;">${Number(ratePerSession || 0).toFixed(2)}</span>
      </div>

      <div style="font-size:16px; margin:12px 0 28px;">
        Sessions Date
        <span style="display:inline-block; min-width:420px; border-bottom:1px solid #000;">${sessionsDateText || ""}</span>
      </div>

      <div style="display:flex; justify-content:flex-end; margin-top:48px; font-size:18px; font-weight:bold;">
        ${doctorSign}
      </div>
    </div>
    `;
    const billHtml = `<!doctype html><html><head><meta charset="utf-8" /><title>${billNo || "Bill"}</title></head><body>${html}</body></html>`;

    if (Capacitor.isNativePlatform()) {
      const safeBillNo = String(billNo || "bill").replace(/[^a-zA-Z0-9-_]/g, "_");
      const fileName = `${safeBillNo}.html`;
      try {
        await Filesystem.writeFile({
          path: fileName,
          data: billHtml,
          directory: Directory.Documents,
          encoding: Encoding.UTF8,
          recursive: true,
        });
      } catch (fsErr) {
        console.warn("Could not save file:", fsErr);
      }
      setBillModalHtml(billHtml);
      setBillModalFileName(fileName);
      return { savedToDevice: true, fileName };
    }

    const w = window.open("", "_blank");
    w.document.write(billHtml);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 200);
    return { savedToDevice: false };
  }

  // Save appointment in Firestore
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // 🔹 STEP A: Upload image first
      let prescriptionImageUrl = "";

      if (prescriptionImage) {
        prescriptionImageUrl = await uploadPrescriptionImage(prescriptionImage);
      }


      await addDoc(collection(db, "appointments"), {
        patientName,
        age,
        gender,
        contact,
        doctorName,
        department,
        doctorEmail,
        doctorId: auth.currentUser?.uid || "",
        visitDate,
        symptoms,
        diagnosis,
        prescription,
        session: {
          durationMins: Number(session.durationMins || 0),
          fees: Number(session.fees || 0),
          amountPaid: Number(session.amountPaid || 0),
          notes: session.notes || "",
          noOfSessions: Number(session.noOfSessions || 0),
          ratePerSession: Number(session.ratePerSession || 0),
          sessionsDateText: session.sessionsDateText || "",
          payMode: session.payMode,
          chequeNo: session.chequeNo || "",
          chequeDate: session.chequeDate || "",
          upiId: session.upiId || "",
          upiTxnId: session.upiTxnId || "",
        },
        prescriptionImageUrl,
        createdAt: new Date().toISOString(),
      });

      alert("✅ Appointment saved successfully!");
      navigate("/follow-up");
    } catch (error) {
      console.error("Error saving appointment:", error);
      alert("❌ Error saving appointment. Try again.");
    } finally {
      setLoading(false);
    }
  };

  // Generate bill: create serial, save bill doc, open print view
  const handleGenerateBill = async () => {
    try {
      setLoading(true);
      const serial = await nextBillNumber(db);
      setBillNo(serial);

      const billData = {
        billNo: serial,
        patientName,
        doctorName,
        department,
        visitDate,
        durationMins: Number(session.durationMins || 0),
        fees: Number(session.fees || 0),
        amountPaid: Number(session.amountPaid || 0),
        notes: session.notes || "",
        noOfSessions: Number(session.noOfSessions || 0),
        ratePerSession: Number(session.ratePerSession || 0),
        sessionsDateText: session.sessionsDateText || "",
        payMode: session.payMode,
        chequeNo: session.chequeNo || "",
        chequeDate: session.chequeDate || "",
        upiId: session.upiId || "",
        upiTxnId: session.upiTxnId || "",
        createdAt: new Date().toISOString(),
        doctorId: auth.currentUser?.uid || "",
      };

      await addDoc(collection(db, "bills"), billData);

      const billResult = await openReceiptBill({
        billNo: serial,
        billDate: new Date(),
        patientName,
        amount:
          session.ratePerSession && session.noOfSessions
            ? Number(session.ratePerSession) * Number(session.noOfSessions)
            : Number(session.fees || 0),
        payMode: session.payMode,
        chequeNo: session.chequeNo,
        chequeDate: session.chequeDate,
        upiId: session.upiId,
        upiTxnId: session.upiTxnId,
        treatmentOf: diagnosis || symptoms || "physiotherapy",
        durationText: `${session.durationMins || 0} minutes`,
        noOfSessions: session.noOfSessions || "",
        ratePerSession: session.ratePerSession || session.fees || 0,
        sessionsDateText: session.sessionsDateText || visitDate,
        doctorSign: doctorName || "Dr. Dhaval Shah",
      });

      if (!billResult?.savedToDevice) {
        navigate("/dashboard");
      }
    } catch (e) {
      console.error(e);
      alert("Could not generate bill. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Share bill using Web Share API (works on Android)
  const handleShareBill = async () => {
    if (!billModalHtml) return;
    try {
      const blob = new Blob([billModalHtml], { type: "text/html" });
      const file = new File([blob], billModalFileName || "bill.html", { type: "text/html" });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: "Physiotherapy Bill",
          text: "Please find your bill attached.",
          files: [file],
        });
      } else {
        // Fallback: trigger print of iframe
        const iframeEl = document.getElementById("bill-preview-iframe");
        if (iframeEl) {
          iframeEl.contentWindow.focus();
          iframeEl.contentWindow.print();
        }
      }
    } catch (err) {
      console.error("Share failed:", err);
    }
  };

  // In-app bill preview modal (shown after bill is generated on Android)
  if (billModalHtml) {
    return (
      <div style={{
        position: "fixed",
        top: 0, left: 0, right: 0, bottom: 0,
        zIndex: 9999,
        background: "#fff",
        display: "flex",
        flexDirection: "column",
      }}>
        {/* Top bar */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 16px",
          background: "#1a1a2e",
          color: "#fff",
          flexShrink: 0,
        }}>
          <button
            onClick={() => { setBillModalHtml(null); navigate("/dashboard"); }}
            style={{
              background: "none",
              border: "1.5px solid #fff",
              color: "#fff",
              borderRadius: 8,
              padding: "6px 14px",
              fontSize: 15,
              cursor: "pointer",
            }}
          >
            ← Done
          </button>
          <span style={{ fontWeight: "bold", fontSize: 16 }}>Bill Preview</span>
          <button
            onClick={handleShareBill}
            style={{
              background: "#4caf50",
              border: "none",
              color: "#fff",
              borderRadius: 8,
              padding: "6px 14px",
              fontSize: 15,
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            📤 Share
          </button>
        </div>
        {/* Bill iframe - renders HTML inside the app */}
        <iframe
          id="bill-preview-iframe"
          srcDoc={billModalHtml}
          style={{
            flex: 1,
            width: "100%",
            border: "none",
            background: "#fff",
          }}
          title="Bill Preview"
          sandbox="allow-same-origin allow-scripts"
        />
      </div>
    );
  }

  // ... rest of your JSX remains EXACTLY THE SAME ...
  return (
    <div className="visit-form-wrapper">
      <h2 className="form-title">🩺 New Appointment</h2>
      {/* ALL YOUR EXISTING FORM JSX - NO CHANGES NEEDED */}
      <form className="visit-form" onSubmit={handleSubmit}>
        {/* Patient Info */}
        <div className="form-section">
          <h3>Patient Info</h3>
          <div className="form-grid">
            <input
              type="text"
              placeholder="Patient Name"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              required
            />
            <input
              type="number"
              placeholder="Age"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              required
            />
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              required
            >
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
            <input
              type="text"
              placeholder="Contact Number"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              required
            />
          </div>
        </div>

        {/* Doctor Info */}
        <div className="form-section">
          <h3>Doctor Info</h3>
          <div className="form-grid">
            <input
              type="text"
              placeholder="Doctor Name"
              value={doctorName}
              onChange={(e) => setDoctorName(e.target.value)}
              readOnly={!!doctorName}
            />
            <input
              type="text"
              placeholder="Department"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              readOnly={!!department}
            />
          </div>
          <p style={{ fontSize: "0.9rem", color: "#777" }}>
            (Doctor info auto-filled — editable if needed)
          </p>
        </div>

        {/* Visit Details */}
        <div className="form-section">
          <h3>Visit Details</h3>
          <input
            type="date"
            value={visitDate}
            onChange={(e) => setVisitDate(e.target.value)}
            required
          />
          <textarea
            placeholder="Symptoms"
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
          />
          <textarea
            placeholder="Diagnosis"
            value={diagnosis}
            onChange={(e) => setDiagnosis(e.target.value)}
          />
          <textarea
            placeholder="Prescription"
            value={prescription}
            onChange={(e) => setPrescription(e.target.value)}
          />
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setPrescriptionImage(e.target.files[0])}
            style={{ marginTop: "8px" }}
          />

          {/* 👇 IMAGE PREVIEW GOES HERE */}
          {prescriptionImage && (
            <img
              src={URL.createObjectURL(prescriptionImage)}
              alt="Prescription Preview"
              style={{
                width: "200px",
                borderRadius: "8px",
                marginTop: "8px",
                border: "1px solid #ddd"
              }}
            />
          )}


          {/* Session fields */}
          <div className="form-grid" style={{ marginTop: 12 }}>
            <input
              type="number"
              placeholder="Session Duration (mins)"
              value={session.durationMins}
              onChange={(e) =>
                setSession((s) => ({ ...s, durationMins: e.target.value }))
              }
            />
            <input
              type="number"
              placeholder="Fees / Total Cost (₹)"
              value={session.fees}
              onChange={(e) =>
                setSession((s) => ({ ...s, fees: e.target.value }))
              }
            />
          </div>

          <div className="form-grid" style={{ marginTop: 12 }}>
            <input
              type="number"
              placeholder="Amount Paid (₹)"
              value={session.amountPaid}
              onChange={(e) =>
                setSession((s) => ({ ...s, amountPaid: e.target.value }))
              }
            />
          </div>

          <div className="form-grid" style={{ marginTop: 12 }}>
            <input
              type="number"
              placeholder="No. of Sessions"
              value={session.noOfSessions}
              onChange={(e) =>
                setSession((s) => ({ ...s, noOfSessions: e.target.value }))
              }
            />
            <input
              type="number"
              placeholder="Rate per session (₹)"
              value={session.ratePerSession}
              onChange={(e) =>
                setSession((s) => ({ ...s, ratePerSession: e.target.value }))
              }
            />
          </div>

          <div className="form-grid" style={{ marginTop: 12 }}>
            <input
              type="text"
              placeholder="Sessions Date (e.g., 04–10 Nov 2025)"
              value={session.sessionsDateText}
              onChange={(e) =>
                setSession((s) => ({ ...s, sessionsDateText: e.target.value }))
              }
            />
            <select
              value={session.payMode}
              onChange={(e) =>
                setSession((s) => ({ ...s, payMode: e.target.value }))
              }
            >
              <option value="Cash">Cash</option>
              <option value="Cheque">Cheque</option>
              <option value="UPI">UPI</option>
            </select>
          </div>

          {session.payMode === "Cheque" && (
            <div className="form-grid" style={{ marginTop: 12 }}>
              <input
                type="text"
                placeholder="Cheque No."
                value={session.chequeNo}
                onChange={(e) =>
                  setSession((s) => ({ ...s, chequeNo: e.target.value }))
                }
              />
              <input
                type="text"
                placeholder="Cheque Date (DD/MM/YYYY)"
                value={session.chequeDate}
                onChange={(e) =>
                  setSession((s) => ({ ...s, chequeDate: e.target.value }))
                }
              />
            </div>
          )}

          {session.payMode === "UPI" && (
            <div className="form-grid" style={{ marginTop: 12 }}>
              <input
                type="text"
                placeholder="UPI ID"
                value={session.upiId}
                onChange={(e) =>
                  setSession((s) => ({ ...s, upiId: e.target.value }))
                }
              />
              <input
                type="text"
                placeholder="UPI Transaction ID"
                value={session.upiTxnId}
                onChange={(e) =>
                  setSession((s) => ({ ...s, upiTxnId: e.target.value }))
                }
              />
            </div>
          )}

          <textarea
            placeholder="Session Notes"
            value={session.notes}
            onChange={(e) =>
              setSession((s) => ({ ...s, notes: e.target.value }))
            }
            style={{ marginTop: 8 }}
          />
        </div>

        {/* Actions */}
        <div className="form-actions">

          <button
            type="button"
            className="btn-outline"
            onClick={() => setShowSessionModal(true)}
          >
            View Session Details
          </button>

          <button
            type="button"
            className="btn-red"
            onClick={handleGenerateBill}
            disabled={loading}
          >
            {loading ? "Generating..." : "🧾 Generate Bill"}
          </button>

          <button type="submit" className="btn-red" disabled={loading}>
            {loading ? "Saving..." : "💾 Save Appointment"}
          </button>

          <button
            type="button"
            className="btn-outline"
            onClick={() => navigate("/follow-up")}
          >
            Cancel
          </button>

        </div>

      </form>

      {/* Session Details Modal */}
      {showSessionModal && (
        <div
          className="modal-backdrop"
          onClick={() => setShowSessionModal(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff",
              padding: 20,
              borderRadius: 8,
              width: "min(560px, 92vw)",
              boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
            }}
          >
            <h3 style={{ marginTop: 0 }}>Session Details</h3>
            <p>
              <strong>Timing:</strong> {timingSelection.toUpperCase()} ({timingSelection === 'morning' ? '9 AM - 2 PM' : timingSelection === 'evening' ? '2 PM - 7 PM' : '9 AM - 7 PM'})
            </p>
            <p>
              <strong>Patient:</strong> {String(patientName ?? "")}
            </p>
            <p>
              <strong>Doctor:</strong> {String(doctorName ?? "")} ({String(department ?? "")})
            </p>
            <p>
              <strong>Date:</strong> {String(visitDate ?? "")}
            </p>
            <p>
              <strong>Duration:</strong> {Number(session.durationMins || 0)} mins
            </p>
            <p>
              <strong>Fees:</strong> ₹{Number(session.fees || 0)}
            </p>
            <p>
              <strong>No. of Sessions:</strong> {String(session.noOfSessions || "-")}
            </p>
            <p>
              <strong>Rate per session:</strong> ₹{String(session.ratePerSession || session.fees || "-")}
            </p>
            <p>
              <strong>Sessions Date:</strong> {String(session.sessionsDateText || "-")}
            </p>
            <p>
              <strong>Payment Mode:</strong> {String(session.payMode || "")}
            </p>
            {session.payMode === "Cheque" ? (
              <>
                <p>
                  <strong>Cheque No.:</strong> {String(session.chequeNo || "-")}
                </p>
                <p>
                  <strong>Cheque Date:</strong> {String(session.chequeDate || "-")}
                </p>
              </>
            ) : null}
            {session.payMode === "UPI" ? (
              <>
                <p>
                  <strong>UPI ID:</strong> {String(session.upiId || "-")}
                </p>
                <p>
                  <strong>UPI Transaction ID:</strong> {String(session.upiTxnId || "-")}
                </p>
              </>
            ) : null}
            <p>
              <strong>Notes:</strong> {String(session.notes || "-")}
            </p>
            {billNo ? (
              <p>
                <strong>Last Bill No:</strong> {String(billNo)}
              </p>
            ) : null}

            <div className="form-actions" style={{ marginTop: 16 }}>
              <button
                className="btn-outline"
                onClick={() => setShowSessionModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default NewAppointment;
