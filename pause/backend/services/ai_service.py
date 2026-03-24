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
    def generate_explanation(reasons: list[str], job_description: str) -> str:
        """
        Generate a user-friendly explanation of why an offer is risky using Gemini AI.

        Args:
            reasons: List of detected risk signals (e.g., "Urgency pressure language detected")
            job_description: The job description text from the offer

        Returns:
            ai_explanation: A human-readable explanation of the risks, or fallback text on error
        """
        if not GEMINI_AVAILABLE:
            return AIService._get_fallback_explanation(reasons)

        api_key = os.getenv("GEMINI_API_KEY", "").strip()
        if not api_key:
            return AIService._get_fallback_explanation(reasons)

        try:
            genai.configure(api_key=api_key)
            prompt = AIService._build_prompt(reasons, job_description)

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

            return AIService._get_fallback_explanation(reasons)

        except Exception as e:
            print(f"[AI_SERVICE_ERROR] Gemini API failed: {str(e)}")
            return AIService._get_fallback_explanation(reasons)

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
    def _build_prompt(reasons: list[str], job_description: str) -> str:
        """Build the prompt for Gemini API."""
        reasons_text = "\n".join([f"- {reason}" for reason in reasons]) if reasons else "No specific signals detected"
        
        prompt = f"""Analyze this job offer and explain why it might be risky. Keep the explanation concise and user-friendly (2-3 sentences max).

Detected Risk Signals:
{reasons_text}

Job Description Excerpt:
{job_description[:500]}

Common recruitment scam patterns to mention if relevant:
- Recruitment Fee Scams: Requests for upfront payment, application fees, or transfers
- Impersonation Scams: Domain name misspellings, newly registered domains, non-HTTPS websites
- Urgency Pressure: Excessive urgency language ("act now", "limited time", "24 hours")

Provide a brief, clear explanation of what makes this offer suspicious. Focus on the detected signals above."""

        return prompt
    
    @staticmethod
    def _get_fallback_explanation(reasons: list[str]) -> str:
        """Return a fallback explanation when AI is not available."""
        if not reasons:
            return "This offer appears risky due to multiple suspicious signals detected."
        
        # Build a simple explanation from reasons
        reason_summary = " ".join(reasons[:2])  # Use first 2 reasons
        return f"This offer appears risky. Detected issues: {reason_summary}. Please review carefully before responding."
