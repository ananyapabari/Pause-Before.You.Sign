import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import Layout from "../components/Layout";
import OfferTable from "../components/OfferTable";
import StatCard from "../components/StatCard";
import { analysisApi } from "../services/api";

const PIE_COLORS = {
  HIGH: "#B3433E",
  MEDIUM: "#C9852A",
  LOW: "#2B8C5A",
};

const emptyCounts = { HIGH: 0, MEDIUM: 0, LOW: 0 };

export default function DashboardPage() {
  const [history, setHistory] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const response = await analysisApi.getHistory();
        setHistory(response.data.slice().reverse());
      } catch (requestError) {
        setError(requestError.response?.data?.error || "Failed to load dashboard data.");
      }
    };

    loadHistory();
  }, []);

  const counts = useMemo(() => {
    const summary = { ...emptyCounts };
    history.forEach((item) => {
      if (summary[item.risk_level] !== undefined) {
        summary[item.risk_level] += 1;
      }
    });
    return summary;
  }, [history]);

  const chartData = useMemo(
    () => [
      { name: "High", value: counts.HIGH, key: "HIGH" },
      { name: "Medium", value: counts.MEDIUM, key: "MEDIUM" },
      { name: "Low", value: counts.LOW, key: "LOW" },
    ],
    [counts]
  );

  return (
    <Layout
      title="Dashboard"
      subtitle="Security analytics overview of your offer assessments."
    >
      {error ? <p className="error-text">{error}</p> : null}

      <section className="stats-grid">
        <StatCard label="Total Offers Checked" value={history.length} tone="neutral" />
        <StatCard label="High Risk Detections" value={counts.HIGH} tone="high" />
        <StatCard label="Medium Risk" value={counts.MEDIUM} tone="medium" />
        <StatCard label="Low Risk" value={counts.LOW} tone="low" />
      </section>

      <section className="card panel">
        <h2>Quick Actions</h2>
        <div className="actions">
          <Link to="/new-check" className="btn-primary">
            Check New Offer
          </Link>
          <Link to="/report-scam" className="btn-secondary">
            Report Scam Directly
          </Link>
        </div>
      </section>

      <section className="grid-two">
        <article className="card panel chart-panel">
          <h2>Risk Distribution</h2>
          <div className="chart-box" aria-label="Risk distribution pie chart">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={95}
                  innerRadius={45}
                  paddingAngle={4}
                >
                  {chartData.map((entry) => (
                    <Cell key={entry.key} fill={PIE_COLORS[entry.key]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value} checks`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="card panel">
          <h2>Recent Offer Checks</h2>
          <OfferTable items={history.slice(0, 6)} />
        </article>
      </section>
    </Layout>
  );
}
