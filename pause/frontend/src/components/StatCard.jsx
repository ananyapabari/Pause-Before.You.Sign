export default function StatCard({ label, value, tone = "neutral" }) {
  return (
    <article className={`stat-card stat-${tone}`}>
      <p className="stat-label">{label}</p>
      <h3 className="stat-value">{value}</h3>
    </article>
  );
}
