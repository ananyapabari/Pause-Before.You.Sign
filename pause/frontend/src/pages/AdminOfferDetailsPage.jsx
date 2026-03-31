import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Layout from "../components/Layout";
import { adminApi } from "../services/api";

const formatAIExplanation = (text) => {
  if (!text) {
    return <p className="recommendation">No AI explanation available.</p>;
  }

  const sections = text.split(/^###\s+/m).filter(Boolean);

  if (sections.length === 0) {
    return <p className="recommendation">{text}</p>;
  }

  return (
    <div className="ai-explanation-structured">
      {sections.map((section, idx) => {
        const lines = section.trim().split("\n");
        const header = lines[0]?.trim();
        const content = lines.slice(1).join("\n").trim();

        if (!header || !content) return null;

        const hasBullets = /^\s*\*/m.test(content);
        if (hasBullets) {
          const items = content
            .split("\n")
            .filter((line) => line.trim())
            .map((line) => line.replace(/^\s*\*\s*/, ""));

          return (
            <div key={idx} className="explanation-section">
              <h4>{header}</h4>
              <ul className="explanation-list">
                {items.map((item, itemIdx) => (
                  <li key={itemIdx}>{item}</li>
                ))}
              </ul>
            </div>
          );
        }

        return (
          <div key={idx} className="explanation-section">
            <h4>{header}</h4>
            <p>{content}</p>
          </div>
        );
      })}
    </div>
  );
};

const statusLabel = (status) => {
  const normalized = (status || "pending").toLowerCase();
  if (normalized === "false_positive") {
    return "False Positive";
  }
  if (normalized === "reviewed") {
    return "Reviewed";
  }
  return "Pending";
};

const statusClass = (status) => {
  const normalized = (status || "pending").toLowerCase();
  if (normalized === "reviewed") {
    return "status-badge status-reviewed";
  }
  if (normalized === "false_positive") {
    return "status-badge status-false-positive";
  }
  return "status-badge status-pending";
};

export default function AdminOfferDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [offer, setOffer] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadOffer = async () => {
      try {
        setError("");
        const response = await adminApi.getOfferDetail(id);
        setOffer(response.data);
      } catch (requestError) {
        setError(requestError.response?.data?.error || "Failed to load offer details.");
      }
    };

    loadOffer();
  }, [id]);

  const handleReviewAction = async (action) => {
    if (!offer) return;

    try {
      setSaving(true);
      setError("");
      const response = await adminApi.reviewOffer({ offer_id: offer.id, action });
      setOffer((current) => ({
        ...current,
        status: response.data?.status || response.data?.review_status || action,
        reviewed_by: response.data?.reviewed_by,
        reviewed_at: response.data?.reviewed_at,
      }));
      setSuccess(`Offer marked as ${statusLabel(action)}.`);
    } catch (requestError) {
      setError(requestError.response?.data?.error || "Failed to update moderation status.");
    } finally {
      setSaving(false);
    }
  };

  const riskBadgeClass = useMemo(() => {
    if (!offer?.risk_level) return "risk-badge risk-badge-medium";
    const normalized = offer.risk_level.toUpperCase();
    if (normalized === "HIGH") return "risk-badge risk-badge-high";
    if (normalized === "LOW") return "risk-badge risk-badge-low";
    return "risk-badge risk-badge-medium";
  }, [offer]);

  return (
    <Layout title="Offer Review" subtitle="Detailed moderation view for admin verification and action.">
      <header className="topbar">
        <div className="actions">
          <button type="button" className="btn-secondary" onClick={() => navigate(-1)}>
            Back
          </button>
          <Link className="btn-secondary" to="/admin">
            Admin Dashboard
          </Link>
        </div>
      </header>

      {error ? <p className="error">{error}</p> : null}
  {success ? <p className="success-text">{success}</p> : null}

      {!offer ? (
        <section className="card panel">
          <p className="helper">Loading offer details...</p>
        </section>
      ) : (
        <>
          <section className="card panel offer-review-header">
            <div>
              <h2>{offer.company_name}</h2>
              <p className="helper">
                Submitted {offer.created_at ? new Date(offer.created_at).toLocaleString() : "-"}
              </p>
            </div>
            <div className="offer-review-badges">
              <span className={riskBadgeClass}>{offer.risk_level}</span>
              <span className={statusClass(offer.status)}>{statusLabel(offer.status)}</span>
            </div>
          </section>

          <section className="grid-two">
            <article className="card panel">
              <h3>Offer Details</h3>
              <dl className="info-list">
                <div>
                  <dt>Company</dt>
                  <dd>{offer.company_name}</dd>
                </div>
                <div>
                  <dt>Email</dt>
                  <dd>{offer.email}</dd>
                </div>
                <div>
                  <dt>Website</dt>
                  <dd>{offer.website}</dd>
                </div>
              </dl>
            </article>

            <article className="card panel">
              <h3>Risk Summary</h3>
              <dl className="info-list">
                <div>
                  <dt>Risk Score</dt>
                  <dd>{offer.risk_score}/100</dd>
                </div>
                <div>
                  <dt>Risk Level</dt>
                  <dd>
                    <span className={riskBadgeClass}>{offer.risk_level}</span>
                  </dd>
                </div>
                <div>
                  <dt>Report Count</dt>
                  <dd>{offer.report_count || 0}</dd>
                </div>
                <div>
                  <dt>Previously Reported</dt>
                  <dd>{offer.is_previously_reported ? "Yes" : "No"}</dd>
                </div>
                <div>
                  <dt>Current Status</dt>
                  <dd>
                    <span className={statusClass(offer.status)}>{statusLabel(offer.status)}</span>
                  </dd>
                </div>
              </dl>
            </article>
          </section>

          <section className="card panel">
            <h3>Job Description</h3>
            <p className="offer-description">{offer.job_description}</p>
          </section>

          <section className="card panel">
            <h3>Reasons</h3>
            {offer.reasons?.length ? (
              <ul className="reason-list">
                {offer.reasons.map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
            ) : (
              <p className="helper">No reasons available.</p>
            )}
          </section>

          <section className="card panel">
            <h3>AI Explanation</h3>
            {formatAIExplanation(offer.ai_explanation)}
          </section>

          <section className="card panel">
            <h3>Moderation Action</h3>
            <div className="actions">
              <button
                type="button"
                className="btn-secondary btn-reviewed"
                disabled={saving}
                onClick={() => handleReviewAction("reviewed")}
              >
                {saving ? "Saving..." : "Mark as Reviewed"}
              </button>
              <button
                type="button"
                className="btn-secondary btn-false-positive"
                disabled={saving}
                onClick={() => handleReviewAction("false_positive")}
              >
                {saving ? "Saving..." : "Mark as False Positive"}
              </button>
            </div>
          </section>
        </>
      )}
    </Layout>
  );
}
