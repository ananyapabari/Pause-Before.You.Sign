"""Scam type classification based on detected signals."""


def classify_scam_type(triggered_signals: list[str]) -> str:
    """
    Classify the scam type based on which risk signals were triggered.
    
    Args:
        triggered_signals: List of signal names (e.g., "payment_request", "urgency_language")
    
    Returns:
        scam_type: One of "Recruitment Fee Scam", "Impersonation Scam", 
                   "Urgency Pressure Scam", or "General Risk"
    """
    if not triggered_signals:
        return "General Risk"
    
    # Convert to set for efficient lookup
    signals_set = set(triggered_signals)
    
    # Check for payment-related scams
    if "payment_request" in signals_set:
        return "Recruitment Fee Scam"
    
    # Check for impersonation/domain scams
    impersonation_signals = {
        "suspicious_domain_impersonation",
        "website_not_https",
        "domain_age_lt_90_days",
        "domain_age_lt_1_year",
    }
    if signals_set & impersonation_signals:
        return "Impersonation Scam"
    
    # Check for urgency-based scams
    if "urgency_language" in signals_set:
        return "Urgency Pressure Scam"
    
    # Check for free email domain as general risk indicator
    if "free_email_domain" in signals_set:
        return "General Risk"
    
    return "General Risk"
