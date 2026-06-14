// src/components/Layout.jsx
import { useLocation } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import "./Layout.css";

const Layout = ({ children }) => {
  const location = useLocation();
  const path = location.pathname;

  // Determine layout class based on route
  const getLayoutClass = () => {
    if (path === "/services") return "layout-main services-page";
    return "layout-main";
  };

  return (
    <div className="layout-container">
      <Header />

      <main className={getLayoutClass()}>
        <div className="app-wrapper">{children}</div>
      </main>
    </div>
  );
};

export default Layout;
