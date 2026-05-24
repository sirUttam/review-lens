from __future__ import annotations
import re
from typing import Iterable
from ..models.review import Review
from ..core.config import settings

URL_PATTERN = re.compile(r'https?://\S+|www\.\S+', re.IGNORECASE)
MARKDOWN_PATTERN = re.compile(r'[#>*_`~\[\]\(\)]')
SENTENCE_SPLIT_PATTERN = re.compile(r'(?<=[.!?])\s+')


class SummaryGenerator:
    async def generate(self, product_name: str, reviews: Iterable[Review]) -> str:
        reviews = list(reviews)
        if settings.OPENAI_API_KEY:
            return await self._generate_ai_summary(product_name, reviews)
        return self._generate_summary(product_name, reviews)

    def _generate_summary(self, product_name: str, reviews: list[Review]) -> str:
        total = len(reviews)
        positive = sum(1 for review in reviews if review.sentiment == 'positive')
        negative = sum(1 for review in reviews if review.sentiment == 'negative')
        neutral = sum(1 for review in reviews if review.sentiment == 'neutral')

        if total == 0:
            return f'No relevant Reddit product insights were found for {product_name} after cleaning and quality filtering.'

        positive_insights = self._build_insights([review for review in reviews if review.sentiment == 'positive'])[:3]
        negative_insights = self._build_insights([review for review in reviews if review.sentiment == 'negative'])[:3]

        tone = 'Mostly positive' if positive > negative else 'Mostly negative' if negative > positive else 'Mostly neutral'
        positive_text = '; '.join(positive_insights) if positive_insights else 'positive signals are limited'
        negative_text = '; '.join(negative_insights) if negative_insights else 'negative signals are limited'

        return (
            f'{tone} sentiment for {product_name}. '
            f'Positive signals include: {positive_text}. '
            f'Negative signals include: {negative_text}.'
        )

    def generate_insights(self, reviews: Iterable[Review]) -> dict[str, object]:
        reviews = list(reviews)
        positive_insights = self._build_insights([review for review in reviews if review.sentiment == 'positive'])
        negative_insights = self._build_insights([review for review in reviews if review.sentiment == 'negative'])
        neutral_insights = self._build_insights([review for review in reviews if review.sentiment == 'neutral'])

        return {
            'positive_insights': positive_insights[:10],
            'negative_insights': negative_insights[:10],
            'neutral_insights': neutral_insights[:10],
            'stats': {
                'total': len(reviews),
                'positive': sum(1 for review in reviews if review.sentiment == 'positive'),
                'negative': sum(1 for review in reviews if review.sentiment == 'negative'),
                'neutral': sum(1 for review in reviews if review.sentiment == 'neutral'),
            },
        }

    def _build_insights(self, reviews: list[Review]) -> list[str]:
        seen: set[str] = set()
        insights: list[str] = []
        for review in reviews:
            insight = self._sanitize_insight(review.text)
            if not insight or insight in seen:
                continue
            seen.add(insight)
            insights.append(insight)
            if len(insights) >= 10:
                break
        return insights

    def _sanitize_insight(self, text: str, max_length: int = 120) -> str:
        cleaned = URL_PATTERN.sub('', text)
        cleaned = MARKDOWN_PATTERN.sub('', cleaned)
        cleaned = re.sub(r'\s+', ' ', cleaned).strip()
        sentences = [sentence.strip() for sentence in SENTENCE_SPLIT_PATTERN.split(cleaned) if sentence.strip()]
        insight = sentences[0] if sentences else cleaned

        if len(insight) > max_length:
            insight = insight[:max_length].rstrip()
            insight = re.sub(r'\s+\S*?$', '', insight)
            insight = f'{insight}...'

        return insight.rstrip('.').strip()

    async def _generate_ai_summary(self, product_name: str, reviews: list[Review]) -> str:
        return self._generate_summary(product_name, reviews)
