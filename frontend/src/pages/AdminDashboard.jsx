import { useEffect, useState } from "react";
import { Activity, CalendarCheck2, ShieldCheck, Stethoscope } from "lucide-react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebaseConfig";
import "./AdminDashboard.css";

export default function AdminDashboard() {
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [appointmentSnapshot, doctorSnapshot] = await Promise.all([
          getDocs(collection(db, "appointments")),
          getDocs(collection(db, "doctors")),
        ]);
        setAppointments(appointmentSnapshot.docs.map((item) => item.data()));
        setDoctors(doctorSnapshot.docs.map((item) => item.data()));
      } catch (error) {
        console.error("Error fetching admin data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="loading-screen"><p>Preparing clinic overview...</p></div>;

  const today = new Date().toISOString().slice(0, 10);
  const todayAppointments = appointments.filter((appointment) => appointment.visitDate === today).length;

  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <div><p className="page-eyebrow">Practice administration</p><h1>Clinic overview</h1><p>A live operational view of practitioners and scheduled patient care.</p></div>
        <span className="admin-access"><ShieldCheck size={18} /> Administrator access</span>
      </header>

      <section className="admin-stats" aria-label="Clinic statistics">
        <article><span className="admin-stat-icon red"><Stethoscope size={21} /></span><div><strong>{doctors.length}</strong><small>Registered doctors</small></div></article>
        <article><span className="admin-stat-icon teal"><CalendarCheck2 size={21} /></span><div><strong>{appointments.length}</strong><small>Total appointments</small></div></article>
        <article><span className="admin-stat-icon amber"><Activity size={21} /></span><div><strong>{todayAppointments}</strong><small>Visits today</small></div></article>
      </section>

      <div className="admin-data-grid">
        <section className="data-section">
          <div className="data-heading"><div><span>Clinical directory</span><h2>Doctors</h2></div><b>{doctors.length}</b></div>
          <div className="data-table-wrap"><table className="data-table">
            <thead><tr><th>Name</th><th>Specialization</th><th>Email</th><th>Role</th></tr></thead>
            <tbody>{doctors.map((doctor, index) => (
              <tr key={`${doctor.email}-${index}`}><td><div className="table-person"><span>{doctor.name?.charAt(0) || "D"}</span><strong>{doctor.name || "Unnamed doctor"}</strong></div></td><td>{doctor.specialization || doctor.department || "Physiotherapy"}</td><td>{doctor.email || "-"}</td><td><span className="role-badge">{doctor.role || "Doctor"}</span></td></tr>
            ))}</tbody>
          </table></div>
        </section>

        <section className="data-section">
          <div className="data-heading"><div><span>Patient activity</span><h2>Recent appointments</h2></div><b>{appointments.length}</b></div>
          <div className="data-table-wrap"><table className="data-table">
            <thead><tr><th>Patient</th><th>Doctor</th><th>Date</th><th>Diagnosis</th></tr></thead>
            <tbody>{appointments.map((appointment, index) => (
              <tr key={`${appointment.patientName}-${appointment.visitDate}-${index}`}><td><strong>{appointment.patientName || "Unnamed patient"}</strong></td><td>{appointment.doctorName || "-"}</td><td>{appointment.visitDate ? new Date(`${appointment.visitDate}T00:00:00`).toLocaleDateString("en-IN") : "-"}</td><td>{appointment.diagnosis || "Not recorded"}</td></tr>
            ))}</tbody>
          </table></div>
        </section>
      </div>
    </div>
  );
}
