from __future__ import annotations
from pydantic import BaseModel
from datetime import datetime
from typing import Literal

SentimentLabel = Literal['positive', 'negative', 'neutral']

class Review(BaseModel):
    id: str
    source: str
    text: str
    rating: float | None = None
    likes: int = 0
    sentiment: SentimentLabel = 'neutral'
    created_at: datetime | None = None
    product: str
    author: str | None = None
    subreddit: str | None = None
    permalink: str | None = None
    metadata: dict = {}
