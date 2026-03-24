import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";

export default function Layout({ title, subtitle, children }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("pause_token");
    localStorage.removeItem("pause_user");
    navigate("/login");
  };

  return (
    <main className="app-shell">
      <Navbar onLogout={handleLogout} />
      <section className="page-container">
        {title ? (
          <header className="page-header">
            <h1>{title}</h1>
            {subtitle ? <p>{subtitle}</p> : null}
          </header>
        ) : null}
        {children}
      </section>
    </main>
  );
}
