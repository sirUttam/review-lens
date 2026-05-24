from __future__ import annotations
from pydantic import BaseModel
from typing import List
from .review import Review

class ProductInsights(BaseModel):
    product: str
    total: int
    positive: int
    negative: int
    neutral: int
    topPositive: List[Review]
    topNegative: List[Review]
    summary: str
