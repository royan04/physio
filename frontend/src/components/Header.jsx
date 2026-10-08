import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import {
  CalendarPlus,
  CircleCheck,
  HeartPulse,
  LayoutDashboard,
  LogIn,
  LogOut,
  Menu,
  ReceiptText,
  ShieldCheck,
  Stethoscope,
  UserRoundSearch,
  Users,
  X,
} from "lucide-react";
import "./Header.css";

const workflowLinks = [
  { to: "/dashboard", label: "Overview", Icon: LayoutDashboard },
  { to: "/new-appointment", label: "New appointment", Icon: CalendarPlus },
  { to: "/follow-up", label: "Patient follow-up", Icon: UserRoundSearch },
  { to: "/bill", label: "Billing", Icon: ReceiptText },
];

const practiceLinks = [
  { to: "/services", label: "Facilities", Icon: HeartPulse },
  { to: "/doctors", label: "Clinical team", Icon: Stethoscope },
];

const mobileLinks = [
  { to: "/dashboard", label: "Home", Icon: LayoutDashboard },
  { to: "/new-appointment", label: "New visit", Icon: CalendarPlus },
  { to: "/follow-up", label: "Follow-up", Icon: Users },
  { to: "/bill", label: "Billing", Icon: ReceiptText },
];

function NavigationLink({ to, label, Icon, onClick }) {
  return (
    <NavLink to={to} onClick={onClick} className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
      <Icon size={18} aria-hidden="true" />
      <span>{label}</span>
    </NavLink>
  );
}

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();
  const auth = getAuth();

  useEffect(() => {
    let active = true;
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!active) return;
      setUser(currentUser);
      setIsAdmin(false);
      if (!currentUser) return;

      try {
        const token = await currentUser.getIdTokenResult();
        if (active) setIsAdmin(token.claims.admin === true);
      } catch {
        if (active) setIsAdmin(false);
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [auth]);

  const closeMenu = () => setIsOpen(false);
  const handleLogout = async () => {
    await signOut(auth);
    localStorage.removeItem("doctorData");
    closeMenu();
    navigate("/");
  };

  return (
    <>
      <header className="main-header">
        <nav className="header-inner" aria-label="Primary navigation">
          <NavLink className="brand" to={user ? (isAdmin ? "/admin" : "/dashboard") : "/"} onClick={closeMenu}>
            <img src="/assets/physio-bg.jpeg" alt="" />
            <span className="brand-copy">
              <strong>Shreeji Physio</strong>
              <small>Clinic &amp; Rehab Centre</small>
            </span>
          </NavLink>

          {user && (
            <div className={`desktop-nav ${isOpen ? "is-open" : ""}`}>
              <div className="nav-group workflow-nav">
                <span className="nav-section-label">Workspace</span>
                {workflowLinks.map((link) => <NavigationLink key={link.to} {...link} onClick={closeMenu} />)}
              </div>
              <div className="nav-group practice-nav">
                <span className="nav-section-label">Practice</span>
                {practiceLinks.map((link) => <NavigationLink key={link.to} {...link} onClick={closeMenu} />)}
                {isAdmin && <NavigationLink to="/admin" label="Administration" Icon={ShieldCheck} onClick={closeMenu} />}
              </div>
              <div className="clinic-status">
                <span className="status-mark"><CircleCheck size={17} /></span>
                <div><strong>Clinic online</strong><small>Systems operational</small></div>
              </div>
              <button className="logout-link" type="button" onClick={handleLogout}>
                <LogOut size={18} aria-hidden="true" />
                <span>Sign out</span>
              </button>
            </div>
          )}

          {!user && (
            <NavLink className="header-login" to="/">
              <LogIn size={18} aria-hidden="true" />
              <span>Doctor login</span>
            </NavLink>
          )}

          {user && (
            <button className="menu-toggle" type="button" aria-label={isOpen ? "Close navigation" : "Open navigation"} aria-expanded={isOpen} onClick={() => setIsOpen((open) => !open)}>
              {isOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          )}
        </nav>
      </header>

      {user && (
        <nav className="mobile-tab-bar" aria-label="Quick actions">
          {mobileLinks.map(({ to, label, Icon }) => (
            <NavLink key={to} to={to} className={({ isActive }) => `mobile-tab ${isActive ? "active" : ""}`}>
              <Icon size={21} strokeWidth={2} aria-hidden="true" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      )}
    </>
  );
}
