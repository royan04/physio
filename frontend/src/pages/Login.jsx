import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Clock3, LockKeyhole, Mail, ShieldCheck, Sun, Sunset } from "lucide-react";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebaseConfig";
import "./Auth.css";

const timingOptions = [
  { value: "morning", label: "Morning", detail: "8 AM - 1 PM", Icon: Sun },
  { value: "evening", label: "Evening", detail: "2 PM - 7 PM", Icon: Sunset },
  { value: "both", label: "Full day", detail: "Both sessions", Icon: Clock3 },
];

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [timingSelection, setTimingSelection] = useState("morning");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.setItem("doctorTimingSelection", timingSelection);
  }, [timingSelection]);

  const handleLogin = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const doctorSnapshot = await getDoc(doc(db, "doctors", userCredential.user.uid));

      if (!doctorSnapshot.exists()) {
        setMessage("We could not find a clinic profile for this account.");
        return;
      }

      const doctorData = doctorSnapshot.data();
      localStorage.setItem("doctorData", JSON.stringify(doctorData));
      const token = await userCredential.user.getIdTokenResult();
      navigate(token.claims.admin === true ? "/admin" : "/dashboard", { state: { timingSelection, doctorData } });
    } catch (error) {
      console.error("Login Error:", error.message);
      setMessage("The email or password is incorrect. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setMessage("");
    if (!email) {
      setMessage("Enter your email first, then request a reset link.");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      setMessage("A password reset link has been sent to your email.");
    } catch (error) {
      console.error("Reset Error:", error.message);
      setMessage("We could not send the reset link. Check the email and try again.");
    }
  };

  return (
    <div className="auth-container">
      <aside className="auth-intro">
        <div className="auth-intro-mark"><ShieldCheck size={26} /></div>
        <p className="auth-eyebrow">Clinical workspace</p>
        <h1>Care organized around every patient.</h1>
        <p>Appointments, visit history, follow-ups and billing in one focused workspace for your clinic.</p>
        <div className="auth-trust-row">
          <span>Private clinic access</span>
          <span>Web &amp; Android ready</span>
        </div>
        <div className="auth-media" aria-hidden="true">
          <img className="auth-media-main" src="/assets/i7.jpg" alt="" />
          <div className="auth-media-stack">
            <img src="/assets/i2.jpg" alt="" />
            <img src="/assets/i10.jpg" alt="" />
          </div>
          <span className="auth-media-badge"><strong>11+</strong> treatment capabilities</span>
        </div>
      </aside>

      <section className="auth-card" aria-labelledby="login-title">
        <div className="auth-card-heading">
          <p className="auth-eyebrow">Welcome back</p>
          <h2 id="login-title" className="auth-title">Doctor login</h2>
          <p className="auth-subtitle">Sign in to continue to your daily schedule.</p>
        </div>

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label htmlFor="login-email"><Mail size={16} /> Email address</label>
            <input id="login-email" type="email" placeholder="doctor@clinic.com" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
          </div>

          <div className="form-group">
            <div className="label-row">
              <label htmlFor="login-password"><LockKeyhole size={16} /> Password</label>
              <button type="button" className="forgot-password-btn" onClick={handleForgotPassword}>Forgot password?</button>
            </div>
            <input id="login-password" type="password" placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
          </div>

          <fieldset className="timing-fieldset">
            <legend>Clinic session</legend>
            <div className="timing-options">
              {timingOptions.map(({ value, label, detail, Icon }) => (
                <label key={value} className={`timing-option ${timingSelection === value ? "selected" : ""}`}>
                  <input type="radio" name="timing" value={value} checked={timingSelection === value} onChange={(e) => setTimingSelection(e.target.value)} />
                  <Icon size={18} aria-hidden="true" />
                  <span><strong>{label}</strong><small>{detail}</small></span>
                </label>
              ))}
            </div>
          </fieldset>

          {message && <p className="auth-message" role="status">{message}</p>}

          <button type="submit" className="auth-btn" disabled={loading}>
            <span>{loading ? "Signing in..." : "Open workspace"}</span>
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>

        <p className="auth-footer">New to Shreeji? <Link to="/signup">Create a doctor account</Link></p>
      </section>
    </div>
  );
}
