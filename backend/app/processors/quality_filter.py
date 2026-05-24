from __future__ import annotations
import re
from typing import Iterable
from ..models.review import Review

STRONG_OPINION_WORDS = {
    'love', 'hate', 'amazing', 'terrible', 'best', 'worst', 'excellent', 'awful', 'disappointing',
    'fantastic', 'horrible', 'broken', 'unusable', 'worthless', 'perfect', 'flawless', 'awful',
}

MILD_OPINION_WORDS = {
    'good', 'bad', 'okay', 'ok', 'decent', 'fine', 'solid', 'smooth', 'slow', 'fast', 'cheap',
    'expensive', 'reliable', 'unreliable', 'clean', 'buggy', 'nice', 'hard', 'easy', 'better', 'worse',
    'average', 'loud', 'quiet', 'hot', 'cold', 'rich', 'sharp'
}

PRODUCT_SYNONYMS = {
    'product', 'device', 'phone', 'camera', 'headphone', 'headphones', 'speaker', 'watch',
    'tablet', 'laptop', 'computer', 'console', 'app', 'software', 'service', 'subscription',
    'charger', 'battery', 'screen', 'audio', 'mic', 'keyboard', 'mouse'
}

PRODUCT_PHRASES = [
    'this phone', 'this device', 'this laptop', 'this watch', 'this camera', 'this app', 'this software',
    'my phone', 'my device', 'my laptop', 'my watch', 'my camera', 'my app', 'my software',
    'the phone', 'the laptop', 'the device', 'the camera', 'the app', 'the software',
]

USAGE_CONTEXT_WORDS = {
    'use', 'using', 'used', 'buy', 'bought', 'purchase', 'purchased', 'experience', 'experience',
    'issue', 'problem', 'performance', 'battery', 'screen', 'camera', 'software', 'setup', 'charge',
    'charging', 'sound', 'audio', 'speed', 'update', 'lag', 'heat', 'firmware', 'connect', 'connection',
    'review', 'compare', 'comparison', 'value', 'quality', 'feature', 'features', 'support', 'price',
}

GENERIC_NOISE_PHRASES = [
    'click here', 'check out', 'subscribe', 'follow me', 'buy now', 'free shipping',
    'dm me', 'message me', 'join us', 'visit my', 'link in bio', 'located at', 'promo',
    'discount code', 'gift card', 'giveaway', 'sponsored', 'advertisement', 'ad:', 'ad ',
    'meme', 'joke', 'lol', 'haha', 'rofl', 'lmao', 'lmk', 'brb', 'imo', 'idk', 'tbh',
]

FILLER_WORDS = {
    'hi', 'hello', 'hey', 'yo', 'lol', 'okay', 'ok', 'yeah', 'sure', 'same', 'bro', 'dude', 'thanks',
    'thank you', 'thanks', 'nope', 'nah', 'yep', 'indeed', 'true', 'maybe', 'kinda', 'sorta', 'kind of',
}

GREETING_PATTERN = re.compile(
    r'^(hi|hello|hey|yo|what\s*\w* up|good (morning|afternoon|evening)|thanks?|thx|lol|ok|okay|yep|yeah|sure|nice)\b',
    re.IGNORECASE,
)
BOT_PATTERN = re.compile(r'(automoderator|moderator|bot|spam|rule|removed|deleted|report this|stickied)', re.IGNORECASE)
URL_PATTERN = re.compile(r'https?://\S+|www\.\S+', re.IGNORECASE)
MARKDOWN_PATTERN = re.compile(r'[#>*_`~\[\]\(\)]')
WORD_PATTERN = re.compile(r"\w+")


