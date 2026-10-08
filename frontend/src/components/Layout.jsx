import { useLocation } from "react-router-dom";
import Header from "./Header";
import "./Layout.css";

export default function Layout({ children }) {
  const { pathname } = useLocation();
  const isAuthRoute = pathname === "/" || pathname === "/signup";

  return (
    <div className={`layout-container ${isAuthRoute ? "auth-layout" : "workspace-layout"}`}>
      <Header />
      <main className="layout-main">
        <div className="app-wrapper">{children}</div>
      </main>
    </div>
  );
}
