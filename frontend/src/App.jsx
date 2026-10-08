import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebaseConfig";
import "./App.css";

import Layout from "./components/Layout";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Appointments from "./pages/Appointments";
import PatientSearch from "./pages/PatientSearch";
import NewAppointment from "./pages/NewAppointment";
import FollowUp from "./pages/FollowUp";
// import Bill from "./pages/Bill";           // ⬅️ old simple bill – no longer used
import Services from "./pages/Services";
import Doctors from "./pages/Doctors";
import AdminDashboard from "./pages/AdminDashboard";
import BillPage from "./pages/BillPage";     // ⬅️ new bill selection page

// 🔒 Protected Route Wrapper
const getStoredDoctor = () => {
  try {
    return JSON.parse(localStorage.getItem("doctorData"));
  } catch {
    localStorage.removeItem("doctorData");
    return null;
  }
};

const ProtectedRoute = ({ element }) => {
  const doctorData = getStoredDoctor();

  if (!doctorData) {
    return <Navigate to="/" replace />;
  }

  return element;
};

const AdminRoute = ({ element }) => {
  const [access, setAccess] = useState("checking");

  useEffect(() => {
    let active = true;
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        if (active) setAccess("signed-out");
        return;
      }

      try {
        const token = await user.getIdTokenResult(true);
        if (active) setAccess(token.claims.admin === true ? "allowed" : "denied");
      } catch {
        if (active) setAccess("denied");
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  if (access === "checking") return <div className="loading-screen"><p>Checking administrator access...</p></div>;
  if (access === "signed-out") return <Navigate to="/" replace />;
  if (access === "denied") return <Navigate to="/dashboard" replace />;
  return element;
};

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          {/* 🏁 Auth Routes */}
          <Route path="/" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* 🧠 Doctor Routes (Require Login) */}
          <Route
            path="/dashboard"
            element={<ProtectedRoute element={<Dashboard />} />}
          />
          <Route
            path="/appointments"
            element={<ProtectedRoute element={<Appointments />} />}
          />
          <Route
            path="/patients"
            element={<ProtectedRoute element={<PatientSearch />} />}
          />
          <Route
            path="/new-appointment"
            element={<ProtectedRoute element={<NewAppointment />} />}
          />
          <Route
            path="/follow-up"
            element={<ProtectedRoute element={<FollowUp />} />}
          />

          {/* ✅ use BillPage for /bill */}
          <Route
            path="/bill"
            element={<ProtectedRoute element={<BillPage />} />}
          />

          <Route
            path="/services"
            element={<ProtectedRoute element={<Services />} />}
          />
          <Route
            path="/doctors"
            element={<ProtectedRoute element={<Doctors />} />}
          />

          {/* 🧑‍💼 Admin-only route */}
          <Route
            path="/admin"
            element={
              <AdminRoute element={<AdminDashboard />} />
            }
          />

          {/* 🚫 Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
