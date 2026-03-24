import RiskBadge from "./RiskBadge";

const recommendationByLevel = {
  LOW: "This offer shows low immediate risk, but still verify using official company channels.",
  MEDIUM:
    "This offer has caution signals. Verify recruiter identity and company details independently.",
  HIGH:
    "This offer shows multiple risk signals. Verify the company independently before proceeding.",
};

export default function RiskResult({ result }) {
  if (!result) {
    return null;
  }

  const { risk_level, risk_score, reasons = [], ai_explanation, scam_type } = result;
  const normalized = risk_level?.toUpperCase() || "LOW";
  const recommendationText =
    ai_explanation?.trim() || recommendationByLevel[normalized] || recommendationByLevel.MEDIUM;

  return (
    <section className="card panel stack">
      <h2>Risk Level</h2>
      <div className={`risk-indicator risk-indicator-${normalized.toLowerCase()}`}>
        <RiskBadge level={normalized} />
      </div>

      <div className="score-row">
        <p className="score-label">Risk Score</p>
        <p className="score-value">{risk_score}/100</p>
      </div>

      {scam_type ? (
        <div className="score-row">
          <p className="score-label">Scam Type</p>
          <p className="score-value" style={{ fontSize: "1.2rem" }}>{scam_type}</p>
        </div>
      ) : null}

      <h3>Reasons</h3>
      {reasons.length ? (
        <ul className="reason-list">
          {reasons.map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
      ) : (
        <p className="helper-text">No high-confidence indicators were triggered.</p>
      )}

      <h3>Recommendation</h3>
      <p className="recommendation">{recommendationText}</p>
    </section>
  );
}
