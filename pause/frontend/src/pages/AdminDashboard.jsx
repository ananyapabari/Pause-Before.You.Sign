import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "../components/Layout";
import { adminApi } from "../services/api";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");

  const distribution = stats?.risk_distribution || { HIGH: 0, MEDIUM: 0, LOW: 0 };
  const total = distribution.HIGH + distribution.MEDIUM + distribution.LOW;

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const response = await adminApi.getDashboard();
        setStats(response.data);
      } catch (requestError) {
        setError(requestError.response?.data?.error || "Failed to load admin dashboard.");
      }
    };

    loadDashboard();
  }, []);

  return (
    <Layout title="Admin Dashboard" subtitle="Operational overview for risk analysis activity.">
      <header className="topbar">
        <div className="actions">
          <Link className="btn-secondary" to="/admin/users">
            Users
          </Link>
          <Link className="btn-secondary" to="/admin/flagged-offers">
            Flagged Offers
          </Link>
          <Link className="btn-secondary" to="/admin/rules">
            Rule Management
          </Link>
          <Link className="btn-secondary" to="/admin/logs">
            Audit Logs
          </Link>
        </div>
      </header>

      {error ? <p className="error">{error}</p> : null}

      <section className="grid-two">
        <article className="card panel">
          <h2>Key Metrics</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <p className="stat-label">Total Analyses</p>
              <p className="stat-value">{stats?.total_offers_analyzed ?? 0}</p>
            </div>
            <div className="stat-card stat-high">
              <p className="stat-label">High Risk</p>
              <p className="stat-value">{stats?.high_risk_detections ?? 0}</p>
            </div>
            <div className="stat-card stat-medium">
              <p className="stat-label">Medium Risk</p>
              <p className="stat-value">{distribution.MEDIUM}</p>
            </div>
            <div className="stat-card stat-low">
              <p className="stat-label">Low Risk</p>
              <p className="stat-value">{distribution.LOW}</p>
            </div>
          </div>
        </article>

        <article className="card panel">
          <h2>Risk Distribution</h2>
          <div className="risk-chart">
            {[
              { label: "HIGH", value: distribution.HIGH, className: "risk-bar-high" },
              { label: "MEDIUM", value: distribution.MEDIUM, className: "risk-bar-medium" },
              { label: "LOW", value: distribution.LOW, className: "risk-bar-low" },
            ].map((item) => {
              const width = total > 0 ? Math.max((item.value / total) * 100, 6) : 0;
              return (
                <div key={item.label} className="risk-bar-row">
                  <span>{item.label}</span>
                  <div className="risk-bar-track">
                    <div className={`risk-bar-fill ${item.className}`} style={{ width: `${width}%` }} />
                  </div>
                  <strong>{item.value}</strong>
                </div>
              );
            })}
          </div>
        </article>
      </section>

      <section className="grid-two">
        <article className="card panel">
          <h2>Recent Flagged Activity</h2>
          <ul className="history-list">
            {(stats?.recent_flagged_activity || []).map((report) => (
              <li key={report.id} className="history-item">
                <span>{report.company_name}</span>
                <span className="risk-badge risk-badge-high">HIGH</span>
              </li>
            ))}
          </ul>
        </article>

        <article className="card panel">
          <h2>Recent Reports</h2>
          <ul className="history-list">
            {(stats?.recent_reports || []).map((report) => (
              <li key={report.id} className="history-item">
                <span>{report.company_name}</span>
                <span className={`risk-badge risk-badge-${report.risk_level.toLowerCase()}`}>
                  {report.risk_level}
                </span>
              </li>
            ))}
          </ul>
        </article>
      </section>
    </Layout>
  );
}
