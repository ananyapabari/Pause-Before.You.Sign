import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import { adminApi } from "../services/api";

export default function AdminScamReportsPage() {
  const navigate = useNavigate();
  const [offers, setOffers] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busyOfferId, setBusyOfferId] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterRisk, setFilterRisk] = useState("all");
  const [sortBy, setSortBy] = useState("priority");

  const loadOffers = async () => {
    try {
      setError("");
      setSuccess("");
      const response = await adminApi.getReportedOffers();
      setOffers(response.data || []);
    } catch (requestError) {
      setError(requestError.response?.data?.error || "Failed to load reported offers.");
    }
  };

  useEffect(() => {
    loadOffers();
  }, []);

  const handleAction = async (offerId, action) => {
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
      setError(requestError.response?.data?.error || "Failed to update reported offer.");
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
    const riskRank = {
      HIGH: 0,
      MEDIUM: 1,
      LOW: 2,
    };

    let filtered = [...offers];
    if (filterStatus !== "all") {
      filtered = filtered.filter(
        (offer) => (offer.status || offer.review_status || "pending") === filterStatus
      );
    }

    if (filterRisk !== "all") {
      filtered = filtered.filter((offer) => (offer.risk_level || "").toUpperCase() === filterRisk);
    }

    filtered.sort((a, b) => {
      if (sortBy === "reports") {
        return (b.report_count || 0) - (a.report_count || 0);
      }
      if (sortBy === "newest") {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }

      const statusDiff =
        statusRank[(a.status || a.review_status || "pending").toLowerCase()] -
        statusRank[(b.status || b.review_status || "pending").toLowerCase()];
      if (statusDiff !== 0) {
        return statusDiff;
      }

      const riskDiff = riskRank[(a.risk_level || "LOW").toUpperCase()] - riskRank[(b.risk_level || "LOW").toUpperCase()];
      if (riskDiff !== 0) {
        return riskDiff;
      }

      return (b.report_count || 0) - (a.report_count || 0);
    });

    return filtered;
  }, [offers, filterStatus, filterRisk, sortBy]);

  return (
    <Layout
      title="Reported Offers"
      subtitle="Offers with prior community scam reports that require moderation review."
    >
      <header className="topbar">
        <div className="actions">
          <Link className="btn-secondary" to="/admin">
            Back to Admin
          </Link>
        </div>
      </header>

      {error ? <p className="error">{error}</p> : null}
      {success ? <p className="success-text">{success}</p> : null}

      <section className="card panel">
        <h2>Moderation Queue</h2>
        <div className="filters-row moderation-filters-row">
          <select value={filterStatus} onChange={(event) => setFilterStatus(event.target.value)}>
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="reviewed">Reviewed</option>
            <option value="false_positive">False Positive</option>
          </select>
          <select value={filterRisk} onChange={(event) => setFilterRisk(event.target.value)}>
            <option value="all">All Risk Levels</option>
            <option value="HIGH">HIGH</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="LOW">LOW</option>
          </select>
          <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
            <option value="priority">Sort: Pending then High Risk</option>
            <option value="reports">Sort: Most Reports</option>
            <option value="newest">Sort: Newest First</option>
          </select>
        </div>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Company</th>
                <th>Email</th>
                <th>Website</th>
                <th>Risk</th>
                <th>Report Count</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayedOffers.map((offer) => {
                const riskClass =
                  offer.risk_level === "HIGH"
                    ? "risk-badge risk-badge-high"
                    : offer.risk_level === "MEDIUM"
                    ? "risk-badge risk-badge-medium"
                    : "risk-badge risk-badge-low";

                return (
                  <tr key={offer.id} className="clickable-row" onClick={() => navigate(`/admin/offers/${offer.id}`)}>
                    <td>{offer.company_name}</td>
                    <td>{offer.recruiter_email}</td>
                    <td>{offer.company_website}</td>
                    <td>
                      <span className={riskClass}>{offer.risk_level}</span>
                    </td>
                    <td>
                      <span className={offer.report_count >= 3 ? "count-pill count-pill-high" : "count-pill"}>
                        {offer.report_count || 0}
                      </span>
                    </td>
                    <td>
                      <span className={statusClass(offer.status || offer.review_status)}>
                        {statusLabel(offer.status || offer.review_status)}
                      </span>
                    </td>
                    <td>
                      <div className="actions actions-compact" onClick={(event) => event.stopPropagation()}>
                        <button
                          type="button"
                          className="btn-secondary btn-reviewed"
                          disabled={busyOfferId === offer.id}
                          onClick={() => handleAction(offer.id, "reviewed")}
                        >
                          {busyOfferId === offer.id ? "Saving..." : "Mark as Reviewed"}
                        </button>
                        <button
                          type="button"
                          className="btn-secondary btn-false-positive"
                          disabled={busyOfferId === offer.id}
                          onClick={() => handleAction(offer.id, "false_positive")}
                        >
                          {busyOfferId === offer.id ? "Saving..." : "Mark as False Positive"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {displayedOffers.length === 0 ? <p className="helper">No previously reported offers found.</p> : null}
      </section>
    </Layout>
  );
}
