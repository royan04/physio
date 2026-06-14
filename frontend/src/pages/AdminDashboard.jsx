import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebaseConfig";
import "./AdminDashboard.css";

const AdminDashboard = () => {
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const appointSnap = await getDocs(collection(db, "appointments"));
        const doctorSnap = await getDocs(collection(db, "doctors"));

        const appointData = appointSnap.docs.map((doc) => doc.data());
        const doctorData = doctorSnap.docs.map((doc) => doc.data());

        setAppointments(appointData);
        setDoctors(doctorData);
      } catch (error) {
        console.error("Error fetching admin data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <p className="loading">Loading clinic data...</p>;

  return (
    <div className="admin-dashboard">
      <h1 className="title">🏥 Clinic Overview</h1>

      <section className="stats">
        <div className="card">
          <h3>Total Doctors</h3>
          <p>{doctors.length}</p>
        </div>
        <div className="card">
          <h3>Total Appointments</h3>
          <p>{appointments.length}</p>
        </div>
      </section>

      <section className="data-section">
        <h2>👨‍⚕️ Doctors List</h2>
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Specialization</th>
              <th>Email</th>
              <th>Role</th>
            </tr>
          </thead>
          <tbody>
            {doctors.map((doc, i) => (
              <tr key={i}>
                <td>{doc.name}</td>
                <td>{doc.specialization}</td>
                <td>{doc.email}</td>
                <td>{doc.role}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="data-section">
        <h2>📅 Appointments</h2>
        <table className="data-table">
          <thead>
            <tr>
              <th>Patient</th>
              <th>Doctor</th>
              <th>Date</th>
              <th>Diagnosis</th>
            </tr>
          </thead>
          <tbody>
            {appointments.map((appt, i) => (
              <tr key={i}>
                <td>{appt.patientName}</td>
                <td>{appt.doctorName}</td>
                <td>{new Date(appt.visitDate).toLocaleDateString()}</td>
                <td>{appt.diagnosis}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
};

export default AdminDashboard;
