import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, BriefcaseMedical, LockKeyhole, Mail, Phone, ShieldCheck, UserRound } from "lucide-react";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebaseConfig";
import "./Auth.css";

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [department, setDepartment] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleSignup = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      await updateProfile(user, { displayName: name });
      const doctorData = { uid: user.uid, name, email, phone, department, createdAt: new Date().toISOString() };
      await setDoc(doc(db, "doctors", user.uid), doctorData);
      localStorage.setItem("doctorData", JSON.stringify(doctorData));
      navigate("/dashboard");
    } catch (error) {
      console.error("Signup Error:", error.message);
      setMessage(error.message.replace("Firebase: ", ""));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container signup-container">
      <aside className="auth-intro">
        <div className="auth-intro-mark"><ShieldCheck size={26} /></div>
        <p className="auth-eyebrow">Set up your workspace</p>
        <h1>A calmer way to run the day.</h1>
        <p>Create your secure doctor profile and keep patient visits, follow-ups and billing close at hand.</p>
        <div className="auth-trust-row">
          <span>Fast daily workflows</span>
          <span>Responsive on every screen</span>
        </div>
        <div className="auth-media" aria-hidden="true">
          <img className="auth-media-main" src="/assets/i5.jpg" alt="" />
          <div className="auth-media-stack">
            <img src="/assets/i8.jpg" alt="" />
            <img src="/assets/i3.jpg" alt="" />
          </div>
          <span className="auth-media-badge"><strong>One</strong> connected workspace</span>
        </div>
      </aside>

      <section className="auth-card auth-card-wide" aria-labelledby="signup-title">
        <div className="auth-card-heading">
          <p className="auth-eyebrow">Doctor registration</p>
          <h2 id="signup-title" className="auth-title">Create your account</h2>
          <p className="auth-subtitle">Use your professional details for the clinic profile.</p>
        </div>

        <form onSubmit={handleSignup}>
          <div className="signup-grid">
            <div className="form-group">
              <label htmlFor="signup-name"><UserRound size={16} /> Full name</label>
              <input id="signup-name" type="text" placeholder="Dr. Full Name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required />
            </div>
            <div className="form-group">
              <label htmlFor="signup-email"><Mail size={16} /> Email address</label>
              <input id="signup-email" type="email" placeholder="doctor@clinic.com" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
            </div>
            <div className="form-group">
              <label htmlFor="signup-password"><LockKeyhole size={16} /> Password</label>
              <input id="signup-password" type="password" placeholder="Minimum 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" minLength={6} required />
            </div>
            <div className="form-group">
              <label htmlFor="signup-phone"><Phone size={16} /> Phone number</label>
              <input id="signup-phone" type="tel" placeholder="Clinic contact number" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" required />
            </div>
            <div className="form-group signup-full-row">
              <label htmlFor="signup-department"><BriefcaseMedical size={16} /> Department</label>
              <input id="signup-department" type="text" placeholder="e.g. Orthopaedic physiotherapy" value={department} onChange={(e) => setDepartment(e.target.value)} required />
            </div>
          </div>

          {message && <p className="auth-message" role="alert">{message}</p>}

          <button type="submit" className="auth-btn" disabled={loading}>
            <span>{loading ? "Creating account..." : "Create account"}</span>
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>

        <p className="auth-footer">Already registered? <Link to="/">Sign in</Link></p>
      </section>
    </div>
  );
}
