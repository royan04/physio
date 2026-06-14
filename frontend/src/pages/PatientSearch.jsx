import React, { useState } from "react";

function PatientSearch() {
  const [query, setQuery] = useState("");
  const [patients, setPatients] = useState([]);

  const handleSearch = () => {
    // Placeholder search logic
    if (query.trim()) {
      setPatients([
        { id: 1, name: "John Doe", lastVisit: "2025-08-10" },
        { id: 2, name: "Jane Smith", lastVisit: "2025-07-25" }
      ]);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Search Patients</h2>
      <input
        type="text"
        placeholder="Enter patient name"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <button onClick={handleSearch}>Search</button>

      <ul>
        {patients.map((p) => (
          <li key={p.id}>
            {p.name} - Last visit: {p.lastVisit}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default PatientSearch;
