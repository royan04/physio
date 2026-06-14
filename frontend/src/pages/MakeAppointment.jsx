import React, { useState } from "react";

function PatientVisitForm() {
  const [patientName, setPatientName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [contact, setContact] = useState("");
  const [visitDate, setVisitDate] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [prescription, setPrescription] = useState("");
  const [doctorName, setDoctorName] = useState("");
  const [department, setDepartment] = useState("");
  const [prescriptionFile, setPrescriptionFile] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();

    // prepare form data
    const formData = new FormData();
    formData.append("patientName", patientName);
    formData.append("age", age);
    formData.append("gender", gender);
    formData.append("contact", contact);
    formData.append("visitDate", visitDate);
    formData.append("symptoms", symptoms);
    formData.append("diagnosis", diagnosis);
    formData.append("prescription", prescription);
    formData.append("doctorName", doctorName);
    formData.append("department", department);

    if (prescriptionFile) {
      formData.append("prescriptionFile", prescriptionFile);
    }

    // Example: send to backend API
    fetch("http://localhost:4000/api/patient-visits", {
      method: "POST",
      body: formData,
    })
      .then((res) => res.json())
      .then((data) => {
        alert("Visit saved successfully!");
        console.log(data);

        // reset form
        setPatientName("");
        setAge("");
        setGender("");
        setContact("");
        setVisitDate("");
        setSymptoms("");
        setDiagnosis("");
        setPrescription("");
        setDoctorName("");
        setDepartment("");
        setPrescriptionFile(null);
      })
      .catch((err) => console.error(err));
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Patient Visit Form</h2>
      <form onSubmit={handleSubmit}>
        {/* Patient Info */}
        <h3>Patient Info</h3>
        <input
          type="text"
          placeholder="Patient Name"
          value={patientName}
          onChange={(e) => setPatientName(e.target.value)}
        />
        <input
          type="number"
          placeholder="Age"
          value={age}
          onChange={(e) => setAge(e.target.value)}
        />
        <select value={gender} onChange={(e) => setGender(e.target.value)}>
          <option value="">Select Gender</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
          <option value="Other">Other</option>
        </select>
        <input
          type="text"
          placeholder="Contact"
          value={contact}
          onChange={(e) => setContact(e.target.value)}
        />

        {/* Visit Details */}
        <h3>Visit Details</h3>
        <input
          type="datetime-local"
          value={visitDate}
          onChange={(e) => setVisitDate(e.target.value)}
        />
        <textarea
          placeholder="Symptoms / Complaints"
          value={symptoms}
          onChange={(e) => setSymptoms(e.target.value)}
        />
        <textarea
          placeholder="Diagnosis"
          value={diagnosis}
          onChange={(e) => setDiagnosis(e.target.value)}
        />
        <textarea
          placeholder="Prescription (Text)"
          value={prescription}
          onChange={(e) => setPrescription(e.target.value)}
        />

        <div>
          <label>Upload Prescription (Photo): </label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setPrescriptionFile(e.target.files[0])}
          />
        </div>

        {/* Doctor Info */}
        <h3>Doctor Info</h3>
        <input
          type="text"
          placeholder="Doctor Name"
          value={doctorName}
          onChange={(e) => setDoctorName(e.target.value)}
        />
        <input
          type="text"
          placeholder="Department"
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
        />

        <br />
        <button type="submit">Save Visit</button>
      </form>
    </div>
  );
}

export default PatientVisitForm;