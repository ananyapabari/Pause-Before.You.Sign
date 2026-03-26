import { NavLink } from "react-router-dom";
import AppLogo from "./AppLogo";

const navItems = [
  { label: "Dashboard", to: "/dashboard" },
  { label: "New Offer Check", to: "/new-check" },
  { label: "Report Scam", to: "/report-scam" },
  { label: "Profile", to: "/profile" },
];

const adminNavItems = [
  { label: "Admin Dashboard", to: "/admin" },
  { label: "Reported Scams", to: "/admin/scam-reports" },
  { label: "Users", to: "/admin/users" },
  { label: "Flagged Offers", to: "/admin/flagged-offers" },
  { label: "Rules", to: "/admin/rules" },
  { label: "Audit Logs", to: "/admin/logs" },
  { label: "Profile", to: "/profile" },
];

export default function Navbar({ onLogout }) {
  const userRaw = localStorage.getItem("pause_user");
  const user = userRaw ? JSON.parse(userRaw) : null;
  const items = user?.role === "admin" ? adminNavItems : navItems;

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <AppLogo className="navbar-logo" />
        <span className="navbar-title">Pause</span>
      </div>

      <div className="navbar-links">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              isActive ? "nav-link nav-link-active" : "nav-link"
            }
          >
            {item.label}
          </NavLink>
        ))}

        <button type="button" className="btn-secondary navbar-logout" onClick={onLogout}>
          Logout
        </button>
      </div>
    </nav>
  );
}
