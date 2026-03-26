import RiskBadge from "./RiskBadge";
import { analysisApi } from "../services/api";

const recommendationByLevel = {
  LOW: "This offer shows low immediate risk, but still verify using official company channels.",
  MEDIUM:
    "This offer has caution signals. Verify recruiter identity and company details independently.",
  HIGH:
    "This offer shows multiple risk signals. Verify the company independently before proceeding.",
};

const formatAIExplanation = (text) => {
  if (!text) return null;

  // Split by ### markdown headings
  const sections = text.split(/^###\s+/m).filter(Boolean);

  if (sections.length === 0) {
    return <p className="recommendation">{text}</p>;
  }

  return (
    <div className="ai-explanation-structured">
      {sections.map((section, idx) => {
        const lines = section.trim().split("\n");
        const header = lines[0].trim();
        const content = lines.slice(1).join("\n").trim();

        if (!header || !content) return null;

        // Check if content has bullet points
        const hasBullets = /^\s*\*/m.test(content);

        if (hasBullets) {
          // Parse bullet points into a list
          const items = content
            .split("\n")
            .filter((line) => line.trim())
            .map((line) => line.replace(/^\s*\*\s*/, ""));

          return (
            <div key={idx} className="explanation-section">
              <h4>{header}</h4>
              <ul className="explanation-list">
                {items.map((item, itemIdx) => (
                  <li key={itemIdx}>{item}</li>
                ))}
              </ul>
            </div>
          );
        }

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
    id,
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

  const handleDownloadPDF = async () => {
    if (!id) {
      alert("Unable to download report: Analysis ID not found");
      return;
    }

    try {
      const response = await analysisApi.downloadReport(id);

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `risk_analysis_${result.scam_type || "report"}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to download PDF:", error);
      alert("Failed to download PDF. Please try again.");
    }
  };

  return (
    <section className="card panel stack">
      {is_previously_reported ? (
        <div className="warning-banner" role="alert">
          <strong>⚠ This offer has been reported as a scam by other users.</strong>
          {reports_count ? <span> Reported by {reports_count} user(s).</span> : null}
        </div>
      ) : null}

      <div className="actions-row">
        <h2>Risk Level</h2>
        {id ? (
          <button className="btn-secondary-sm" type="button" onClick={handleDownloadPDF}>
            📥 Download Report
          </button>
        ) : null}
      </div>
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
