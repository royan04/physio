import { BadgeCheck, Stethoscope } from "lucide-react";
import "./UtilityPages.css";

const doctors = [
  { name: "Dr. Asha Menon", specialization: "Senior Physiotherapist" },
  { name: "Dr. Rahul Verma", specialization: "Sports Injury Specialist" },
  { name: "Dr. Meera Sharma", specialization: "Post-Surgery Recovery Expert" },
];

export default function Doctors() {
  return (
    <div className="utility-page">
      <header className="utility-header">
        <p className="page-eyebrow">Clinical team</p>
        <h1>Meet our physiotherapists</h1>
        <p>Experienced practitioners focused on personal recovery plans and measurable progress.</p>
      </header>
      <section className="doctor-grid" aria-label="Doctors">
        {doctors.map((doctor) => (
          <article className="doctor-card" key={doctor.name}>
            <div className="doctor-avatar" aria-hidden="true">{doctor.name.replace("Dr. ", "").charAt(0)}</div>
            <div className="doctor-card-copy">
              <h2>{doctor.name} <BadgeCheck size={17} aria-label="Verified" /></h2>
              <p>{doctor.specialization}</p>
              <span><Stethoscope size={15} /> Physiotherapy</span>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
