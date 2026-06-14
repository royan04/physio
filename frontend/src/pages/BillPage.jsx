// src/pages/BillPage.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { Filesystem, Directory, Encoding } from "@capacitor/filesystem";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  onSnapshot,
  addDoc,
  runTransaction,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../firebaseConfig";

const BillPage = () => {
  const navigate = useNavigate();

  const [doctor, setDoctor] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPatientKey, setSelectedPatientKey] = useState("");
  const [selectedApptId, setSelectedApptId] = useState("");
  const [loading, setLoading] = useState(false);
  const [billNo, setBillNo] = useState("");
  // In-app bill preview modal state
  const [billModalHtml, setBillModalHtml] = useState(null);
  const [billModalFileName, setBillModalFileName] = useState("");

  // Get timing from multiple sources + localStorage backup
  const location = useLocation();
  const navTiming = location.state?.timingSelection || location.state?.patient?.timingSelection;
  const localTiming = localStorage.getItem('doctorTimingSelection');
  const timingSelection = navTiming || localTiming || 'morning';

  // Save to localStorage as backup (for direct navigation)
  localStorage.setItem('doctorTimingSelection', timingSelection);

  // Dynamic clinic timings function
  const getDynamicClinicTimings = () => {
    switch (timingSelection) {
      case 'morning':
        return {
          timing1: "Mon to Sat",
          timing2: "Morning 8.00am to 1.00pm",
        };
      case 'evening':
        return {
          timing1: "Mon to Sat",
          timing2: "Evening 2.00pm to 7.00pm",
        };
      case 'both':
        return {
          timing1: "Mon to Sat",
          timing2: "Morning 8.00am to 1.00pm",
          timing3: "Evening 2.00pm to 7.00pm"
        };
      default:
        return {
          timing1: "Morning 8.00am to 1.00pm",
          timing2: "",
          timing3: ""
        };
    }
  };

  // 1) Auth + doctor + all appointments for this doctor
  useEffect(() => {
    let unsubscribeDoc;
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        navigate("/login");
        return;
      }
      const docRef = doc(db, "doctors", user.uid);
      unsubscribeDoc = onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
          setDoctor({ id: user.uid, ...docSnap.data() });
        }
      });

      await fetchAppointments(user.uid);
      setLoading(false);
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeDoc) unsubscribeDoc();
    };
  }, [navigate]);

  const fetchAppointments = async (doctorId) => {
    try {
      const q = query(
        collection(db, "appointments"),
        where("doctorId", "==", doctorId)
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setAppointments(data);
    } catch (e) {
      console.error("Error fetching appointments:", e);
      setAppointments([]);
    }
  };

  // 2) Build unique patients list from all appointments
  const patientsMap = new Map();
  appointments.forEach((appt) => {
    const key = appt.contact || appt.patientName;
    if (!key) return;
    if (!patientsMap.has(key)) {
      patientsMap.set(key, {
        key,
        name: appt.patientName || "",
        contact: appt.contact || "",
      });
    }
  });
  const allPatients = Array.from(patientsMap.values());

  // 3) Filter by search term (name or phone)
  const filteredPatients = allPatients.filter((p) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      p.name.toLowerCase().includes(term) ||
      p.contact.toLowerCase().includes(term)
    );
  });

  // 4) Appointments for selected patient
  const selectedPatientAppointments = appointments.filter((appt) => {
    if (!selectedPatientKey) return false;
    return (
      appt.contact === selectedPatientKey ||
      (!appt.contact && appt.patientName === selectedPatientKey)
    );
  });

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

  // Dynamic clinic object with timingSelection
  const getClinicData = () => ({
    regNo: doctor?.regNo || "L-13481 (MIAP)",
    name: doctor?.clinicName || "SHREEJI PHYSIOTHERAPY & REHAB CENTER",
    doctor: doctor?.name || "Dr. DHAVAL SHAH",
    quals: doctor?.quals || "B.PT(MIAP), CMP(NZ), CMT(AUS), C/NDT(USA), CDNP(SA), DAC, DMT",
    address: doctor?.address || "86/857, Ground Floor, Siddhivinayak Society, Mahavir Nagar, Near Bharat Petrol Pump Link Rd., Kandivali (W). Mumbai - 67",
    phone: "Mob.: 98924 09810",
    email: "Email: dhavalphysio@yahoo.co.in",
    ...getDynamicClinicTimings()
  });

  // Build bill HTML (shared by modal + share)
  function buildBillHtml({
    billNo,
    billDate,
    clinic,
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
<div style="font-family: Arial, sans-serif; color:#000; padding:24px 28px; width:900px; margin:0 auto; box-sizing:border-box;">
  <!-- Header top row -->
  <div style="display:flex; justify-content:space-between; align-items:flex-start; font-size:12px; line-height:1.4;">
    <div style="white-space:pre-line;">
      REG NO.: ${clinic.regNo}
    </div>
    <div style="text-align:right; white-space:pre-line;">
      ${clinic.phone}
      ${clinic.email ? `<br/>${clinic.email}` : ""}
    </div>
  </div>

  <!-- Title and clinic info -->
  <h2 style="text-align:center; margin:8px 0 0; letter-spacing:1px;">RECEIPT CUM BILL</h2>
  <h1 style="text-align:center; margin:6px 0 0; font-size:26px;">${clinic.name}</h1>
  <h2 style="text-align:center; margin:6px 0 0; font-size:22px;">${clinic.doctor}</h2>
  <div style="text-align:center; font-size:12px; margin-top:4px;">${clinic.quals}</div>

  <!-- Address + timings row -->
  <div style="display:flex; justify-content:space-between; gap:12px; align-items:stretch; margin:14px 0;">
    <div style="border-left:4px solid #1f1f1f; padding-left:10px; flex:1; font-size:12px; line-height:1.5;">
      Clinic: ${clinic.address}
    </div>
    <div style="text-align:center; font-size:12px; padding:0 8px; white-space:nowrap; display:flex; flex-direction:column; justify-content:center; line-height:1.4;">
      <div style="font-weight:bold;">${clinic.timing1}</div>
      <div>${clinic.timing2 || ''}</div>
      <div>${clinic.timing3 || ''}</div>
    </div>
  </div>

  <div style="height:1px; background:#000; margin:10px 0;"></div>

  <!-- Sr No and Date row -->
  <div style="display:flex; justify-content:space-between; align-items:center; margin:10px 0 18px; font-size:16px;">
    <div>
      Sr. No.:
      <span style="display:inline-block; min-width:180px; border-bottom:1px solid #000; padding:0 4px;">
        ${billNo}
      </span>
    </div>
    <div>
      Date:
      <span style="display:inline-block; min-width:160px; border-bottom:1px solid #000; padding:0 4px;">
        ${dateStr}
      </span>
    </div>
  </div>

  <!-- Patient name -->
  <div style="font-size:16px; margin:10px 0;">
    RECEIVED from Mr./Mrs.
    <span style="display:inline-block; min-width:650px; border-bottom:1px solid #000; padding:0 4px;">
      ${patientName || ""}
    </span>
  </div>

  <!-- Amount -->
  <div style="font-size:16px; margin:14px 0;">
    The sum of Rs.
    <span style="display:inline-block; min-width:720px; border-bottom:1px solid #000; padding:0 4px;">
      ${rupees}
    </span>
  </div>

  <!-- Payment mode -->
  <div style="font-size:16px; margin:14px 0;">
    In ${payMode}
    ${payMode === "Cheque"
      ? `/ Cheque No.
    <span style="display:inline-block; min-width:220px; border-bottom:1px solid #000; padding:0 4px;">
      ${chequeNo || ""}
    </span>
    Dated
    <span style="display:inline-block; min-width:220px; border-bottom:1px solid #000; padding:0 4px;">
      ${chequeDate || ""}
    </span>`
      : payMode === "UPI"
        ? `/ UPI ID
    <span style="display:inline-block; min-width:220px; border-bottom:1px solid #000; padding:0 4px;">
      ${upiId || ""}
    </span>
    Txn ID
    <span style="display:inline-block; min-width:220px; border-bottom:1px solid #000; padding:0 4px;">
      ${upiTxnId || ""}
    </span>`
        : ""}
    being fees for the treatment of
    <span style="display:inline-block; min-width:260px; border-bottom:1px solid #000; padding:0 4px;">
      ${treatmentOf || ""}
    </span>
  </div>

  <!-- Duration -->
  <div style="font-size:16px; margin:12px 0;">
    Duration
    <span style="display:inline-block; min-width:300px; border-bottom:1px solid #000; padding:0 4px;">
      ${durationText || ""}
    </span>
  </div>

  <!-- No. of sessions -->
  <div style="font-size:16px; margin:12px 0;">
    No. of Sessions
    <span style="display:inline-block; min-width:260px; border-bottom:1px solid #000; padding:0 4px;">
      ${noOfSessions ?? ""}
    </span>
  </div>

  <!-- Rate per session -->
  <div style="font-size:16px; margin:12px 0;">
    Rate per session
    <span style="display:inline-block; min-width:260px; border-bottom:1px solid #000; padding:0 4px;">
      ${Number(ratePerSession || 0).toFixed(2)}
    </span>
  </div>

  <!-- Sessions date -->
  <div style="font-size:16px; margin:12px 0 28px;">
    Sessions Date
    <span style="display:inline-block; min-width:420px; border-bottom:1px solid #000; padding:0 4px;">
      ${sessionsDateText || ""}
    </span>
  </div>

  <!-- Signature -->
  <div style="display:flex; justify-content:flex-end; margin-top:48px; font-size:18px; font-weight:bold;">
    ${doctorSign}
  </div>

</div>
`;
    return `<!doctype html><html><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=0.6" /><title>${billNo || "Bill"}</title></head><body style="margin:0;padding:0;">${html}</body></html>`;
  }

  // FIXED: Show bill inside the app (no Chrome popup!)
  async function openReceiptBill(params) {
    const billHtml = buildBillHtml(params);
    const safeBillNo = String(params.billNo || "bill").replace(/[^a-zA-Z0-9-_]/g, "_");
    const fileName = `${safeBillNo}.html`;

    if (Capacitor.isNativePlatform()) {
      // Save file silently in background (for optional sharing later)
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
      // Show bill IN-APP via modal instead of opening Chrome
      setBillModalHtml(billHtml);
      setBillModalFileName(fileName);
      return { savedToDevice: true, fileName };
    }

    // Web/desktop: open in new tab and print
    const w = window.open("", "_blank");
    w.document.write(billHtml);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 200);
    return { savedToDevice: false };
  }

  const handleGenerateBill = async () => {
    const appt = appointments.find((a) => a.id === selectedApptId);
    if (!appt) return;

    try {
      setLoading(true);
      const serial = await nextBillNumber(db);
      setBillNo(serial);

      const session = appt.session || {};

      const totalAmount =
        session.ratePerSession && session.noOfSessions
          ? Number(session.ratePerSession) * Number(session.noOfSessions)
          : Number(session.fees || 0);

      const billData = {
        billNo: serial,
        patientName: appt.patientName,
        doctorName: doctor?.name || "",
        department: doctor?.department || "",
        visitDate: appt.visitDate,
        durationMins: Number(session.durationMins || 0),
        fees: Number(session.fees || 0),
        notes: session.notes || "",
        noOfSessions: Number(session.noOfSessions || 0),
        ratePerSession: Number(session.ratePerSession || 0),
        sessionsDateText: session.sessionsDateText || "",
        payMode: session.payMode || "Cash",
        chequeNo: session.chequeNo || "",
        chequeDate: session.chequeDate || "",
        upiId: session.upiId || "",
        upiTxnId: session.upiTxnId || "",
        timingSelection: timingSelection,
        createdAt: new Date().toISOString(),
        doctorId: doctor?.id || auth.currentUser?.uid || "",
      };

      await addDoc(collection(db, "bills"), billData);

      const billResult = await openReceiptBill({
        billNo: serial,
        billDate: new Date(),
        clinic: getClinicData(),
        patientName: appt.patientName,
        amount: totalAmount,
        payMode: billData.payMode,
        chequeNo: billData.chequeNo,
        chequeDate: billData.chequeDate,
        upiId: billData.upiId,
        upiTxnId: billData.upiTxnId,
        treatmentOf: appt.diagnosis || appt.symptoms || "physiotherapy",
        durationText: `${session.durationMins || 0} minutes`,
        noOfSessions: session.noOfSessions || "",
        ratePerSession: session.ratePerSession || session.fees || 0,
        sessionsDateText: session.sessionsDateText || appt.visitDate,
        doctorSign: doctor?.name || "Dr. Dhaval Shah",
      });

      // Don't navigate away on Android - bill modal will show in-app
      if (!billResult?.savedToDevice) {
        // Only navigate on web (modal handles Android)
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

  return (
    <div className="dashboard container py-4">
      <header className="dashboard-header">
        <h1>Generate Bill</h1>
        {/* Show selected timing */}
        <div style={{ fontSize: '14px', color: '#666', marginBottom: '10px' }}>
          📅 Selected Timing:
          <strong style={{ color: '#000' }}>
            {timingSelection === 'morning' && 'Morning (9AM-1PM)'}
            {timingSelection === 'evening' && 'Evening (3PM-8PM)'}
            {timingSelection === 'both' && 'Both Morning & Evening'}
          </strong>
        </div>
        <button className="logout-btn" onClick={() => navigate(-1)}>
          ← Back
        </button>
      </header>

      {/* Search patients by name / phone */}
      <section className="filters mb-4">
        <label className="calendar-label">
          🔍 Search Patient (name or number)
          <input
            type="text"
            className="calendar-input"
            placeholder="Type name or phone..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setSelectedPatientKey("");
              setSelectedApptId("");
            }}
          />
        </label>
      </section>

      {/* Patients list */}
      <section className="appointments mb-4">
        <h3>Patients</h3>
        {filteredPatients.length === 0 ? (
          <p className="no-data">No patients match this search.</p>
        ) : (
          <select
            style={{
              width: "100%",
              padding: "8px 10px",
              borderRadius: 4,
              border: "1px solid #ccc",
              marginBottom: 16,
            }}
            value={selectedPatientKey}
            onChange={(e) => {
              setSelectedPatientKey(e.target.value);
              setSelectedApptId("");
            }}
          >
            <option value="">Select Patient</option>
            {filteredPatients.map((p) => (
              <option key={p.key} value={p.key}>
                {p.name} {p.contact ? `(${p.contact})` : ""}
              </option>
            ))}
          </select>
        )}
      </section>

      {/* Sessions (appointments) for selected patient */}
      {selectedPatientKey && (
        <section className="appointments mb-4">
          <h3>Sessions for selected patient</h3>
          {selectedPatientAppointments.length === 0 ? (
            <p className="no-data">No past appointments found for this patient.</p>
          ) : (
            <select
              style={{
                width: "100%",
                padding: "8px 10px",
                borderRadius: 4,
                border: "1px solid #ccc",
                marginBottom: 16,
              }}
              value={selectedApptId}
              onChange={(e) => setSelectedApptId(e.target.value)}
            >
              <option value="">Select Session / Visit</option>
              {selectedPatientAppointments.map((appt) => (
                <option key={appt.id} value={appt.id}>
                  {appt.visitDate} –{" "}
                  {appt.session
                    ? `Duration ${appt.session.durationMins || 0} mins, Fees ₹${appt.session.fees || 0}`
                    : "No session details"}
                </option>
              ))}
            </select>
          )}

          <button
            className="btn-red"
            disabled={!selectedApptId}
            onClick={handleGenerateBill}
          >
            Generate Bill for Selected Session
          </button>
        </section>
      )}
    </div>
  );
};

export default BillPage;
