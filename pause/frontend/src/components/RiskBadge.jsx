export default function RiskBadge({ level }) {
  const normalized = (level || "LOW").toUpperCase();
  return <span className={`risk-badge risk-badge-${normalized.toLowerCase()}`}>{normalized}</span>;
}
