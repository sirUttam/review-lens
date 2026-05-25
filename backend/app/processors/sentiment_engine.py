from __future__ import annotations
from ..models.review import Review

try:
    from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
except ImportError:
    SentimentIntensityAnalyzer = None


class SentimentEngine:
    def __init__(self) -> None:
        self.analyzer = SentimentIntensityAnalyzer() if SentimentIntensityAnalyzer else None

    def score(self, review: Review) -> Review:
        text = (review.text or "").strip().lower()

        # 🚨 FILTER GARBAGE INPUTS
        if len(text) < 4 or text in {"hi", "ok", "lol", "hii", "hlo"}:
            review.sentiment = "neutral"
            return review

        sentiment = "neutral"

        if self.analyzer:
            scores = self.analyzer.polarity_scores(text)
            compound = scores.get("compound", 0.0)

            if compound >= 0.2:
                sentiment = "positive"
            elif compound <= -0.2:
                sentiment = "negative"
            else:
                sentiment = "neutral"
        else:
            # fallback
            positive_hits = sum(w in text.split() for w in {
                "good", "great", "excellent", "love", "amazing", "best", "fast", "smooth"
            })

            negative_hits = sum(w in text.split() for w in {
                "bad", "worst", "hate", "slow", "buggy", "lag", "crash", "problem"
            })

            if positive_hits > negative_hits:
                sentiment = "positive"
            elif negative_hits > positive_hits:
                sentiment = "negative"

        review.sentiment = sentiment
        return review

    def classify(self, reviews: list[Review]) -> list[Review]:
        return [self.score(r) for r in reviews]