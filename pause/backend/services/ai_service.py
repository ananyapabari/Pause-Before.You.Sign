"""AI-powered explanation generation using Google Gemini API."""

import os

try:
    import google.generativeai as genai
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False


class AIService:
    """Service for generating AI explanations using Google Gemini."""

    MODEL_CANDIDATES = [
        "gemini-2.5-flash",
        "models/gemini-2.5-flash",
        "gemini-2.0-flash",
        "models/gemini-2.0-flash",
        "gemini-1.5-flash",
        "gemini-1.5-flash-latest",
        "models/gemini-1.5-flash",
        "models/gemini-1.5-flash-latest",
        "gemini-pro",
        "models/gemini-pro",
    ]

    EXCLUDED_MODEL_SUBSTRINGS = (
        "preview",
        "experimental",
        "exp",
    )

    @staticmethod
    def generate_explanation(
        reasons: list[str],
        job_description: str,
        risk_level: str = "MEDIUM",
        scam_type: str = "Unknown",
        company_name: str = "",
    ) -> str:
        """
        Generate a user-friendly explanation of why an offer is risky using Gemini AI.

        Args:
            reasons: List of detected risk signals (e.g., "Urgency pressure language detected")
            job_description: The job description text from the offer
            risk_level: Assessed risk level (LOW, MEDIUM, HIGH)
            scam_type: Detected scam type (e.g., "Recruitment Fee Scam", "Impersonation Scam")
            company_name: Name of the company in the offer

        Returns:
            ai_explanation: A human-readable explanation of the risks, or fallback text on error
        """
        if not GEMINI_AVAILABLE:
            return AIService._get_fallback_explanation(reasons, risk_level, scam_type)

        api_key = os.getenv("GEMINI_API_KEY", "").strip()
        if not api_key:
            return AIService._get_fallback_explanation(reasons, risk_level, scam_type)

        try:
            genai.configure(api_key=api_key)
            prompt = AIService._build_prompt(
                reasons, job_description, risk_level, scam_type, company_name
            )

            model_names = AIService._resolve_model_names()
            if not model_names:
                print("[AI_SERVICE_ERROR] No compatible Gemini model found for generateContent")
                return AIService._get_fallback_explanation(reasons)

            for model_name in model_names:
                try:
                    model = genai.GenerativeModel(model_name)
                    response = model.generate_content(prompt, stream=False)

                    if response:
                        text = getattr(response, "text", "")
                        if text:
                            return text.strip()
                except Exception as model_exc:
                    print(f"[AI_SERVICE_WARNING] Model {model_name} failed: {model_exc}")
                    continue

            return AIService._get_fallback_explanation(reasons, risk_level, scam_type)

        except Exception as e:
            print(f"[AI_SERVICE_ERROR] Gemini API failed: {str(e)}")
            return AIService._get_fallback_explanation(reasons, risk_level, scam_type)

    @staticmethod
    def _resolve_model_names() -> list[str]:
        """Find compatible models that support generateContent, ordered by preference."""
        try:
            available = list(genai.list_models())
        except Exception:
            return AIService.MODEL_CANDIDATES[:]

        supported = {
            model.name
            for model in available
            if "generateContent" in getattr(model, "supported_generation_methods", [])
        }

        def _is_supported_and_stable(name: str) -> bool:
            lower = name.lower()
            if "gemini" not in lower:
                return False
            if any(token in lower for token in AIService.EXCLUDED_MODEL_SUBSTRINGS):
                return False
            return name in supported

        ordered: list[str] = []

        for candidate in AIService.MODEL_CANDIDATES:
            if _is_supported_and_stable(candidate):
                ordered.append(candidate)

        for name in sorted(supported):
            if _is_supported_and_stable(name) and name not in ordered:
                ordered.append(name)

        return ordered
    
    @staticmethod
    def _build_prompt(
        reasons: list[str],
        job_description: str,
        risk_level: str = "MEDIUM",
        scam_type: str = "Unknown",
        company_name: str = "",
    ) -> str:
        """Build a clean, markdown-structured prompt for Gemini API."""
        reasons_text = (
            "\n".join([f"* {reason}" for reason in reasons])
            if reasons
            else "* No specific signals detected"
        )

        prompt = f"""You are a cybersecurity assistant helping users evaluate job offers for potential scams.

Based on the following:

Risk Level: {risk_level}
Scam Type: {scam_type}
Detected Signals: {reasons_text}

Job Description:
{job_description[:600]}

Generate a response in STRICT FORMAT:

### Summary

(2-3 sentences explaining overall risk)

### Why this is risky

{reasons_text}

### What this means

(Explain scam behavior simply)

### Recommendation

(What user should do)

IMPORTANT:
- Use proper headings exactly as shown (### for all section headers)
- Use bullet points under 'Why this is risky'
- Keep tone natural and helpful
- Do NOT return everything in one paragraph
- Be specific about detected signals, not generic
- Use simple, clear language for all users
- Be empathetic and actionable"""

        return prompt
    
    @staticmethod
    def _get_fallback_explanation(
        reasons: list[str], risk_level: str = "MEDIUM", scam_type: str = "Unknown"
    ) -> str:
        """Return a structured fallback explanation when AI is not available."""
        if not reasons:
            return (
                "### Summary\n\n"
                "This offer does not show major scam indicators, but caution is still recommended.\n\n"
                "### Recommendation\n\n"
                "Verify company details through official websites and trusted channels before sharing any personal information."
            )

        # Build structured explanation from reasons
        reasons_bullets = "\n".join([f"* {reason}" for reason in reasons[:3]])
        
        if risk_level == "HIGH":
            recommendation = "Do not proceed with this offer. Verify the company's legitimacy through official channels before responding to any requests."
        elif risk_level == "MEDIUM":
            recommendation = "Exercise caution with this offer. Independently verify the recruiter's identity and company details before proceeding."
        else:
            recommendation = "This offer appears relatively safe, but always verify company details through official channels before sharing sensitive information."
        
        return (
            f"### Summary\n\n"
            f"This offer is marked as {risk_level} risk. Detected type: {scam_type}.\n\n"
            f"### Why this is risky\n\n"
            f"{reasons_bullets}\n\n"
            f"### What this means\n\n"
            f"These signals suggest potential fraudulent activity that could put your personal information or finances at risk.\n\n"
            f"### Recommendation\n\n"
            f"{recommendation}"
        )
