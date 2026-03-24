"""Text signal extraction for offer analysis."""

import re

from nltk.stem import PorterStemmer


class TextAnalysisService:
    STEMMER = PorterStemmer()

    PAYMENT_LEXICON = {
        "payment": {"payment", "pay", "paid", "repay"},
        "fee": {"fee", "fees", "application fee", "processing fee", "registration fee"},
        "deposit": {"deposit", "security deposit", "advance deposit"},
        "transfer": {"transfer", "wire transfer", "bank transfer", "fund transfer"},
        "upi": {"upi", "upi id"},
        "crypto": {"crypto", "cryptocurrency", "usdt", "bitcoin", "btc", "eth"},
    }

    URGENCY_LEXICON = {
        "urgent": {"urgent", "urgently"},
        "immediately": {"immediately", "immediate", "right away", "at once"},
        "within 24 hours": {"within 24 hours", "24 hours", "by tomorrow"},
        "act now": {"act now", "apply now", "respond now"},
        "asap": {"asap", "as soon as possible"},
        "limited time": {"limited time", "last date", "deadline today", "final call"},
    }

    NEGATION_TERMS = {
        "no",
        "not",
        "never",
        "without",
        "avoid",
        "dont",
        "don't",
        "free",
    }

    SUSPICIOUS_TERMS = set(PAYMENT_LEXICON) | set(URGENCY_LEXICON)

    @staticmethod
    def _tokenize(text: str) -> list[str]:
        return re.findall(r"[a-z0-9']+", text.lower())

    @classmethod
    def _stem_tokens(cls, tokens: list[str]) -> list[str]:
        return [cls.STEMMER.stem(token) for token in tokens]

    @classmethod
    def _variant_matches(
        cls,
        tokens: list[str],
        token_stems: list[str],
        variant: str,
    ) -> bool:
        variant_lower = variant.lower()

        variant_tokens = cls._tokenize(variant_lower)
        if not variant_tokens:
            return False

        variant_stems = cls._stem_tokens(variant_tokens)
        width = len(variant_stems)

        for idx in range(0, len(token_stems) - width + 1):
            if token_stems[idx : idx + width] != variant_stems:
                continue
            left_window = max(0, idx - 3)
            context = set(tokens[left_window:idx])
            if context & cls.NEGATION_TERMS:
                continue
            return True
        return False

    @classmethod
    def _find_terms(cls, text: str, lexicon: dict[str, set[str]]) -> list[str]:
        if not text:
            return []

        normalized = text.lower()
        tokens = cls._tokenize(normalized)
        token_stems = cls._stem_tokens(tokens)

        matches: list[str] = []
        for canonical, variants in lexicon.items():
            all_variants = set(variants) | {canonical}
            if any(
                cls._variant_matches(tokens, token_stems, variant)
                for variant in all_variants
            ):
                matches.append(canonical)

        return sorted(matches)

    @classmethod
    def detect_suspicious_wording(cls, text: str) -> bool:
        return bool(cls.list_triggered_terms(text))

    @classmethod
    def detect_payment_request(cls, text: str) -> bool:
        return bool(cls.list_payment_terms(text))

    @classmethod
    def detect_urgency_language(cls, text: str) -> bool:
        return bool(cls.list_urgency_terms(text))

    @classmethod
    def list_payment_terms(cls, text: str) -> list[str]:
        return cls._find_terms(text, cls.PAYMENT_LEXICON)

    @classmethod
    def list_urgency_terms(cls, text: str) -> list[str]:
        return cls._find_terms(text, cls.URGENCY_LEXICON)

    @classmethod
    def list_triggered_terms(cls, text: str) -> list[str]:
        return sorted(set(cls.list_payment_terms(text)) | set(cls.list_urgency_terms(text)))
