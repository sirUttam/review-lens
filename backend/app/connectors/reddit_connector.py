from __future__ import annotations
import httpx
from datetime import datetime
from typing import Any
from .base_connector import BaseConnector
from ..core.config import settings


class RedditConnector(BaseConnector):
    async def fetch_reviews(self, product_name: str) -> list[dict[str, Any]]:
        if not settings.REDDIT_API_KEY:
            return self._get_mock_reviews(product_name)

        headers = {
            'User-Agent': 'ReviewLens/1.0 by reviewlens-app',
        }
        query = product_name.replace(' ', '+')
        url = f'https://www.reddit.com/search.json?q={query}&limit=6'
        async with httpx.AsyncClient(timeout=15.0, headers=headers) as client:
            response = await client.get(url)
            response.raise_for_status()
            payload = response.json()
            items = payload.get('data', {}).get('children', [])
            return [child['data'] for child in items if child.get('data')]

    def normalize(self, data: list[dict[str, Any]], product_name: str) -> list[dict[str, Any]]:
        normalized = []
        for item in data:
            text = item.get('title') or item.get('selftext') or ''
            if not text:
                continue
            normalized.append({
                'id': item.get('id', text[:64]),
                'source': 'reddit',
                'text': text,
                'rating': None,
                'likes': int(item.get('ups', 0) or 0),
                'created_at': datetime.fromtimestamp(item.get('created_utc')) if item.get('created_utc') else None,
                'product': product_name,
                'metadata': {
                    'subreddit': item.get('subreddit'),
                    'permalink': item.get('permalink'),
                },
            })
        return normalized

    def _get_mock_reviews(self, product_name: str) -> list[dict[str, Any]]:
        return [
            {
                'id': f'mock-reddit-{i}',
                'title': f'I love the {product_name} experience',
                'selftext': 'The camera performance is outstanding and battery life is solid.',
                'ups': 120 + i * 5,
                'created_utc': 1690000000 + i * 60,
                'subreddit': 'technology',
                'permalink': '/r/technology/mock',
            }
            for i in range(3)
        ] + [
            {
                'id': f'mock-reddit-neg-{i}',
                'title': f'I hate how the {product_name} handles updates',
                'selftext': 'The software feels unfinished and the device gets warm too quickly.',
                'ups': 35 + i * 3,
                'created_utc': 1690003600 + i * 60,
                'subreddit': 'gadgets',
                'permalink': '/r/gadgets/mock',
            }
            for i in range(2)
        ]
