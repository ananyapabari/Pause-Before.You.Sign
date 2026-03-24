import { Link } from "react-router-dom";

export default function HistoryList({ items }) {
  if (!items.length) {
    return (
      <section className="card stack">
        <h2>Recent Checks</h2>
        <p>No offer checks yet. Run your first analysis to build history.</p>
      </section>
    );
  }

  return (
    <section className="card stack">
      <h2>Recent Checks</h2>
      <ul className="history-list">
        {items.map((entry) => (
          <li key={entry.id} className="history-item">
            <div>
              <strong>{entry.company_name}</strong>
              <p>{new Date(entry.created_at).toLocaleString()}</p>
            </div>
            <span className={`pill risk-${entry.risk_level.toLowerCase()}`}>{entry.risk_level}</span>
          </li>
        ))}
      </ul>
      <Link className="btn-secondary" to="/new-check">
        Check New Offer
      </Link>
    </section>
  );
}
