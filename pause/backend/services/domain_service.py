"""Domain intelligence service backed by WHOIS lookups."""

from utils.domain_utils import get_domain_age


class DomainService:
    @staticmethod
    def get_domain_age_days(domain: str) -> int | None:
        """Return WHOIS-based age in days when available, otherwise None."""
        age_days, _ = get_domain_age(domain)
        return age_days

    @staticmethod
    def get_domain_age_metadata(domain: str) -> dict:
        try:
            age_days, created_at = get_domain_age(domain)
            return {
                "domain": domain,
                "age_days": age_days,
                "creation_date": created_at.isoformat() if created_at else None,
                "source": "whois" if age_days is not None else "whois_unavailable",
            }
        except Exception:
            return {
                "domain": domain,
                "age_days": None,
                "creation_date": None,
                "source": "whois_error",
            }
