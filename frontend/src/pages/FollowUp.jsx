import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { collection, query, where, getDocs } from "firebase/firestore";
import { auth, db } from "../firebaseConfig";
import { useLocation } from "react-router-dom";
import "./PatientVisitForm.css";

const FollowUp = () => {
  const [search, setSearch] = useState("");
  const [patient, setPatient] = useState(null);
  const [allVisits, setAllVisits] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  useEffect(() => {
  if (location.state?.patientName) {
    setSearch(location.state.patientName);
    setTimeout(() => handleSearch(location.state.patientName), 100);
  }
}, [location.state]);

  
  // 🔍 Search patient by name or contact
const handleSearch = async (searchValue) => {

  const searchTerm = typeof searchValue === 'string' ? searchValue : search;

  if (!searchTerm.trim()) {
    alert("Please enter patient name or contact");
    return;
  }

  setLoading(true);

  try {
    await auth.authStateReady();
    const doctorId = auth.currentUser?.uid;
    if (!doctorId) {
      navigate("/", { replace: true });
      return;
    }

    const q1 = query(collection(db, "appointments"), where("doctorId", "==", doctorId), where("patientName", "==", searchTerm));
    const q2 = query(collection(db, "appointments"), where("doctorId", "==", doctorId), where("contact", "==", searchTerm));

    const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);
    const docs = [...new Map([...snap1.docs, ...snap2.docs].map((item) => [item.id, item])).values()];
    const data = docs.map((d) => ({ id: d.id, ...d.data() }));

    if (data.length === 0) {
      alert("No patient found!");
      setPatient(null);
      setAllVisits([]);
      return;
    }

    // Sort visits newest first
    data.sort((a, b) => new Date(b.visitDate) - new Date(a.visitDate));

    setPatient(data[0]);
    setAllVisits(data);

  } catch (err) {
    console.error("Error fetching patient:", err);
    alert("Error fetching patient");

  } finally {
    setLoading(false);
  }
};


  // 🧭 Navigate to new appointment form with prefilled data
  const handleNewAppointment = () => {
    if (!patient) return alert("Search for a patient first!");
    navigate("/new-appointment", { state: { patient } });
  };

  return (
    <div className="visit-form-wrapper">
      <header className="form-page-header">
        <div>
          <p className="page-eyebrow">Continuity of care</p>
          <h1>Patient follow-up</h1>
          <p>Find the patient, review prior visits and continue treatment with full clinical context.</p>
        </div>
        <div className="workflow-steps compact" aria-label="Follow-up workflow">
          <span className={!patient ? "active" : "complete"}><b>1</b> Find patient</span>
          <span className={patient ? "active" : ""}><b>2</b> Review history</span>
        </div>
      </header>

      {!patient ? (
        <div className="followup-search-section">
          <h3 className="section-heading">Search Existing Patient</h3>
          <div className="form-grid center">
            <input
              type="text"
              placeholder="Enter patient name or contact number"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-control"
              style={{
                padding: "12px",
                borderRadius: "10px",
                border: "1px solid #ccc",
                width: "100%",
                maxWidth: "400px",
              }}
            />
            <button
              onClick={handleSearch}
              className="btn-red"
              disabled={loading}
              style={{ marginTop: "10px" }}
            >
              {loading ? "Searching..." : "Search"}
            </button>
          </div>
        </div>
      ) : (
        <div className="visit-form followup-card">
          <h3 className="section-heading">Patient Details</h3>
          <div className="form-section">
            <div className="form-grid">
              <p><strong>👤 Name:</strong> {patient.patientName}</p>
              <p><strong>🎂 Age:</strong> {patient.age}</p>
              <p><strong>⚧ Gender:</strong> {patient.gender}</p>
              <p><strong>📞 Contact:</strong> {patient.contact}</p>
            </div>
          </div>

          <div className="form-section">
            <h3>Doctor Info</h3>
            <div className="form-grid">
              <p><strong>🩺 Doctor:</strong> {patient.doctorName}</p>
              <p><strong>🏥 Department:</strong> {patient.department}</p>
            </div>
          </div>

          {/* 🧾 Visit History */}
          {allVisits.length > 0 && (
            <div className="form-section">
              <h3>Previous Visits</h3>
              <div className="visit-history">
                {allVisits.map((v, i) => (
                  <div key={i} className="visit-history-card">
                    <h5>
                      Visit on:{" "}
                      <span style={{ color: "#b00020" }}>
                        {new Date(v.visitDate).toLocaleDateString()}
                      </span>
                    </h5>
                    <p><strong>🩸 Symptoms:</strong> {v.symptoms || "Not recorded"}</p>
                    <p><strong>🧠 Diagnosis:</strong> {v.diagnosis || "Not recorded"}</p>
                   <p>
  <strong>💊 Prescription:</strong>{" "}
  {v.prescription || "Not recorded"}
</p>

{/* 👇 Prescription Image */}
{v.prescriptionImageUrl && (
  <div style={{ marginTop: "10px" }}>
    <img
      src={v.prescriptionImageUrl.replace("http://", "https://")}
      alt="Prescription"
      style={{
        width: "180px",
        borderRadius: "8px",
        cursor: "pointer",
        border: "1px solid #ddd"
      }}
      onClick={() => window.open(v.prescriptionImageUrl, "_blank")}
    />
  </div>
)}

{/* 👇 Follow up button for this specific visit */}
<button
  className="btn-outline"
  style={{ marginTop: "15px", width: "100%", padding: "8px", fontWeight: "600" }}
  onClick={() => navigate("/new-appointment", { state: { patient: v } })}
>
  🔄 Follow Up (Prefill This Visit's Details)
</button>

                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ⚙️ Actions */}
          <div className="form-actions">
            <button
              onClick={handleNewAppointment}
              className="btn-red"
              disabled={loading}
            >
              ➕ Create New Appointment
            </button>
            <button
              onClick={() => {
                setPatient(null);
                setSearch("");
                setAllVisits([]);
              }}
              className="btn-outline"
            >
              🔙 Back to Search
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FollowUp;
