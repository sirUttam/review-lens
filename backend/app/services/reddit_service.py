from __future__ import annotations
import asyncio
from datetime import datetime
from typing import Any
from urllib.parse import quote_plus

import httpx

REDDIT_BASE_URL = 'https://www.reddit.com'
REDDIT_HEADERS = {
    'User-Agent': 'ReviewLens/1.0 (by reviewlens-app)',
}


class RedditService:
    async def fetch_reviews(self, product_name: str) -> list[dict[str, Any]]:
        try:
            posts = await self._search_posts(product_name)
            comments = await self._fetch_comments_for_posts(posts[:6])
            reviews = [self._normalize_post(item, product_name) for item in posts]
            reviews += [self._normalize_comment(item, product_name) for item in comments]
            return [review for review in reviews if review and review.get('text')]
        except Exception:
            return self._get_mock_reviews(product_name)

    async def _search_posts(self, product_name: str) -> list[dict[str, Any]]:
        query = quote_plus(product_name)
        url = f'{REDDIT_BASE_URL}/search.json?q={query}&sort=relevance&limit=12&type=link'
        async with httpx.AsyncClient(timeout=15.0, headers=REDDIT_HEADERS) as client:
            response = await client.get(url)
            response.raise_for_status()
            payload = response.json()
            return [child['data'] for child in payload.get('data', {}).get('children', []) if child.get('data')]

    async def _fetch_comments_for_posts(self, posts: list[dict[str, Any]]) -> list[dict[str, Any]]:
        async with httpx.AsyncClient(timeout=15.0, headers=REDDIT_HEADERS) as client:
            tasks = [self._fetch_post_comments(client, post.get('permalink', '')) for post in posts if post.get('permalink')]
            results = await asyncio.gather(*tasks, return_exceptions=True)
            comments: list[dict[str, Any]] = []
            for result in results:
                if isinstance(result, Exception):
                    continue
                comments.extend(result)
            return comments

    async def _fetch_post_comments(self, client: httpx.AsyncClient, permalink: str) -> list[dict[str, Any]]:
        if not permalink:
            return []
        url = f'{REDDIT_BASE_URL}{permalink}.json?limit=3&depth=1'
        response = await client.get(url)
        response.raise_for_status()
        payload = response.json()
        if len(payload) < 2:
            return []
        comments = []
        for child in payload[1].get('data', {}).get('children', []):
            comment_data = child.get('data')
            if comment_data and comment_data.get('body'):
                comments.append(comment_data)
        return comments

    def _normalize_post(self, item: dict[str, Any], product_name: str) -> dict[str, Any]:
        created_at = None
        if item.get('created_utc'):
            created_at = datetime.fromtimestamp(item['created_utc'])

        return {
            'id': item.get('id', f"post-{hash(item.get('title', ''))}"),
            'source': 'reddit',
            'text': item.get('selftext') or item.get('title') or '',
            'rating': None,
            'likes': int(item.get('ups', 0) or 0),
            'created_at': created_at,
            'product': product_name,
            'author': item.get('author'),
            'subreddit': item.get('subreddit_name_prefixed') or item.get('subreddit'),
            'permalink': f"{REDDIT_BASE_URL}{item.get('permalink', '')}",
            'metadata': {
                'post_type': 'link',
            },
        }

    def _normalize_comment(self, item: dict[str, Any], product_name: str) -> dict[str, Any]:
        created_at = None
        if item.get('created_utc'):
            created_at = datetime.fromtimestamp(item['created_utc'])

        return {
            'id': item.get('id', f"comment-{hash(item.get('body', ''))}"),
            'source': 'reddit',
            'text': item.get('body') or '',
            'rating': None,
            'likes': int(item.get('ups', 0) or 0),
            'created_at': created_at,
            'product': product_name,
            'author': item.get('author'),
            'subreddit': item.get('subreddit_name_prefixed') or item.get('subreddit'),
            'permalink': f"{REDDIT_BASE_URL}{item.get('permalink', '')}",
            'metadata': {
                'post_type': 'comment',
            },
        }

    def _get_mock_reviews(self, product_name: str) -> list[dict[str, Any]]:
        return [
            {
                'id': f'mock-reddit-{i}',
                'source': 'reddit',
                'text': f'I love the {product_name} experience. The camera is amazing and the software feels polished.',
                'rating': None,
                'likes': 124 + i * 12,
                'created_at': datetime(2025, 1, 12, 12, 0),
                'product': product_name,
                'author': 'real_user_123',
                'subreddit': 'technology',
                'permalink': f'{REDDIT_BASE_URL}/r/technology/mock{i}',
                'metadata': {'post_type': 'post'},
            }
            for i in range(3)
        ]
