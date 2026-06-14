import React, { useState, useEffect } from "react";

function Appointments() {
  const [appointments, setAppointments] = useState([]);

  useEffect(() => {
    // Placeholder data until backend is connected
    setAppointments([
      { id: 1, patient: "John Doe", time: "10:00 AM" },
      { id: 2, patient: "Jane Smith", time: "11:30 AM" }
    ]);
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h2>Today's Appointments</h2>
      <ul>
        {appointments.map((appt) => (
          <li key={appt.id}>
            {appt.time} - {appt.patient}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Appointments;
