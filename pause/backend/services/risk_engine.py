"""Risk scoring engine for offer trust assessment."""

from dataclasses import dataclass
from queue import Empty, Queue
from threading import Thread

from models.scam_report_model import ScamReportRepository
from models.rule_model import RiskRuleRepository
from services.ai_service import AIService
from services.domain_service import DomainService
from services.scam_classifier import classify_scam_type
from services.text_analysis_service import TextAnalysisService
from utils.domain_utils import (
    extract_domain,
    is_https,
    is_suspicious_impersonation_domain,
)


@dataclass
class RiskSignal:
    name: str
    default_weight: int
    reason: str


class RiskEngine:
    FREE_EMAIL_DOMAINS = {"gmail.com", "yahoo.com", "outlook.com"}
    WHOIS_TIMEOUT_SECONDS = 4
    AI_TIMEOUT_SECONDS = 8

    @staticmethod
    def _call_with_timeout(func, timeout_seconds: int, *args):
        """Run a blocking call in a daemon thread and return quickly on timeout."""
        result_queue: Queue = Queue(maxsize=1)

        def _worker() -> None:
            try:
                result_queue.put((True, func(*args)))
            except Exception as exc:  # pragma: no cover
                result_queue.put((False, exc))

        worker = Thread(target=_worker, daemon=True)
        worker.start()

        try:
            ok, value = result_queue.get(timeout=timeout_seconds)
        except Empty:
            raise TimeoutError()

        if ok:
            return value

        raise value

    SIGNALS = {
        "domain_age_lt_90_days": RiskSignal(
            name="domain_age_lt_90_days",
            default_weight=40,
            reason="Domain registered recently",
        ),
        "domain_age_lt_1_year": RiskSignal(
            name="domain_age_lt_1_year",
            default_weight=20,
            reason="Domain registered less than one year ago",
        ),
        "free_email_domain": RiskSignal(
            name="free_email_domain",
            default_weight=22,
            reason="Recruiter using free email domain",
        ),
        "payment_request": RiskSignal(
            name="payment_request",
            default_weight=28,
            reason="Message requests payment, fee, or transfer",
        ),
        "urgency_language": RiskSignal(
            name="urgency_language",
            default_weight=20,
            reason="Urgency pressure language detected",
        ),
        "website_not_https": RiskSignal(
            name="website_not_https",
            default_weight=15,
            reason="Company website not using HTTPS",
        ),
        "suspicious_domain_impersonation": RiskSignal(
            name="suspicious_domain_impersonation",
            default_weight=30,
            reason="Website domain appears to imitate a known large company",
        ),
        "previously_reported_scam": RiskSignal(
            name="previously_reported_scam",
            default_weight=45,
            reason="Previously reported as scam",
        ),
    }

    def _get_rule_weight(self, signal_name: str, fallback: int) -> int:
        rule = RiskRuleRepository.find_by_name(signal_name)
        if not rule:
            return fallback
        if not rule.enabled:
            return 0
        return rule.weight

    @staticmethod
    def _to_level(score: int) -> str:
        if score <= 25:
            return "LOW"
        if score <= 60:
            return "MEDIUM"
        return "HIGH"

    def analyze(
        self,
        company_name: str,
        job_description: str,
        recruiter_email: str,
        company_website: str,
    ) -> dict:
        """Evaluate risk signals and return a structured result."""
        score = 0
        reasons: list[str] = []
        triggered_signals: list[str] = []

        website_domain = extract_domain(company_website)
        email_domain = extract_domain(recruiter_email)

        reports_count = ScamReportRepository.count_by_domain_or_email(
            domain=website_domain,
            email=email_domain,
        )
        is_previously_reported = reports_count > 0
        if is_previously_reported:
            signal = self.SIGNALS["previously_reported_scam"]
            score += self._get_rule_weight(signal.name, signal.default_weight)
            reasons.append(signal.reason)
            triggered_signals.append(signal.name)

        try:
            domain_metadata = self._call_with_timeout(
                DomainService.get_domain_age_metadata,
                self.WHOIS_TIMEOUT_SECONDS,
                website_domain,
            )
        except TimeoutError:
            domain_metadata = {
                "domain": website_domain,
                "age_days": None,
                "creation_date": None,
                "source": "whois_timeout",
            }
        except Exception:
            domain_metadata = {
                "domain": website_domain,
                "age_days": None,
                "creation_date": None,
                "source": "whois_error",
            }
        domain_age_days = domain_metadata.get("age_days")

        if domain_age_days is not None and domain_age_days < 90:
            signal = self.SIGNALS["domain_age_lt_90_days"]
            score += self._get_rule_weight(signal.name, signal.default_weight)
            reasons.append(signal.reason)
            triggered_signals.append(signal.name)
        elif domain_age_days is not None and domain_age_days < 365:
            signal = self.SIGNALS["domain_age_lt_1_year"]
            score += self._get_rule_weight(signal.name, signal.default_weight)
            reasons.append(signal.reason)
            triggered_signals.append(signal.name)

        if email_domain in self.FREE_EMAIL_DOMAINS:
            signal = self.SIGNALS["free_email_domain"]
            score += self._get_rule_weight(signal.name, signal.default_weight)
            reasons.append(signal.reason)
            triggered_signals.append(signal.name)

        payment_terms = TextAnalysisService.list_payment_terms(job_description)
        urgency_terms = TextAnalysisService.list_urgency_terms(job_description)

        if payment_terms:
            signal = self.SIGNALS["payment_request"]
            score += self._get_rule_weight(signal.name, signal.default_weight)
            reasons.append(signal.reason)
            triggered_signals.append(signal.name)

        if urgency_terms:
            signal = self.SIGNALS["urgency_language"]
            score += self._get_rule_weight(signal.name, signal.default_weight)
            reasons.append(signal.reason)
            triggered_signals.append(signal.name)

        if not is_https(company_website):
            signal = self.SIGNALS["website_not_https"]
            score += self._get_rule_weight(signal.name, signal.default_weight)
            reasons.append(signal.reason)
            triggered_signals.append(signal.name)

        if is_suspicious_impersonation_domain(website_domain):
            signal = self.SIGNALS["suspicious_domain_impersonation"]
            score += self._get_rule_weight(signal.name, signal.default_weight)
            reasons.append(signal.reason)
            triggered_signals.append(signal.name)

        # Keep score bounded for consistent UI display.
        score = max(0, min(100, score))
        
        # Classify scam type and generate AI explanation.
        # Skip external AI calls when no risk signals are present to keep responses fast and reliable.
        scam_type = classify_scam_type(triggered_signals)
        if not reasons:
            ai_explanation = (
                "No major scam indicators were detected in this offer. "
                "Still verify company details through trusted channels before sharing personal information."
            )
        else:
            try:
                ai_explanation = self._call_with_timeout(
                    AIService.generate_explanation,
                    self.AI_TIMEOUT_SECONDS,
                    reasons,
                    job_description,
                )
            except TimeoutError:
                ai_explanation = "This offer appears risky due to multiple suspicious signals."
            except Exception:
                ai_explanation = "This offer appears risky due to multiple suspicious signals."

        return {
            "company_name": company_name,
            "risk_score": score,
            "risk_level": self._to_level(score),
            "scam_type": scam_type,
            "is_previously_reported": is_previously_reported,
            "reports_count": reports_count,
            "reasons": reasons,
            "ai_explanation": ai_explanation,
            "meta": {
                "domain_name": website_domain,
                "website_domain": website_domain,
                "email_domain": email_domain,
                "is_previously_reported": is_previously_reported,
                "reports_count": reports_count,
                "domain_age_days": domain_age_days,
                "domain_creation_date": domain_metadata.get("creation_date"),
                "domain_lookup_source": domain_metadata.get("source"),
                "triggered_terms": TextAnalysisService.list_triggered_terms(job_description),
                "payment_terms": payment_terms,
                "urgency_terms": urgency_terms,
            },
        }
