import RiskBadge from "./RiskBadge";

const recommendationByLevel = {
  LOW: "This offer shows low immediate risk, but still verify using official company channels.",
  MEDIUM:
    "This offer has caution signals. Verify recruiter identity and company details independently.",
  HIGH:
    "This offer shows multiple risk signals. Verify the company independently before proceeding.",
};

const formatAIExplanation = (text) => {
  if (!text) return null;

  // Split by section headers (SUMMARY, WHY THIS IS RISKY, WHAT THIS MEANS, RECOMMENDATION)
  const sections = text.split(/\n(?=SUMMARY|WHY THIS IS RISKY|WHAT THIS MEANS|RECOMMENDATION)\n/i);
  
  if (sections.length === 1) {
    // No structured sections found, return as-is
    return <p className="recommendation">{text}</p>;
  }

  return (
    <div className="ai-explanation-structured">
      {sections.map((section, idx) => {
        const lines = section.trim().split("\n");
        const header = lines[0];
        const content = lines.slice(1).join("\n").trim();

        if (!header || !content) return null;

        return (
          <div key={idx} className="explanation-section">
            <h4>{header}</h4>
            <p>{content}</p>
          </div>
        );
      })}
    </div>
  );
};

export default function RiskResult({ result }) {
  if (!result) {
    return null;
  }

  const {
    risk_level,
    risk_score,
    reasons = [],
    ai_explanation,
    scam_type,
    is_previously_reported,
    reports_count,
  } = result;
  const normalized = risk_level?.toUpperCase() || "LOW";
  const formattedExplanation = formatAIExplanation(ai_explanation);
  const fallbackText =
    ai_explanation?.trim() || recommendationByLevel[normalized] || recommendationByLevel.MEDIUM;

  return (
    <section className="card panel stack">
      {is_previously_reported ? (
        <div className="warning-banner" role="alert">
          <strong>⚠ This offer has been reported as a scam by other users.</strong>
          {reports_count ? <span> Reported by {reports_count} user(s).</span> : null}
        </div>
      ) : null}

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

      <h3>Analysis</h3>
      {formattedExplanation || <p className="recommendation">{fallbackText}</p>}
    </section>
  );
}
