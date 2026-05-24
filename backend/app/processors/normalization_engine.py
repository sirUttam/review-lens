from __future__ import annotations
from typing import Any
from ..models.review import Review


class NormalizationEngine:
    def normalize(self, raw_reviews: list[dict[str, Any]], product_name: str) -> list[Review]:
        normalized = []
        for item in raw_reviews:
            try:
                normalized.append(Review(**item))
            except Exception:
                continue
        return normalized
