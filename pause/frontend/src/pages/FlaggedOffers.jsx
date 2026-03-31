import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import { adminApi } from "../services/api";

export default function FlaggedOffers() {
  const navigate = useNavigate();
  const [offers, setOffers] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busyOfferId, setBusyOfferId] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("priority");

  const loadFlagged = async () => {
    try {
      setError("");
      setSuccess("");
      const response = await adminApi.getFlaggedOffers();
      setOffers(response.data);
    } catch (requestError) {
      setError(requestError.response?.data?.error || "Failed to load flagged offers.");
    }
  };

  useEffect(() => {
    loadFlagged();
  }, []);

  const mark = async (offerId, action) => {
    try {
      setBusyOfferId(offerId);
      await adminApi.reviewOffer({ offer_id: offerId, action });
      setOffers((current) =>
        current.map((offer) =>
          offer.id === offerId ? { ...offer, status: action, review_status: action } : offer
        )
      );
      setSuccess(`Offer marked as ${statusLabel(action)}.`);
    } catch (requestError) {
      setError(requestError.response?.data?.error || "Failed to update flagged offer.");
    } finally {
      setBusyOfferId(null);
    }
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

  const displayedOffers = useMemo(() => {
    const statusRank = {
      pending: 0,
      reviewed: 1,
      false_positive: 2,
    };

    let filtered = [...offers];
    if (filterStatus !== "all") {
      filtered = filtered.filter(
        (offer) => (offer.status || offer.review_status || "pending") === filterStatus
      );
    }

    filtered.sort((a, b) => {
      if (sortBy === "newest") {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }

      const rankDiff =
        statusRank[(a.status || a.review_status || "pending").toLowerCase()] -
        statusRank[(b.status || b.review_status || "pending").toLowerCase()];
      if (rankDiff !== 0) {
        return rankDiff;
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return filtered;
  }, [offers, filterStatus, sortBy]);

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
      {success ? <p className="success-text">{success}</p> : null}

      <section className="card panel">
        <div className="filters-row moderation-filters-row">
          <select value={filterStatus} onChange={(event) => setFilterStatus(event.target.value)}>
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="reviewed">Reviewed</option>
            <option value="false_positive">False Positive</option>
          </select>
          <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
            <option value="priority">Sort: Pending First</option>
            <option value="newest">Sort: Newest First</option>
          </select>
        </div>

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
              {displayedOffers.map((offer) => (
                <tr key={offer.id} className="clickable-row" onClick={() => navigate(`/admin/offers/${offer.id}`)}>
                  <td>{offer.company_name}</td>
                  <td>{offer.recruiter_email}</td>
                  <td>
                    <span className="risk-badge risk-badge-high">HIGH</span>
                  </td>
                  <td>
                    <span className={statusClass(offer.status || offer.review_status)}>
                      {statusLabel(offer.status || offer.review_status)}
                    </span>
                  </td>
                  <td>{new Date(offer.created_at).toLocaleString()}</td>
                  <td>
                    <div className="actions actions-compact" onClick={(event) => event.stopPropagation()}>
                      <button
                        type="button"
                        className="btn-secondary btn-reviewed"
                        onClick={() => mark(offer.id, "reviewed")}
                        disabled={busyOfferId === offer.id}
                      >
                        {busyOfferId === offer.id ? "Saving..." : "Mark as Reviewed"}
                      </button>
                      <button
                        type="button"
                        className="btn-secondary btn-false-positive"
                        onClick={() => mark(offer.id, "false_positive")}
                        disabled={busyOfferId === offer.id}
                      >
                        {busyOfferId === offer.id ? "Saving..." : "Mark as False Positive"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {displayedOffers.length === 0 ? <p className="helper">No high-risk analyses found.</p> : null}
      </section>
    </Layout>
  );
}