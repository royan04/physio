import React from "react";
import { useLocation } from "react-router-dom";

const Bill = () => {
  const location = useLocation();
  const { patient, prescription, visits, doctor } = location.state || {};

  return (
    <div className="p-6 bg-white shadow-lg rounded-lg max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-center mb-4">Medical Bill</h2>

      {/* Doctor Info */}
      <div className="mb-4 text-right">
        <p className="font-semibold">{doctor}</p>
        <p>Physiotherapy Clinic</p>
      </div>

      {/* Patient Info */}
      <div className="mb-4 border p-3 rounded bg-gray-50">
        <p><b>Patient:</b> {patient?.name}</p>
        <p><b>Age:</b> {patient?.age}</p>
        <p><b>Condition:</b> {patient?.condition}</p>
      </div>

      {/* Treatment Info */}
      <div className="mb-4 border p-3 rounded">
        <p><b>Prescription:</b> {prescription}</p>
        <p><b>Visits:</b> {visits}</p>
      </div>

      {/* Charges (Example Calculation) */}
      <div className="mb-4 border p-3 rounded">
        <p><b>Consultation Fee:</b> ₹500</p>
        <p><b>Per Visit Charge:</b> ₹300 x {visits} = ₹{300 * (visits || 0)}</p>
        <hr className="my-2" />
        <p className="font-bold">Total: ₹{500 + 300 * (visits || 0)}</p>
      </div>

      <p className="text-center text-gray-500">Thank you for your visit!</p>
    </div>
  );
};

export default Bill;
