from __future__ import annotations
from ..models.review import Review
from ..processors.normalization_engine import NormalizationEngine
from ..processors.duplicate_remover import DuplicateRemover
from ..processors.quality_filter import ReviewQualityFilter
from ..processors.sentiment_engine import SentimentEngine
from .reddit_service import RedditService


class AggregatorService:
    def __init__(self):
        self.reddit_service = RedditService()
        self.normalizer = NormalizationEngine()
        self.duplicate_remover = DuplicateRemover()
        self.quality_filter = ReviewQualityFilter()
        self.sentiment_engine = SentimentEngine()

    async def aggregate(self, product_name: str) -> list[Review]:
        raw_reviews = await self.reddit_service.fetch_reviews(product_name)
        all_reviews = self.normalizer.normalize(raw_reviews, product_name)
        all_reviews = self.duplicate_remover.remove_duplicates(all_reviews)
        all_reviews = self.quality_filter.filter(all_reviews, product_name)
        all_reviews = self.sentiment_engine.classify(all_reviews)
        return sorted(all_reviews, key=lambda review: review.likes or 0, reverse=True)
