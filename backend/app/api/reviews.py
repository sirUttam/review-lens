from __future__ import annotations
from fastapi import APIRouter, Body, HTTPException, Query
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Any, Literal
from urllib.parse import parse_qs, unquote, urlparse
import re

from ..services.aggregator import AggregatorService
from ..services.cache_service import CacheService
from ..services.summary_generator import SummaryGenerator

URL_PATTERN = re.compile(r'https?://\S+|www\.\S+', re.IGNORECASE)
MARKDOWN_PATTERN = re.compile(r'[#>*_`~\[\]\(\)]')

router = APIRouter()
cache = CacheService(ttl_seconds=300)


class ReviewRequest(BaseModel):
    type: Literal['text', 'url', 'image']
    value: str = Field(..., min_length=1)


def extract_product_name_from_url(value: str) -> str:
    try:
        parsed = urlparse(value)
        host = parsed.netloc.lower()
        path = parsed.path or ''
        query = parse_qs(parsed.query)

        def normalize(value: str) -> str:
            text = unquote(value).replace('-', ' ').replace('_', ' ').strip()
            return re.sub(r'\s+', ' ', text)

        if 'amazon.' in host:
            for key in ('k', 'q'):
                if key in query and query[key]:
                    return normalize(query[key][0])
            match = re.search(r'/dp/([^/]+)', path) or re.search(r'/gp/product/([^/]+)', path)
            if match:
                return normalize(match.group(1))
        if 'youtu' in host:
            if 'v' in query and query['v']:
                return normalize(query['v'][0])
            last = path.split('/')[-1]
            return normalize(last or 'YouTube review')
        if 'google.' in host:
            if 'q' in query and query['q']:
                return normalize(query['q'][0])
            if '/place/' in path:
                segments = [segment for segment in path.split('/') if segment]
                if len(segments) > 1:
                    return normalize(segments[-1])
        fallback = normalize(path.split('/')[-1])
        return fallback or value
    except Exception:
        return value


def sanitize_review_text(text: str) -> str:
    cleaned = URL_PATTERN.sub('', text or '')
    cleaned = MARKDOWN_PATTERN.sub('', cleaned)
    cleaned = re.sub(r'\s+', ' ', cleaned).strip()
    return cleaned


def summarize_review_text(text: str, max_length: int = 140) -> str:
    cleaned = sanitize_review_text(text)
    sentences = re.split(r'(?<=[.!?])\s+', cleaned)
    summary = sentences[0].strip() if sentences else cleaned
    if len(summary) > max_length:
        summary = summary[:max_length].rstrip()
        summary = re.sub(r'\s+\S*?$', '', summary)
        summary = f'{summary}...'
    return summary


def format_review(review: Any) -> dict[str, Any]:
    return {
        'id': review.id,
        'source': review.source,
        'text': summarize_review_text(review.text),
        'likes': review.likes,
        'sentiment': review.sentiment,
        'author': review.author or 'reddit_user',
        'subreddit': review.subreddit or 'r/reddit',
        'created_at': review.created_at.isoformat() if review.created_at else None,
        'permalink': review.permalink,
    }


@router.api_route('/reviews', methods=['GET', 'POST'])
async def get_reviews(
    product: str | None = Query(None, min_length=2, description='Product name to analyze'),
    payload: ReviewRequest | None = Body(None),
):
    if payload is None:
        if not product:
            raise HTTPException(status_code=422, detail='Product name or request body is required')
        payload = ReviewRequest(type='text', value=product)

    cached = cache.get(payload.type, payload.value)
    if cached:
        return JSONResponse(content=cached)

    if payload.type == 'image':
        response_payload = {
            'product': payload.value,
            'total_posts': 0,
            'positive_percent': 0,
            'negative_percent': 0,
            'neutral_percent': 0,
            'top_positive_reviews': [],
            'top_negative_reviews': [],
            'summary': 'Image recognition pending. Please search by product name or URL for instant Reddit insights.',
            'input_type': 'image',
            'extracted_value': '',
        }
        cache.set(payload.type, payload.value, response_payload)
        return JSONResponse(content=response_payload)

    if payload.type == 'url':
        extracted_value = extract_product_name_from_url(payload.value)
        query_value = extracted_value or payload.value
    else:
        extracted_value = ''
        query_value = payload.value.strip()

    if not query_value:
        raise HTTPException(status_code=422, detail='Unable to resolve a valid product name from input')

    aggregator = AggregatorService()
    summary_generator = SummaryGenerator()
    try:
        reviews = await aggregator.aggregate(query_value)
    except Exception as exc:
        raise HTTPException(status_code=502, detail='Unable to aggregate Reddit reviews') from exc

    total_posts = len(reviews)
    positive_count = sum(1 for review in reviews if review.sentiment == 'positive')
    negative_count = sum(1 for review in reviews if review.sentiment == 'negative')
    neutral_count = sum(1 for review in reviews if review.sentiment == 'neutral')

    positive_percent = round((positive_count / total_posts) * 100) if total_posts else 0
    negative_percent = round((negative_count / total_posts) * 100) if total_posts else 0
    neutral_percent = round((neutral_count / total_posts) * 100) if total_posts else 0

    top_positive_reviews = [format_review(review) for review in reviews if review.sentiment == 'positive'][:10]
    top_negative_reviews = [format_review(review) for review in reviews if review.sentiment == 'negative'][:10]
    summary = await summary_generator.generate(query_value, reviews)

    response_payload = {
        'product': query_value,
        'total_posts': total_posts,
        'positive_percent': positive_percent,
        'negative_percent': negative_percent,
        'neutral_percent': neutral_percent,
        'top_positive_reviews': top_positive_reviews,
        'top_negative_reviews': top_negative_reviews,
        'summary': summary,
        'input_type': payload.type,
        'extracted_value': extracted_value if payload.type == 'url' else '',
    }

    cache.set(payload.type, payload.value, response_payload)
    return JSONResponse(content=response_payload)
