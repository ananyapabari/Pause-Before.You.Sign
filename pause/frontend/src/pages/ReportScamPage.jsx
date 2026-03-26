import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import { scamApi } from "../services/api";

const EMPTY_FORM = {
  companyName: "",
  email: "",
  website: "",
  description: "",
  reason: "",
};

export default function ReportScamPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const initialReport = location.state?.initialReport || {};

  const [form, setForm] = useState({
    companyName: initialReport.companyName || EMPTY_FORM.companyName,
    email: initialReport.email || EMPTY_FORM.email,
    website: initialReport.website || EMPTY_FORM.website,
    description: EMPTY_FORM.description,
    reason: EMPTY_FORM.reason,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const canSubmit = useMemo(() => {
    return form.companyName.trim() && form.reason.trim() && (form.website.trim() || form.email.trim());
  }, [form]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!canSubmit) {
      setError("Please provide company, reason, and at least website or email.");
      return;
    }

    try {
      setLoading(true);
      await scamApi.reportScam({
        companyName: form.companyName,
        companyWebsite: form.website,
        email: form.email,
        description: form.description,
        reason: form.reason,
      });
      setSuccess("Thanks. Your scam report has been submitted.");
      setForm((prev) => ({ ...prev, description: "", reason: "" }));
    } catch (requestError) {
      setError(requestError.response?.data?.error || "Failed to submit scam report.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout
      title="Report Scam Offer"
      subtitle="Help protect other users by reporting suspicious offers."
    >
      <section className="card panel form-panel">
        {error ? <p className="error-text">{error}</p> : null}
        {success ? <p className="success-text">{success}</p> : null}

        <form className="form-grid" onSubmit={handleSubmit}>
          <label htmlFor="companyName">Company Name</label>
          <input
            id="companyName"
            name="companyName"
            value={form.companyName}
            onChange={handleChange}
            required
          />

          <label htmlFor="email">Recruiter Email</label>
          <input
            id="email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="recruiter@example.com"
          />

          <label htmlFor="website">Company Website / Domain</label>
          <input
            id="website"
            name="website"
            value={form.website}
            onChange={handleChange}
            placeholder="https://example.com"
          />

          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            rows={5}
            value={form.description}
            onChange={handleChange}
            placeholder="Share what looked suspicious"
          />

          <label htmlFor="reason">Reason</label>
          <textarea
            id="reason"
            name="reason"
            rows={4}
            value={form.reason}
            onChange={handleChange}
            placeholder="Example: Asked for registration fee before interview"
            required
          />

          <div className="actions">
            <button type="submit" className="btn-primary" disabled={loading || !canSubmit}>
              {loading ? "Submitting..." : "Submit Report"}
            </button>
            <button type="button" className="btn-secondary" onClick={() => navigate(-1)}>
              Back
            </button>
          </div>
        </form>
      </section>
    </Layout>
  );
}
