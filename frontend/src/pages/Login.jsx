// src/pages/Login.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { auth, db } from "../firebaseConfig";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import "./Auth.css";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [timingSelection, setTimingSelection] = useState('morning'); // 👈 NEW
  const navigate = useNavigate();

  // 👈 NEW: Save timing to localStorage
  useEffect(() => {
    localStorage.setItem('doctorTimingSelection', timingSelection);
  }, [timingSelection]);

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // Fetch doctor details from Firestore
      const docRef = doc(db, "doctors", user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const doctorData = docSnap.data();

        // Save to localStorage for dashboard use
        localStorage.setItem("doctorData", JSON.stringify(doctorData));

        alert(`Welcome Dr. ${doctorData.name}!`);

        // 👈 UPDATED: Pass timingSelection to dashboard
        navigate("/dashboard", {
          state: {
            timingSelection: timingSelection,
            doctorData: doctorData
          }
        });
      } else {
        alert("Doctor profile not found in database!");
      }
    } catch (error) {
      console.error("Login Error:", error.message);
      alert("Invalid credentials or user not found!");
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      alert("Please enter your email first.");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      alert("Password reset link sent to your email (Gmail).");
    } catch (error) {
      console.error("Reset Error:", error.message);
      alert("Failed to send reset email. Check email address.");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="auth-title">Doctor Login</h2>
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="auth-input"
              required
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="auth-input"
              required
            />
          </div>

          {/* 👈 NEW: TIMING SELECTOR */}
          <div style={{ margin: '20px 0', padding: '20px', border: '1px solid #ddd', borderRadius: '8px', background: '#f9f9f9' }}>
            <h3 style={{ marginTop: 0, fontSize: '16px' }}>Select Session Timing:</h3>
            <div style={{ display: 'flex', gap: '20px', marginBottom: '10px', flexWrap: 'wrap' }}>
              <label style={{ cursor: 'pointer', fontSize: '16px' }}>
                <input
                  type="radio"
                  name="timing"
                  value="morning"
                  checked={timingSelection === 'morning'}
                  onChange={(e) => {
                    setTimingSelection(e.target.value);
                    localStorage.setItem('doctorTimingSelection', e.target.value);
                  }}
                  style={{ marginRight: '8px', transform: 'scale(1.2)' }}
                />
                Morning (8 AM - 1 PM)
              </label>
              <label style={{ cursor: 'pointer', fontSize: '16px' }}>
                <input
                  type="radio"
                  name="timing"
                  value="evening"
                  checked={timingSelection === 'evening'}
                  onChange={(e) => {
                    setTimingSelection(e.target.value);
                    localStorage.setItem('doctorTimingSelection', e.target.value);
                  }}
                  style={{ marginRight: '8px', transform: 'scale(1.2)' }}
                />
                Evening (2 PM - 7 PM)
              </label>
              <label style={{ cursor: 'pointer', fontSize: '16px' }}>
                <input
                  type="radio"
                  name="timing"
                  value="both"
                  checked={timingSelection === 'both'}
                  onChange={(e) => {
                    setTimingSelection(e.target.value);
                    localStorage.setItem('doctorTimingSelection', e.target.value);
                  }}
                  style={{ marginRight: '8px', transform: 'scale(1.2)' }}
                />
                Both
              </label>
            </div>

            {/* Live Preview */}
            <div style={{ fontSize: '14px', color: '#555' }}>
              Bill Preview:
              <strong style={{ color: '#000' }}>
                {timingSelection === 'morning' && '8 AM - 1 PM'}
                {timingSelection === 'evening' && '2 PM - 7 PM'}
                {timingSelection === 'both' && '8 AM - 1 PM & 2 PM - 7 PM'}
              </strong>
            </div>
          </div>

          <button type="submit" className="auth-btn">
            Login
          </button>
          <button
            type="button"
            className="forgot-password-btn"
            onClick={handleForgotPassword}
          >
            Forgot Password?
          </button>
        </form>
        <p className="auth-footer">
          Don't have an account? <Link to="/signup">Sign Up</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