class ReviewQualityFilter:
    def filter(self, reviews: list[Review], product_name: str) -> list[Review]:
        filtered: list[Review] = []
        product_tokens = self._get_product_tokens(product_name)

        for review in reviews:
            text = self._clean_text(review.text or '')
            if not text:
                continue

            if self._is_noise(text):
                continue

            if not self._passes_product_relevance(text, product_tokens):
                continue

            if not self._passes_semantic_quality(text):
                continue

            score = self._opinion_strength(text, product_tokens)
            review.metadata['quality_score'] = score
            if score < 2:
                continue

            review.text = text
            filtered.append(review)

        return filtered

    def _clean_text(self, text: str) -> str:
        sanitized = text.replace('\n', ' ').replace('\r', ' ')
        sanitized = URL_PATTERN.sub('', sanitized)
        sanitized = MARKDOWN_PATTERN.sub('', sanitized)
        sanitized = re.sub(r'\s+', ' ', sanitized).strip()
        return sanitized

    def _get_product_tokens(self, product_name: str) -> set[str]:
        normalized = re.sub(r'[^a-z0-9 ]', ' ', product_name.lower())
        return {token for token in normalized.split() if len(token) > 2}

    def _passes_product_relevance(self, text: str, product_tokens: set[str]) -> bool:
        lower_text = text.lower()
        if self._contains_product_mention(lower_text, product_tokens):
            return True

        if any(phrase in lower_text for phrase in PRODUCT_PHRASES) and self._contains_usage_context(lower_text):
            return True

        return False

    def _passes_semantic_quality(self, text: str) -> bool:
        lower_text = text.lower()
        words = self._get_words(lower_text)

        if len(words) < 10 and not self._contains_strong_opinion(lower_text):
            return False

        if self._contains_filler(lower_text):
            return False

        if not self._contains_opinion(lower_text) and not self._contains_usage_context(lower_text):
            return False

        if lower_text.startswith(('this is', 'that is', 'there is', 'it is')) and len(words) < 12:
            return False

        return True

    def _opinion_strength(self, text: str, product_tokens: set[str]) -> int:
        lower_text = text.lower()
        score = 0

        if self._contains_strong_opinion(lower_text):
            score += 2
        elif self._contains_mild_opinion(lower_text):
            score += 1

        if self._contains_product_mention(lower_text, product_tokens):
            score += 1

        if self._contains_usage_context(lower_text):
            score += 1

        if self._contains_generic_noise(lower_text):
            score -= 2

        if self._contains_filler(lower_text):
            score -= 3

        words = self._get_words(lower_text)
        if len(words) < 8:
            score -= 2

        return score

    def _is_noise(self, text: str) -> bool:
        lower_text = text.lower().strip()
        if not lower_text:
            return True

        if BOT_PATTERN.search(lower_text):
            return True

        if GREETING_PATTERN.match(lower_text):
            return True

        if lower_text.startswith(('deleted', '[deleted]', 'removed', '[removed]')):
            return True

        if URL_PATTERN.search(lower_text) and len(self._get_words(lower_text)) < 10:
            return True

        if self._contains_generic_noise(lower_text):
            return True

        if len(self._get_words(lower_text)) < 4:
            return True

        return False

    def _get_words(self, text: str) -> list[str]:
        return WORD_PATTERN.findall(text.lower())

    def _contains_word(self, text: str, words: set[str]) -> bool:
        return any(re.search(rf"\b{re.escape(word)}\b", text) for word in words)

    def _contains_strong_opinion(self, text: str) -> bool:
        return self._contains_word(text, STRONG_OPINION_WORDS)

    def _contains_mild_opinion(self, text: str) -> bool:
        return self._contains_word(text, MILD_OPINION_WORDS)

    def _contains_opinion(self, text: str) -> bool:
        return self._contains_strong_opinion(text) or self._contains_mild_opinion(text)

    def _contains_product_mention(self, text: str, product_tokens: set[str]) -> bool:
        if self._contains_word(text, PRODUCT_SYNONYMS):
            return True
        if product_tokens and self._contains_word(text, product_tokens):
            return True
        return False

    def _contains_usage_context(self, text: str) -> bool:
        return self._contains_word(text, USAGE_CONTEXT_WORDS)

    def _contains_filler(self, text: str) -> bool:
        return any(re.search(rf"\b{re.escape(phrase)}\b", text) for phrase in FILLER_WORDS)

    def _contains_generic_noise(self, text: str) -> bool:
        return any(phrase in text.lower() for phrase in GENERIC_NOISE_PHRASES)
