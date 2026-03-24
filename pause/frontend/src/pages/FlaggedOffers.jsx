import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "../components/Layout";
import { adminApi } from "../services/api";

export default function FlaggedOffers() {
  const [offers, setOffers] = useState([]);
  const [error, setError] = useState("");

  const loadFlagged = async () => {
    try {
      setError("");
      const response = await adminApi.getFlaggedOffers();
      setOffers(response.data);
    } catch (requestError) {
      setError(requestError.response?.data?.error || "Failed to load flagged offers.");
    }
  };

  useEffect(() => {
    loadFlagged();
  }, []);

  const mark = async (offerId, status) => {
    try {
      await adminApi.reviewFlaggedOffer(offerId, { status });
      await loadFlagged();
    } catch (requestError) {
      setError(requestError.response?.data?.error || "Failed to update flagged offer.");
    }
  };

  return (
    <Layout
      title="Flagged Offers"
      subtitle="Review high-risk detections and resolve investigation outcomes."
    >
      <header className="topbar">
        <Link className="btn-secondary" to="/admin">
          Back to Admin
        </Link>
      </header>

      {error ? <p className="error">{error}</p> : null}

      <section className="card panel">
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Company</th>
                <th>Recruiter Email</th>
                <th>Risk</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {offers.map((offer) => (
                <tr key={offer.id}>
                  <td>{offer.company_name}</td>
                  <td>{offer.recruiter_email}</td>
                  <td>
                    <span className="risk-badge risk-badge-high">HIGH</span>
                  </td>
                  <td>{offer.review_status || "pending"}</td>
                  <td>{new Date(offer.created_at).toLocaleString()}</td>
                  <td>
                    <div className="actions actions-compact">
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => mark(offer.id, "reviewed")}
                      >
                        Mark Reviewed
                      </button>
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => mark(offer.id, "false_positive")}
                      >
                        False Positive
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {offers.length === 0 ? <p className="helper">No high-risk analyses found.</p> : null}
      </section>
    </Layout>
  );
}