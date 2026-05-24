import hashlib
import asyncio
from typing import Any, Iterable


def hash_text(*parts: Any) -> str:
    text = '||'.join(str(part).strip().lower() for part in parts if part is not None)
    return hashlib.sha256(text.encode('utf-8')).hexdigest()


async def gather_safe(*aws: Iterable[Any], timeout: int = 15):
    return await asyncio.gather(*aws, return_exceptions=True)
