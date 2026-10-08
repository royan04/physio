import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { Directory, Filesystem } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import { Download, Mail, MessageCircle, Printer, X } from "lucide-react";
import "./BillPreview.css";

function normalizePhone(value) {
  const digits = String(value || "").replace(/\D/g, "");
  return digits.length === 10 ? `91${digits}` : digits;
}

export default function BillPreview({ html, file, billNo, patientName, initialPhone = "", initialEmail = "", onDone }) {
  const [phone, setPhone] = useState(initialPhone);
  const [email, setEmail] = useState(initialEmail);
  const [nativeUri, setNativeUri] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    let cancelled = false;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const data = String(reader.result).split(",")[1];
        await Filesystem.writeFile({ path: file.name, data, directory: Directory.Cache });
        const { uri } = await Filesystem.getUri({ path: file.name, directory: Directory.Cache });
        if (!cancelled) setNativeUri(uri);
      } catch {
        if (!cancelled) setMessage("PDF sharing is unavailable on this device. You can still save the bill.");
      }
    };
    reader.readAsDataURL(file);
    return () => { cancelled = true; reader.abort(); };
  }, [file]);

  const download = async () => {
    if (Capacitor.isNativePlatform()) {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          await Filesystem.writeFile({ path: file.name, data: String(reader.result).split(",")[1], directory: Directory.Documents });
          setMessage(`${file.name} saved to the app's Documents folder.`);
        } catch {
          setMessage("Could not save the PDF on this device.");
        }
      };
      reader.readAsDataURL(file);
      return;
    }
    const url = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = url;
    link.download = file.name;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const share = async (channel) => {
    const to = channel === "whatsapp" ? normalizePhone(phone) : email.trim();
    if (channel === "whatsapp" && !/^\d{11,15}$/.test(to)) {
      setMessage("Enter the patient's phone number with country code.");
      return;
    }
    if (channel === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
      setMessage("Enter a valid patient email address.");
      return;
    }

    const title = `Bill ${billNo} - Shreeji Physio`;
    const body = `Hello ${patientName}, please find your physiotherapy bill ${billNo} attached.`;
    try {
      if (Capacitor.isNativePlatform() && nativeUri) {
        await Share.share({ title, text: body, files: [nativeUri], dialogTitle: `Choose ${channel === "whatsapp" ? "WhatsApp" : "an email app"}` });
        setMessage(`Share sheet opened. Select ${channel === "whatsapp" ? "WhatsApp and the patient" : "an email app and the patient"} to send the PDF.`);
        return;
      }
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ title, text: body, files: [file] });
        setMessage(`PDF passed to the share target. Confirm the recipient and send it there.`);
        return;
      }
      download();
      if (channel === "whatsapp") {
        window.open(`https://wa.me/${to}?text=${encodeURIComponent(`Hello ${patientName}, your bill ${billNo} is ready. Please see the PDF attachment.`)}`, "_blank", "noopener,noreferrer");
      } else {
        window.location.href = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`;
      }
      setMessage(`The PDF was downloaded. Attach ${file.name} in ${channel === "whatsapp" ? "WhatsApp" : "your email app"} before sending.`);
    } catch (error) {
      if (error?.name !== "AbortError") setMessage("Could not open sharing. Save the PDF and attach it manually.");
    }
  };

  return (
    <div className="bill-preview-screen" role="dialog" aria-modal="true" aria-label={`Bill ${billNo}`}>
      <header className="bill-preview-header">
        <div><span className="section-kicker">Bill ready</span><h2>{billNo}</h2><p>{patientName}</p></div>
        <button type="button" className="bill-preview-close" onClick={onDone} aria-label="Close bill preview"><X size={20} /></button>
      </header>
      <main className="bill-preview-body">
        <div className="bill-preview-paper"><iframe title="Bill preview" srcDoc={html} sandbox="" /></div>
        <aside className="bill-share-panel">
          <h3>Send to patient</h3>
          <label>WhatsApp number<input type="tel" inputMode="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+91 98765 43210" /></label>
          <button type="button" className="bill-share-whatsapp" onClick={() => share("whatsapp")} disabled={Capacitor.isNativePlatform() && !nativeUri}><MessageCircle size={18} /> Share via WhatsApp</button>
          <label>Email address<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="patient@example.com" /></label>
          <button type="button" className="bill-share-email" onClick={() => share("email")} disabled={Capacitor.isNativePlatform() && !nativeUri}><Mail size={18} /> Share via email</button>
          <p className="bill-share-help">{Capacitor.isNativePlatform() || navigator.canShare?.({ files: [file] }) ? "Choose the app and confirm the patient in the share sheet. The PDF is attached." : "The PDF downloads first. Attach it in the opened chat or email before sending."}</p>
          {message && <p className="bill-share-message" role="status">{message}</p>}
          <div className="bill-share-tools">
            <button type="button" onClick={download}><Download size={17} /> Save PDF</button>
            <button type="button" onClick={() => document.querySelector(".bill-preview-paper iframe")?.contentWindow?.print()}><Printer size={17} /> Print</button>
          </div>
        </aside>
      </main>
    </div>
  );
}
