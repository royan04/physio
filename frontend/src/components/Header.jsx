import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import "bootstrap/dist/css/bootstrap.min.css";
import "./Header.css";

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const auth = getAuth();

  // Check if user is logged in
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, [auth]);

  const handleHomeClick = () => {
    if (user) {
      navigate("/dashboard");
    } else {
      navigate("/");
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
  };

  return (
    <header className="main-header">
      <nav className="navbar navbar-expand-md navbar-light">
        <div className="container">
          {/* Logo */}
          <a className="navbar-brand fw-bold text-danger fs-4 d-flex align-items-center gap-2" href="/">
            <img 
              src="/assets/physio-bg.jpeg"
              alt="Shreeji Physiotherapy Clinic Logo"
              style={{ height: "45px", width: "45px", objectFit: "contain" }}
            />
            <span>Shreeji Physiotherapy Clinic and Rehab Centre</span>
          </a>

          {/* Mobile Toggle */}
          <button
            className="navbar-toggler"
            type="button"
            onClick={() => setIsOpen(!isOpen)}
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          {/* Nav Links */}
          <div className={`collapse navbar-collapse ${isOpen ? "show" : ""}`}>
            <ul className="navbar-nav ms-auto mb-2 mb-md-0 align-items-center gap-2">

               {/* Home */}
               <li className="nav-item">
                  <button
                   className="btn btn-light icon-btn"
                   onClick={handleHomeClick}
                   title="Home"
                  >
                   <i className="bi bi-house-door-fill"></i>
                 </button>
               </li>

               {/* Services */}
               <li className="nav-item">
                 <a className="btn btn-light icon-btn" href="/services" title="Services">
                   <i className="bi bi-heart-pulse-fill"></i>
                 </a>
               </li>

               {/* Contact */}
               <li className="nav-item">
                 <a className="btn btn-light icon-btn" href="/contact" title="Contact">
                   <i className="bi bi-telephone-fill"></i>
                 </a>
               </li>

               {/* Login / Logout */}
               <li className="nav-item">
                 {user ? (
                  <button
                   className="btn btn-outline-danger icon-btn"
                   onClick={handleLogout}
                   title="Logout"
                  >
                    <i className="bi bi-box-arrow-right"></i>
                 </button>
                 ) : (
                   <a className="btn btn-danger icon-btn" href="/" title="Login">
                     <i className="bi bi-box-arrow-in-right"></i>
                   </a>
                 )}
               </li>

           </ul>

          </div>
        </div>
      </nav>
    </header>
  );
}
