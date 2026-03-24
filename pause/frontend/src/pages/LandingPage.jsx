import { useNavigate } from "react-router-dom";
import AppLogo from "../components/AppLogo";

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <main className="landing-page landing-screen">
      <section className="landing-hero landing-shell">
        <AppLogo className="landing-logo" />
        <h1 className="landing-title">Pause</h1>
        <p className="landing-tagline">Before you sign.</p>
        <p className="landing-description">
          Pause helps users evaluate job and internship offers before they commit,
          using practical risk checks to highlight suspicious patterns and potential
          scam indicators.
        </p>
        <div className="landing-actions" role="group" aria-label="Account actions">
          <button
            type="button"
            className="landing-btn landing-btn-primary"
            onClick={() => navigate("/register")}
          >
            Create Account
          </button>
          <button
            type="button"
            className="landing-btn landing-btn-secondary"
            onClick={() => navigate("/login")}
          >
            Login
          </button>
        </div>
      </section>
    </main>
  );
}
