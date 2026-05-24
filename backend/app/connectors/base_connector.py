from abc import ABC, abstractmethod
from typing import Any

class BaseConnector(ABC):
    @abstractmethod
    async def fetch_reviews(self, product_name: str) -> list[dict[str, Any]]:
        raise NotImplementedError()

    @abstractmethod
    def normalize(self, data: list[dict[str, Any]], product_name: str) -> list[dict[str, Any]]:
        raise NotImplementedError()
