// src/pages/Dashboard.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  CalendarDays,
  FileText,
  ReceiptText,
  Stethoscope,
  Trash2,
  Upload,
  Users,
} from "lucide-react";
import {
  doc,
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  onSnapshot,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db, storage } from "../firebaseConfig";
import "./Dashboard.css";




const Dashboard = () => {
  const [appointments, setAppointments] = useState([]);
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
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
  }, [navigate]);


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
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const handlePatientClick = async (patient) => {
    const doctorId = auth.currentUser?.uid;
    if (!doctorId) {
      navigate("/", { replace: true });
      return;
    }

    try {
      const q = query(
        collection(db, "appointments"),
        where("doctorId", "==", doctorId),
        where("patientName", "==", patient.name)
      );
      const snap = await getDocs(q);
      const visits = snap.docs.map(d => d.data());
      visits.sort((a, b) => new Date(b.visitDate) - new Date(a.visitDate));
      setSelectedPatient(patient);
      setPatientVisits(visits);
    } catch (error) {
      console.error("Error fetching patient visits:", error);
      setSelectedPatient(null);
      setPatientVisits([]);
      alert("Could not load patient visits. Please try again.");
      return;
    }

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


  const filteredAppointments = appointments.filter(
    (appt) => appt.visitDate === selectedDate
  );

  const patientCount = new Set(appointments.map((appt) => appt.patientName).filter(Boolean)).size;
  const selectedDateLabel = new Date(`${selectedDate}T00:00:00`).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  const sessionOptions = {
    morning: { label: "Morning clinic", hours: "8:00 AM - 1:00 PM" },
    evening: { label: "Evening clinic", hours: "2:00 PM - 7:00 PM" },
    both: { label: "Full-day clinic", hours: "8:00 AM - 7:00 PM" },
  };
  const activeSession = sessionOptions[localStorage.getItem("doctorTimingSelection")] || sessionOptions.morning;
  const scheduledPatients = new Set(filteredAppointments.map((appointment) => appointment.patientName).filter(Boolean)).size;
  const billReadyVisits = filteredAppointments.filter((appointment) => appointment.session).length;
  const recentAppointments = [...appointments]
    .sort((a, b) => new Date(b.visitDate || 0) - new Date(a.visitDate || 0))
    .slice(0, 4);



  if (loading)
    return (
      <div className="loading-screen">
        <p>Loading dashboard...</p>
      </div>
    );


  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div>
          <p className="page-eyebrow">Clinical workspace</p>
          <h1>Good day, {doctor?.name?.split(" ")[0] || "Doctor"}</h1>
          <p className="dashboard-subtitle">Here is the clinic schedule and patient activity for {selectedDateLabel}.</p>
        </div>
      </header>

      <section className="dashboard-stats" aria-label="Clinic summary">
        <article className="stat-card stat-card-brand">
          <span className="stat-icon"><CalendarDays size={20} /></span>
          <div><strong>{filteredAppointments.length}</strong><span>Visits selected</span></div>
        </article>
        <article className="stat-card stat-card-teal">
          <span className="stat-icon"><Users size={20} /></span>
          <div><strong>{patientCount}</strong><span>Total patients</span></div>
        </article>
        <article className="stat-card stat-card-amber">
          <span className="stat-icon"><Stethoscope size={20} /></span>
          <div><strong>{doctor?.department || "Physio"}</strong><span>Department</span></div>
        </article>
      </section>

      <div className="dashboard-toolbar">
      <section className="doctor-profile">
        <div className="profile-left">
          <div className="photo-wrapper">
            <img
              src={doctor?.photoURL || "/assets/physio-bg.jpeg"}
              alt="Doctor Profile"
              className="doctor-photo"
            />
            <div className="photo-overlay">
              <label className="upload-btn">
                <Upload size={16} />
                <span className="sr-only">Upload profile photo</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  hidden
                />
              </label>
              <button className="remove-btn" onClick={handleRemovePhoto} title="Remove profile photo">
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        </div>
        <div className="profile-right">
          <h2>{doctor?.name || "Doctor"}</h2>
          <p>{doctor?.department || "Department not set"}</p>
          <p>{doctor?.email}</p>
        </div>
      </section>

      <section className="filters">
        <label className="calendar-label" htmlFor="dashboard-date">
          <span><CalendarDays size={17} /> Schedule date</span>
          <input
            id="dashboard-date"
            type="date"
            className="calendar-input"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </label>
      </section>
      <section className="clinic-session-panel">
        <span className="session-pulse" aria-hidden="true" />
        <div>
          <small>Active session</small>
          <strong>{activeSession.label}</strong>
          <span>{activeSession.hours}</span>
        </div>
      </section>
      <section className="dashboard-insights">
        <div className="insights-heading"><span>Day overview</span><strong>{selectedDateLabel}</strong></div>
        <dl>
          <div><dt>Scheduled visits</dt><dd>{filteredAppointments.length}</dd></div>
          <div><dt>Patients expected</dt><dd>{scheduledPatients}</dd></div>
          <div><dt>Billing records ready</dt><dd>{billReadyVisits}</dd></div>
        </dl>
      </section>
      </div>



      {/* Appointments */}
      <section className="appointments mb-4">
        <div className="section-heading-row">
          <div>
            <p className="section-kicker">Daily schedule</p>
            <h3>Appointments</h3>
          </div>
          <span className="date-badge">{selectedDateLabel}</span>
        </div>

        {filteredAppointments.length === 0 ? (
          <div className="empty-schedule">
            <span><CalendarDays size={22} /></span>
            <div><h4>Your schedule is clear</h4><p>No appointments are booked for this date.</p></div>
          </div>
        ) : (
          <div className="appointment-list">
            {filteredAppointments.map((appt) => (
              <div key={appt.id} className="appointment-card">
                <div className="appointment-time">
                  <strong>{appt.time || "Open"}</strong>
                  <span>{appt.visitDate}</span>
                </div>
                <div className="appointment-content">
                  <div className="appt-header">
                    <h5>{appt.patientName}</h5>
                    <span className="appt-type">{appt.type || "Visit"}</span>
                  </div>
                  <div className="appointment-meta">
                    <span><strong>{Number(appt?.session?.durationMins ?? 0)}</strong> minutes</span>
                    <span><strong>INR {Number(appt?.session?.fees ?? 0)}</strong> session fee</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="recent-activity">
        <div className="section-heading-row">
          <div><p className="section-kicker">Patient records</p><h3>Recent activity</h3></div>
          <div className="activity-header-actions">
            <span className="record-count">{recentAppointments.length} records</span>
            <button
              className="patient-list-toggle"
              type="button"
              onClick={() => {
                setShowPatients(!showPatients);
                if (!showPatients) fetchPatients();
              }}
            >
              <Users size={17} /> {showPatients ? "Hide directory" : "Patient directory"}
            </button>
          </div>
        </div>
        {recentAppointments.length === 0 ? (
          <p className="no-data compact">Patient activity will appear here after the first visit.</p>
        ) : (
          <div className="activity-list">
            {recentAppointments.map((appointment) => (
              <article className="activity-row" key={appointment.id}>
                <span className="activity-avatar">{appointment.patientName?.charAt(0)?.toUpperCase() || "P"}</span>
                <div><strong>{appointment.patientName || "Unnamed patient"}</strong><span>{appointment.diagnosis || appointment.symptoms || "General physiotherapy visit"}</span></div>
                <time>{appointment.visitDate ? new Date(`${appointment.visitDate}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "No date"}</time>
              </article>
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
                        <td style={{ fontWeight: "600", color: "var(--brand)" }}>
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
                              <FileText size={15} /> Details
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
                      Close
                    </button>
                  </div>

                  {/* BILL SUMMARY TABLE */}
                  <div className="bill-summary-container" style={{ margin: "20px 0", background: "#f8fafc", padding: "15px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                    <h5 style={{ color: "var(--brand)", marginBottom: "12px", fontWeight: "700" }}><ReceiptText size={18} /> Billing Summary</h5>
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



    </div>
  );
};


export default Dashboard;
