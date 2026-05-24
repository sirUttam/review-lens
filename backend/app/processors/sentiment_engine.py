from __future__ import annotations
from ..models.review import Review

POSITIVE_WORDS = {
    'good', 'great', 'excellent', 'best', 'love', 'amazing', 'solid', 'clean', 'fast', 'responsive', 'reliable'
}
NEGATIVE_WORDS = {
    'bad', 'worst', 'hate', 'poor', 'slow', 'bug', 'lag', 'disappointing', 'warm', 'problem', 'expensive'
}


class SentimentEngine:
    def score(self, review: Review) -> Review:
        text = review.text.lower()
        positive_hits = sum(word in text for word in POSITIVE_WORDS)
        negative_hits = sum(word in text for word in NEGATIVE_WORDS)
        if positive_hits > negative_hits:
            sentiment = 'positive'
        elif negative_hits > positive_hits:
            sentiment = 'negative'
        else:
            sentiment = 'neutral'
        review.sentiment = sentiment
        return review

    def classify(self, reviews: list[Review]) -> list[Review]:
        return [self.score(review) for review in reviews]
