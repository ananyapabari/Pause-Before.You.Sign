import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "../components/Layout";
import { adminApi } from "../services/api";

export default function AdminScamReportsPage() {
  const [reports, setReports] = useState([]);
  const [summary, setSummary] = useState({
    total_reports: 0,
    most_reported_domain: null,
    most_reported_domain_count: 0,
    recent_reports: [],
  });
  const [groupedDomains, setGroupedDomains] = useState([]);
  const [error, setError] = useState("");
  const [busyReportId, setBusyReportId] = useState(null);

  const loadReports = async () => {
    try {
      setError("");
      const response = await adminApi.getScamReports();
      setReports(response.data?.reports || []);
      setSummary(response.data?.summary || {});
      setGroupedDomains(response.data?.grouped_domains || []);
    } catch (requestError) {
      setError(requestError.response?.data?.error || "Failed to load reported scams dashboard.");
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const handleMarkReviewed = async (reportId) => {
    try {
      setBusyReportId(reportId);
      await adminApi.reviewScamReport({ report_id: reportId });
      await loadReports();
    } catch (requestError) {
      setError(requestError.response?.data?.error || "Failed to mark report as reviewed.");
    } finally {
      setBusyReportId(null);
    }
  };

  const recentReportCount = useMemo(() => (summary?.recent_reports || []).length, [summary]);

  return (
    <Layout
      title="Reported Scams Dashboard"
      subtitle="Admin visibility into user-submitted scam intelligence and review status."
    >
      <header className="topbar">
        <div className="actions">
          <Link className="btn-secondary" to="/admin">
            Back to Admin
          </Link>
        </div>
      </header>

      {error ? <p className="error">{error}</p> : null}

      <section className="stats-grid">
        <article className="stat-card">
          <p className="stat-label">Total Reports</p>
          <p className="stat-value">{summary?.total_reports ?? 0}</p>
        </article>

        <article className="stat-card stat-high">
          <p className="stat-label">Most Reported Domain</p>
          <p className="stat-value admin-metric-text">{summary?.most_reported_domain || "N/A"}</p>
          <p className="helper">Count: {summary?.most_reported_domain_count ?? 0}</p>
        </article>

        <article className="stat-card stat-medium">
          <p className="stat-label">Recent Reports</p>
          <p className="stat-value">{recentReportCount}</p>
        </article>

        <article className="stat-card stat-low">
          <p className="stat-label">Reviewed</p>
          <p className="stat-value">{reports.filter((report) => report.status === "reviewed").length}</p>
        </article>
      </section>

      <section className="grid-two">
        <article className="card panel">
          <h2>Top Reported Domains</h2>
          <ul className="history-list">
            {groupedDomains.slice(0, 6).map((entry) => (
              <li className="history-item" key={entry.domain}>
                <span>{entry.domain}</span>
                <span className={entry.report_count >= 3 ? "count-pill count-pill-high" : "count-pill"}>
                  {entry.report_count}
                </span>
              </li>
            ))}
          </ul>
          {groupedDomains.length === 0 ? <p className="helper">No grouped domain data yet.</p> : null}
        </article>

        <article className="card panel">
          <h2>Latest Submissions</h2>
          <ul className="history-list">
            {(summary?.recent_reports || []).map((report) => (
              <li className="history-item" key={report.id}>
                <span>{report.company_name}</span>
                <span className="helper">{new Date(report.created_at).toLocaleDateString()}</span>
              </li>
            ))}
          </ul>
          {(summary?.recent_reports || []).length === 0 ? (
            <p className="helper">No recent reports available.</p>
          ) : null}
        </article>
      </section>

      <section className="card panel">
        <h2>All Reported Scams</h2>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Company Name</th>
                <th>Domain</th>
                <th>Email</th>
                <th>Reports Count</th>
                <th>Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => {
                const highCount = report.report_count >= 3;
                const statusClass = report.status === "reviewed" ? "risk-badge risk-badge-low" : "risk-badge risk-badge-medium";

                return (
                  <tr key={report.id}>
                    <td>{report.company_name}</td>
                    <td>{report.domain || "-"}</td>
                    <td>{report.email || "-"}</td>
                    <td>
                      <span className={highCount ? "count-pill count-pill-high" : "count-pill"}>
                        {report.report_count}
                      </span>
                    </td>
                    <td>{new Date(report.created_at).toLocaleString()}</td>
                    <td>
                      <span className={statusClass}>{report.status}</span>
                    </td>
                    <td>
                      <div className="actions actions-compact">
                        <button
                          type="button"
                          className="btn-secondary"
                          disabled={report.status === "reviewed" || busyReportId === report.id}
                          onClick={() => handleMarkReviewed(report.id)}
                        >
                          {busyReportId === report.id ? "Saving..." : "Mark Reviewed"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {reports.length === 0 ? <p className="helper">No reported scams submitted yet.</p> : null}
      </section>
    </Layout>
  );
}
