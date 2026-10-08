import { useState } from "react";
import { Search, UserRound } from "lucide-react";
import "./UtilityPages.css";

export default function PatientSearch() {
  const [query, setQuery] = useState("");
  const [patients, setPatients] = useState([]);

  const handleSearch = (event) => {
    event.preventDefault();
    if (query.trim()) {
      setPatients([
        { id: 1, name: "John Doe", lastVisit: "2025-08-10" },
        { id: 2, name: "Jane Smith", lastVisit: "2025-07-25" },
      ]);
    }
  };

  return (
    <div className="utility-page">
      <header className="utility-header compact">
        <p className="page-eyebrow">Patient records</p>
        <h1>Find a patient</h1>
      </header>
      <section className="utility-panel">
        <form className="search-row" onSubmit={handleSearch}>
          <label className="sr-only" htmlFor="patient-search">Patient name</label>
          <input id="patient-search" type="search" placeholder="Search by patient name" value={query} onChange={(e) => setQuery(e.target.value)} />
          <button type="submit"><Search size={18} /> Search</button>
        </form>
        <div className="simple-list patient-results">
          {patients.map((patient) => (
            <article key={patient.id} className="simple-list-row">
              <span className="list-icon"><UserRound size={18} /></span>
              <div><strong>{patient.name}</strong><span>Last visit {new Date(`${patient.lastVisit}T00:00:00`).toLocaleDateString("en-IN")}</span></div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
