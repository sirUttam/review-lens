from __future__ import annotations
from typing import Iterable
from ..core.utils import hash_text
from ..models.review import Review


class DuplicateRemover:
    def remove_duplicates(self, reviews: Iterable[Review]) -> list[Review]:
        seen: set[str] = set()
        unique: list[Review] = []
        for review in reviews:
            key = hash_text(review.source, review.text, review.created_at)
            if key in seen:
                continue
            seen.add(key)
            unique.append(review)
        return unique
