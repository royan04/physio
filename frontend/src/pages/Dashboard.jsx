// src/pages/Dashboard.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  onSnapshot,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth, db, storage } from "../firebaseConfig";
import "./Dashboard.css";




const Dashboard = () => {
  const [appointments, setAppointments] = useState([]);
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("today");
  const navigate = useNavigate();
  const [showBillSelector, setShowBillSelector] = useState(false);
  const [selectedBillApptId, setSelectedBillApptId] = useState("");
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientVisits, setPatientVisits] = useState([]);
  const [showPatients, setShowPatients] = useState(false);
  const [patients, setPatients] = useState([]);




  // 🔹 Fetch doctor and listen for live updates
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        navigate("/login");
        return;
      }



      try {
        // Real-time listener for doctor's data
        const docRef = doc(db, "doctors", user.uid);
        const unsubscribeDoc = onSnapshot(docRef, (docSnap) => {
          if (docSnap.exists()) {
            const doctorData = { id: user.uid, ...docSnap.data() };
            setDoctor(doctorData);
          } else {
            console.warn("Doctor profile not found in Firestore!");
          }
        });


        await fetchAppointments(user.uid);
        setLoading(false);


        // Cleanup Firestore listener when component unmounts
        return () => unsubscribeDoc();
      } catch (err) {
        console.error("Error loading doctor or appointments:", err);
        setLoading(false);
      }
    });


    return () => unsubscribeAuth();
  }, [navigate, view]);


  // 🔹 Fetch appointments for this doctor
  const fetchAppointments = async (doctorId) => {
    try {
      const q = query(
        collection(db, "appointments"),
        where("doctorId", "==", doctorId)
      );
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setAppointments(data);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      setAppointments([]);
    }
  };
  const fetchPatients = async () => {
    const user = auth.currentUser;
    if (!user) return;

    const q = query(
      collection(db, "appointments"),
      where("doctorId", "==", user.uid)
    );

    const snap = await getDocs(q);

    const patientMap = {};

    snap.docs.forEach((doc) => {
      const data = doc.data();

      if (!patientMap[data.patientName]) {
        patientMap[data.patientName] = {
          name: data.patientName,
          lastVisit: data.visitDate
        };
      } else {
        if (new Date(data.visitDate) > new Date(patientMap[data.patientName].lastVisit)) {
          patientMap[data.patientName].lastVisit = data.visitDate;
        }
      }
    });

    setPatients(Object.values(patientMap));
  };
  const uniquePatients = Object.values(
    patients.reduce((acc, patient) => {
      acc[patient.name] = patient;
      return acc;
    }, {})
  );


  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const handlePatientClick = async (patient) => {
    setSelectedPatient(patient);

    const q = query(
      collection(db, "appointments"),
      where("patientName", "==", patient.name)
    );

    const snap = await getDocs(q);
    const visits = snap.docs.map(d => d.data());

    visits.sort((a, b) => new Date(b.visitDate) - new Date(a.visitDate));

    setPatientVisits(visits);

    // Ensure the card scrolls into view, especially on mobile!
    setTimeout(() => {
      document.getElementById("patient-detail-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };


  // 🔹 Handle profile photo upload
  const handlePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (!file || !doctor) return;


    const storageRef = ref(storage, `doctor_photos/${doctor.id}.jpg`);
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);


    await updateDoc(doc(db, "doctors", doctor.id), { photoURL: downloadURL });
    alert("Profile photo updated successfully!");
  };


  // 🔹 Remove profile photo
  const handleRemovePhoto = async () => {
    if (!doctor) return;
    await updateDoc(doc(db, "doctors", doctor.id), { photoURL: "" });
    alert("Profile photo removed!");
  };


  // 🔹 Handle Logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/");
    } catch (error) {
      console.error("Logout Error:", error);
      alert("Error logging out. Try again.");
    }
  };



  const filteredAppointments = appointments.filter(
    (appt) => appt.visitDate === selectedDate
  );



  if (loading)
    return (
      <div className="loading-screen">
        <p>Loading dashboard...</p>
      </div>
    );


  return (
    <div className="dashboard container py-4">
      {/* 🔹 Header with Logout */}
      <header className="dashboard-header">
        <h1>Doctor Dashboard</h1>
        <button className="logout-btn" onClick={handleLogout}>
          🚪 Logout
        </button>
      </header>


      {/* Doctor Profile */}
      <section className="doctor-profile mb-4">
        <div className="profile-left">
          <div className="photo-wrapper">
            <img
              src={doctor?.photoURL || "/default-doctor.png"}
              alt="Doctor Profile"
              className="doctor-photo"
            />
            <div className="photo-overlay">
              <label className="upload-btn">
                📸
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  hidden
                />
              </label>
              <button className="remove-btn" onClick={handleRemovePhoto}>
                ❌
              </button>
            </div>
          </div>
        </div>
        <div className="profile-right">
          <h2>{doctor?.name || "Doctor"}</h2>
          <p>{doctor?.department || "Department not set"}</p>
          <p className="text-muted">{doctor?.email}</p>
        </div>
      </section>


      {/* Filters */}
      {/* Calendar Filter */}
      <section className="filters mb-4">
        <label className="calendar-label">
          📅 Select Date
          <input
            type="date"
            className="calendar-input"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </label>
      </section>



      {/* Appointments */}
      {/* Appointments */}
      <section className="appointments mb-4">
        <h3>
          Appointments for{" "}
          <span className="text-primary">{selectedDate}</span>
        </h3>

        {filteredAppointments.length === 0 ? (
          <p className="no-data">No appointments found.</p>
        ) : (
          <div className="appointment-list">
            {filteredAppointments.map((appt) => (
              <div key={appt.id} className="appointment-card">

                <div className="appt-header">
                  <h5>{appt.patientName}</h5>
                  <span className="appt-type">{appt.type}</span>
                </div>

                <p>
                  <strong>Time:</strong> {appt.time || "N/A"}
                </p>

                <p>
                  <strong>Session:</strong>{" "}
                  {appt?.session
                    ? `Duration ${Number(appt.session.durationMins ?? 0)} mins, Fees ₹${Number(appt.session.fees ?? 0)}`
                    : "N/A"}
                </p>

              </div>
            ))}
          </div>
        )}
      </section>


      {/* ================= PATIENT LIST ================= */}

      {showPatients && (
        <section className="patients-section mb-4">

          <h3>Patients List</h3>

          {patients.length === 0 ? (
            <p className="no-data">No patients found.</p>
          ) : (
            <>
              {/* ---------- TABLE ---------- */}
              <div className="table-responsive" style={{ borderRadius: "16px", overflowX: "auto", border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" }}>
                <table className="modern-patients-table">
                  <thead>
                    <tr>
                      <th>Patient Name</th>
                      <th>Last Visit</th>
                      <th style={{ textAlign: "right", paddingRight: "25px" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {patients.map((patient, index) => (
                      <tr key={`patr-${index}`} className={selectedPatient?.name === patient.name ? "selected-row" : ""}>
                        <td style={{ fontWeight: "600", color: "var(--brand-primary)" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <div className="avatar-circle">{patient.name.charAt(0).toUpperCase()}</div>
                            {patient.name}
                          </div>
                        </td>
                        <td>
                          <span className="date-badge">
                            {patient.lastVisit ? new Date(patient.lastVisit).toLocaleDateString() : "N/A"}
                          </span>
                        </td>
                        <td style={{ textAlign: "right", paddingRight: "25px" }}>
                          <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", flexWrap: "wrap" }}>
                            <button
                              className="btn-sm btn-outline-primary"
                              style={{ whiteSpace: "nowrap" }}
                              onClick={() => handlePatientClick(patient)}
                            >
                              📄 Details
                            </button>

                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>


              {/* ---------- PATIENT DETAIL CARD ---------- */}
              {selectedPatient && (
                <div id="patient-detail-section" className="patient-detail-card mt-4">

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h4>Patient Details: {selectedPatient.name}</h4>
                    <button
                      className="btn-sm btn-outline-primary"
                      onClick={() => setSelectedPatient(null)}
                    >
                      ❌ Close
                    </button>
                  </div>

                  {/* BILL SUMMARY TABLE */}
                  <div className="bill-summary-container" style={{ margin: "20px 0", background: "#f8fafc", padding: "15px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                    <h5 style={{ color: "var(--brand-primary)", marginBottom: "12px", fontWeight: "700" }}>🧾 Billing Summary</h5>
                    <table className="patients-table" style={{ fontSize: "0.95rem" }}>
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Total Billed (₹)</th>
                          <th>Amount Paid (₹)</th>
                          <th>Balance Due (₹)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {patientVisits.map((visit, i) => {
                          let totalBilled = 0;
                          if (visit.session?.noOfSessions && visit.session?.ratePerSession) {
                            totalBilled = Number(visit.session.noOfSessions) * Number(visit.session.ratePerSession);
                          } else {
                            totalBilled = Number(visit.session?.fees || 0);
                          }

                          const amtPaid = visit.session?.amountPaid !== undefined
                            ? Number(visit.session.amountPaid)
                            : totalBilled;
                          const balDue = totalBilled - amtPaid;

                          return (
                            <tr key={`bill-${i}`}>
                              <td>{visit.visitDate || "N/A"}</td>
                              <td>₹{totalBilled.toFixed(2)}</td>
                              <td style={{ color: "#16a34a", fontWeight: "600" }}>₹{amtPaid.toFixed(2)}</td>
                              <td style={{ color: balDue > 0 ? "#dc2626" : "#475569", fontWeight: "600" }}>₹{balDue.toFixed(2)}</td>
                            </tr>
                          );
                        })}
                        {/* GRAND TOTAL */}
                        <tr style={{ background: "#e2e8f0", borderTop: "2px solid #cbd5e1", fontWeight: "800", color: "#1e293b" }}>
                          <td style={{ color: "#1e293b" }}>GRAND TOTAL:</td>
                          <td style={{ color: "#1e293b" }}>
                            ₹{patientVisits.reduce((acc, visit) => {
                              let b = (visit.session?.noOfSessions && visit.session?.ratePerSession)
                                ? Number(visit.session.noOfSessions) * Number(visit.session.ratePerSession)
                                : Number(visit.session?.fees || 0);
                              return acc + b;
                            }, 0).toFixed(2)}
                          </td>
                          <td style={{ color: "#16a34a" }}>
                            ₹{patientVisits.reduce((acc, visit) => {
                              let b = (visit.session?.noOfSessions && visit.session?.ratePerSession)
                                ? Number(visit.session.noOfSessions) * Number(visit.session.ratePerSession)
                                : Number(visit.session?.fees || 0);
                              let p = visit.session?.amountPaid !== undefined ? Number(visit.session.amountPaid) : b;
                              return acc + p;
                            }, 0).toFixed(2)}
                          </td>
                          <td style={{ color: "#dc2626" }}>
                            ₹{patientVisits.reduce((acc, visit) => {
                              let b = (visit.session?.noOfSessions && visit.session?.ratePerSession)
                                ? Number(visit.session.noOfSessions) * Number(visit.session.ratePerSession)
                                : Number(visit.session?.fees || 0);
                              let p = visit.session?.amountPaid !== undefined ? Number(visit.session.amountPaid) : b;
                              return acc + (b - p);
                            }, 0).toFixed(2)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <h5 style={{ marginTop: "30px", borderBottom: "2px solid #e2e8f0", paddingBottom: "5px", fontWeight: "700" }}>Full Visit History</h5>
                  {patientVisits.map((visit, i) => (
                    <div key={i} className="visit-card">

                      <p>
                        <strong>Date:</strong>{" "}
                        {visit.visitDate || "N/A"}
                      </p>

                      <p>
                        <strong>Age:</strong>{" "}
                        {visit.age || "N/A"}
                      </p>

                      <p>
                        <strong>Gender:</strong>{" "}
                        {visit.gender || "N/A"}
                      </p>

                      <p>
                        <strong>Symptoms:</strong>{" "}
                        {visit.symptoms || "N/A"}
                      </p>

                      <p>
                        <strong>Diagnosis:</strong>{" "}
                        {visit.diagnosis || "N/A"}
                      </p>

                      <p>
                        <strong>Prescription:</strong>{" "}
                        {visit.prescription || "N/A"}
                      </p>

                      <p>
                        <strong>Session:</strong>{" "}
                        {visit.session
                          ? `${visit.session.durationMins || 0} mins, ₹${visit.session.fees || 0}`
                          : "N/A"}
                      </p>

                      {/* PRESCRIPTION IMAGE */}
                      {visit.prescriptionImageUrl && (
                        <img
                          src={visit.prescriptionImageUrl.replace("http://", "https://")}
                          alt="Prescription"
                          style={{
                            width: "160px",
                            borderRadius: "8px",
                            marginTop: "8px"
                          }}
                        />
                      )}

                    </div>
                  ))}

                </div>
              )}

            </>
          )}
        </section>
      )}



      {/* Actions */}
      <section className="actions">

        <button
          className="btn-outline"
          onClick={() => {
            setShowPatients(!showPatients);
            if (!showPatients) fetchPatients();
          }}
        >
          👥 View Patients
        </button>

        <button
          className="btn-primary"
          onClick={() => navigate("/new-appointment")}
        >
          + New Appointment
        </button>

        <button
          className="btn-outline"
          onClick={() => navigate("/follow-up")}
        >
          + Follow-up
        </button>

        <button
          className="btn-red"
          onClick={() => navigate("/bill")}
        >
          🧾 Generate Bill
        </button>

      </section>



      {showBillSelector && (
        <div
          className="modal-backdrop"
          onClick={() => setShowBillSelector(false)}
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
              width: "min(620px, 94vw)",
              maxHeight: "80vh",
              overflowY: "auto",
              boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
            }}
          >
            <h3 style={{ marginTop: 0 }}>Select Appointment for Bill</h3>


            {appointments.length === 0 ? (
              <p>No appointments available.</p>
            ) : (
              <>
                {/* You can filter here by selectedDate if you only want that day */}
                <div style={{ marginBottom: 8, fontSize: "0.9rem", color: "#555" }}>
                  Showing appointments for {selectedDate}
                </div>
                <select
                  style={{
                    width: "100%",
                    padding: "8px 10px",
                    borderRadius: 4,
                    border: "1px solid #ccc",
                    marginBottom: 16,
                  }}
                  value={selectedBillApptId}
                  onChange={(e) => setSelectedBillApptId(e.target.value)}
                >
                  <option value="">Select Appointment</option>
                  {appointments
                    .filter((appt) => appt.visitDate === selectedDate)
                    .map((appt) => (
                      <option key={appt.id} value={appt.id}>
                        {appt.visitDate} - {appt.patientName} (
                        {appt.session
                          ? `Duration ${appt.session.durationMins || 0} mins, Fees ₹${appt.session.fees || 0
                          }`
                          : "No session details"}
                        )
                      </option>
                    ))}
                </select>


                <div className="form-actions" style={{ display: "flex", gap: 8 }}>
                  <button
                    className="btn-red"
                    disabled={!selectedBillApptId}
                    onClick={() => {
                      const appt = appointments.find(
                        (a) => a.id === selectedBillApptId
                      );
                      if (!appt) return;
                      // Navigate to bill page with this appointment
                      navigate("/new-appointment", {
                        state: {
                          patient: appt,
                          timingSelection: timingSelection  // 👈 ADD THIS LINE ONLY
                        }
                      });
                    }}
                  >
                    Generate Bill for Selected
                  </button>
                  <button
                    className="btn-outline"
                    onClick={() => setShowBillSelector(false)}
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

    </div>
  );
};


export default Dashboard;