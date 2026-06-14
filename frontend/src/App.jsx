import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
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
const ProtectedRoute = ({ element, allowedRoles }) => {
  const doctorData = JSON.parse(localStorage.getItem("doctorData"));

  if (!doctorData) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(doctorData.role)) {
    return <Navigate to="/dashboard" replace />;
  }

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
              <ProtectedRoute
                element={<AdminDashboard />}
                allowedRoles={["admin"]}
              />
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
