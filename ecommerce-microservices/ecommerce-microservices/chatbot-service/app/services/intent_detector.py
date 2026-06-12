"""
Intent Detector — classifies the user's question into intents
so we know which data to fetch from the business services.
"""

import re
from enum import Enum
from typing import Optional


class Intent(str, Enum):
    AVAILABILITY_CHECK = "availability_check"
    PRODUCT_SEARCH = "product_search"
    CATEGORY_SEARCH = "category_search"
    PRICE_SEARCH = "price_search"
    STATS = "stats"
    RECOMMENDATION = "recommendation"
    ORDER_STATUS = "order_status"
    GENERAL = "general"


class IntentDetector:

    AVAILABILITY_KEYWORDS = [
        "disponible", "en stock", "stock", "dispo", "disponibilité",
        "existe", "trouver", "cherche", "available", "id "
    ]

    STATS_KEYWORDS = [
        "combien", "statistique", "stats", "total", "nombre", "count",
        "en cours", "livré", "annulé", "rapport", "résumé"
    ]

    RECOMMENDATION_KEYWORDS = [
        "recommand", "conseil", "suggér", "meilleur", "populaire",
        "propose", "que penses-tu", "avis", "recommend"
    ]

    PRICE_KEYWORDS = [
        "moins de", "moins cher", "budget", "prix", "coût", "tarif",
        "pas cher", "économique", "affordable"
    ]

    CATEGORY_KEYWORDS = [
        "catégorie", "type", "genre", "électronique", "vêtement",
        "informatique", "mobile", "sport", "maison", "alimentation"
    ]

    def detect(self, question: str) -> tuple[Intent, Optional[str]]:
        """Returns (intent, extracted_parameter)"""
        q = question.lower()

        # Check for product ID availability
        id_match = re.search(r'\b(?:id|produit|article)\s*[:#]?\s*(\d+)\b', q)
        if id_match:
            return Intent.AVAILABILITY_CHECK, id_match.group(1)

        # Stats intent
        if any(kw in q for kw in self.STATS_KEYWORDS):
            return Intent.STATS, None

        # Recommendation intent
        if any(kw in q for kw in self.RECOMMENDATION_KEYWORDS):
            return Intent.RECOMMENDATION, None

        # Price search
        price_match = re.search(r'(\d+(?:\.\d+)?)\s*(?:dt|dinar|tnd|€|eur)', q)
        if price_match or any(kw in q for kw in self.PRICE_KEYWORDS):
            if price_match:
                return Intent.PRICE_SEARCH, price_match.group(1)
            return Intent.PRICE_SEARCH, None

        # Category search
        if any(kw in q for kw in self.CATEGORY_KEYWORDS):
            for kw in self.CATEGORY_KEYWORDS[2:]:  # skip generic words
                if kw in q:
                    return Intent.CATEGORY_SEARCH, kw.capitalize()
            return Intent.CATEGORY_SEARCH, None

        # Availability check
        if any(kw in q for kw in self.AVAILABILITY_KEYWORDS):
            return Intent.AVAILABILITY_CHECK, None

        # General product search
        return Intent.PRODUCT_SEARCH, None
