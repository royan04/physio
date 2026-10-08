import { jsPDF } from "jspdf";

const clean = (value) => String(value ?? "").replace(/\s+/g, " ").trim();

export function createBillPdf(params) {
  const pdf = new jsPDF({ unit: "mm", format: "a4" });
  const left = 19;
  const right = 191;
  const width = right - left;
  const clinic = params.clinic || {};
  let y = 20;

  const line = () => {
    pdf.setDrawColor(215, 222, 220);
    pdf.line(left, y, right, y);
    y += 8;
  };
  const text = (value, x, top, options = {}) => pdf.text(clean(value), x, top, options);
  const detail = (label, value) => {
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(88, 101, 107);
    pdf.setFontSize(9);
    text(label.toUpperCase(), left, y);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(27, 39, 45);
    pdf.setFontSize(11);
    const wrapped = pdf.splitTextToSize(clean(value) || "-", width - 53);
    pdf.text(wrapped, left + 53, y);
    y += Math.max(11, wrapped.length * 5 + 5);
  };

  pdf.setFillColor(250, 252, 251);
  pdf.rect(0, 0, 210, 56, "F");
  pdf.setTextColor(177, 37, 49);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  text("RECEIPT CUM BILL", left, y);
  y += 9;
  pdf.setTextColor(27, 39, 45);
  pdf.setFontSize(17);
  const clinicName = pdf.splitTextToSize(clean(clinic.name) || "PHYSIOTHERAPY CLINIC", width);
  pdf.text(clinicName, left, y);
  y += clinicName.length * 8 + 2;
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  text(clinic.doctor, left, y);
  y = 67;
  detail("Bill number", params.billNo);
  detail("Date", params.billDate instanceof Date ? params.billDate.toLocaleDateString("en-IN") : params.billDate);
  line();
  detail("Patient", params.patientName);
  detail("Treatment", params.treatmentOf);
  detail("Duration", params.durationText);
  detail("Sessions", params.noOfSessions);
  detail("Session dates", params.sessionsDateText);
  detail("Rate per session", `Rs. ${Number(params.ratePerSession || 0).toFixed(2)}`);
  line();
  detail("Payment method", params.payMode || "Cash");
  if (params.payMode === "Cheque") {
    detail("Cheque number", params.chequeNo);
    detail("Cheque date", params.chequeDate);
  }
  if (params.payMode === "UPI") {
    detail("UPI ID", params.upiId);
    detail("Transaction ID", params.upiTxnId);
  }

  y += 2;
  pdf.setFillColor(255, 243, 244);
  pdf.roundedRect(left, y, width, 20, 2, 2, "F");
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(11);
  pdf.setTextColor(177, 37, 49);
  text("TOTAL PAID", left + 6, y + 12);
  pdf.setFontSize(16);
  text(`Rs. ${Number(params.amount || 0).toFixed(2)}`, right - 6, y + 13, { align: "right" });
  y += 32;

  pdf.setFontSize(10);
  pdf.setTextColor(27, 39, 45);
  text(params.doctorSign || clinic.doctor, right, y, { align: "right" });
  y = 263;
  pdf.setDrawColor(215, 222, 220);
  pdf.line(left, y, right, y);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  pdf.setTextColor(88, 101, 107);
  const footer = [clinic.address, clinic.phone, clinic.email].filter(Boolean).map(clean).join("  |  ");
  pdf.text(pdf.splitTextToSize(footer, width), left, y + 6);

  const fileName = `${clean(params.billNo || "bill").replace(/[^a-zA-Z0-9-_]/g, "_")}.pdf`;
  return new File([pdf.output("blob")], fileName, { type: "application/pdf" });
}
