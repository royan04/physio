import { useEffect, useState } from "react";
import { CalendarDays, Clock3 } from "lucide-react";
import "./UtilityPages.css";

export default function Appointments() {
  const [appointments, setAppointments] = useState([]);

  useEffect(() => {
    setAppointments([
      { id: 1, patient: "John Doe", time: "10:00 AM" },
      { id: 2, patient: "Jane Smith", time: "11:30 AM" },
    ]);
  }, []);

  return (
    <div className="utility-page">
      <header className="utility-header compact">
        <p className="page-eyebrow">Daily schedule</p>
        <h1>Today's appointments</h1>
      </header>
      <section className="utility-panel">
        <div className="utility-panel-title"><CalendarDays size={19} /><h2>Upcoming visits</h2></div>
        <div className="simple-list">
          {appointments.map((appointment) => (
            <article key={appointment.id} className="simple-list-row">
              <span className="list-icon"><Clock3 size={18} /></span>
              <div><strong>{appointment.patient}</strong><span>{appointment.time}</span></div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
