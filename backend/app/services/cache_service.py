from __future__ import annotations
from datetime import datetime, timedelta
from typing import Any


class CacheService:
    def __init__(self, ttl_seconds: int = 300):
        self.ttl_seconds = ttl_seconds
        self._cache: dict[str, dict[str, Any]] = {}

    def _make_key(self, input_type: str, value: str) -> str:
        return f'{input_type}:{value.strip().lower()}'

    def get(self, input_type: str, value: str) -> dict[str, Any] | None:
        key = self._make_key(input_type, value)
        entry = self._cache.get(key)
        if not entry:
            return None
        if entry['expires_at'] < datetime.utcnow():
            self._cache.pop(key, None)
            return None
        return entry['payload']

    def set(self, input_type: str, value: str, payload: dict[str, Any]) -> None:
        key = self._make_key(input_type, value)
        self._cache[key] = {
            'payload': payload,
            'expires_at': datetime.utcnow() + timedelta(seconds=self.ttl_seconds),
        }
