from __future__ import annotations
from ..models.review import Review

try:
    from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
except ImportError:  # pragma: no cover
    SentimentIntensityAnalyzer = None

POSITIVE_WORDS = {
    'good', 'great', 'excellent', 'love', 'amazing', 'best', 'solid', 'smooth', 'clean',
    'fast', 'reliable', 'awesome', 'fantastic', 'recommend', 'favorite', 'worthy', 'pleased'
}
NEGATIVE_WORDS = {
    'bad', 'terrible', 'worst', 'hate', 'poor', 'broken', 'slow', 'buggy', 'expensive',
    'issue', 'problem', 'frustrating', 'disappointing', 'unreliable', 'glitch', 'crash', 'laggy'
}


class SentimentEngine:
    def __init__(self) -> None:
        self.analyzer = SentimentIntensityAnalyzer() if SentimentIntensityAnalyzer else None

    def score(self, review: Review) -> Review:
        text = (review.text or '').strip()

        sentiment = 'neutral'
        if self.analyzer and text:
            scores = self.analyzer.polarity_scores(text)
            compound = scores.get('compound', 0.0)
            if compound >= 0.05:
                sentiment = 'positive'
            elif compound <= -0.05:
                sentiment = 'negative'
            else:
                sentiment = 'neutral'
        else:
            lower_text = text.lower()
            positive_hits = sum(word in lower_text for word in POSITIVE_WORDS)
            negative_hits = sum(word in lower_text for word in NEGATIVE_WORDS)
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
