import { Link, useLocation, useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import RiskResult from "../components/RiskResult";

export default function ResultPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const result = location.state?.result;
  const companyName = location.state?.companyName;
  const analyzedForm = location.state?.analyzedForm;

  if (!result) {
    return (
      <main className="landing-page">
        <div className="card stack empty-result-card">
          <h1>No analysis result available</h1>
          <p className="helper-text">Start a new check to generate a risk assessment.</p>
          <Link className="btn-primary" to="/new-check">
            New Offer Check
          </Link>
        </div>
      </main>
    );
  }

  return (
    <Layout title="Risk Analysis Result" subtitle={`Company: ${companyName}`}>
      <div className="actions">
        <button className="btn-secondary" type="button" onClick={() => navigate(-1)}>
          Back
        </button>
        <Link className="btn-primary" to="/dashboard">
          Dashboard
        </Link>
        <Link
          className="btn-danger"
          to="/report-scam"
          state={{
            initialReport: {
              companyName: companyName || analyzedForm?.companyName || "",
              email: analyzedForm?.recruiterEmail || "",
              website: analyzedForm?.companyWebsite || "",
            },
          }}
        >
          Report this Offer
        </Link>
      </div>
      <RiskResult result={result} />
    </Layout>
  );
}
