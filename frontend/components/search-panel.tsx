'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import { ReviewCard } from './review-card';
import type { ProductInsights, ReviewItem } from '../lib/types';

const modes: Array<{ id: 'text' | 'url' | 'image'; label: string; disabled?: boolean }> = [
  { id: 'text', label: 'Text' },
  { id: 'url', label: 'URL' },
  { id: 'image', label: 'Image', disabled: true },
];

const modeLabelMap: Record<'text' | 'url' | 'image', string> = {
  text: 'Product',
  url: 'URL',
  image: 'Image placeholder',
};

const positiveMatcher = /positive|usability|quality|battery|smooth|stable|excellent|love|great|fast|polished/i;
const negativeMatcher = /negative|issue|problem|concern|pricing|bug|slow|poor|inconsistent|hate|frustrat/i;
const themeMatcher = /theme|themes|signal|signals|highlight|highlights|includes|focus|real user|sentiment|discussion/i;

function normalizeSummaryText(text: string) {
  return text.replace(/\s+/g, ' ').trim();
}

function sanitizeInsight(text: string) {
  const cleaned = text
    .replace(/https?:\/\/\S+/gi, '')
    .replace(/www\.\S+/gi, '')
    .replace(/[#>*_`~]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  const firstSentence = cleaned.split(/(?<=[.!?])\s+/)[0] ?? cleaned;
  return firstSentence.length > 120
    ? `${firstSentence.slice(0, 117).replace(/\s+\S*$/, '')}...`
    : firstSentence;
}

function parseSummary(text: string) {
  const cleaned = normalizeSummaryText(text);
  const sentences = cleaned
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

  const overall = sentences[0] ?? cleaned;
  const positives = sentences.filter((sentence) => positiveMatcher.test(sentence));
  const negatives = sentences.filter((sentence) => negativeMatcher.test(sentence));
  const themes = sentences.filter((sentence) => themeMatcher.test(sentence));

  return {
    overall,
    positives: positives.length ? positives : sentences.slice(1, 3),
    negatives: negatives.length ? negatives : sentences.slice(3, 5),
    themes: themes.length ? themes : sentences.slice(1, 4),
  };
}

function normalizeProductInsights(
  data: unknown,
  fallbackProduct: string,
  fallbackInputType: 'text' | 'url' | 'image',
): ProductInsights {
  const parsed = (data as Partial<ProductInsights>) || {};

  return {
    product: typeof parsed.product === 'string' ? parsed.product : fallbackProduct,
    total_posts: typeof parsed.total_posts === 'number' ? parsed.total_posts : 0,
    positive_percent: typeof parsed.positive_percent === 'number' ? parsed.positive_percent : 0,
    negative_percent: typeof parsed.negative_percent === 'number' ? parsed.negative_percent : 0,
    neutral_percent: typeof parsed.neutral_percent === 'number' ? parsed.neutral_percent : 0,
    top_positive_reviews: Array.isArray(parsed.top_positive_reviews)
      ? parsed.top_positive_reviews.filter(Boolean) as ReviewItem[]
      : [],
    top_negative_reviews: Array.isArray(parsed.top_negative_reviews)
      ? parsed.top_negative_reviews.filter(Boolean) as ReviewItem[]
      : [],
    summary: typeof parsed.summary === 'string' ? parsed.summary : '',
    input_type:
      parsed.input_type === 'url' || parsed.input_type === 'text' || parsed.input_type === 'image'
        ? parsed.input_type
        : fallbackInputType,
    extracted_value: typeof parsed.extracted_value === 'string' ? parsed.extracted_value : '',
  };
}

export function SearchPanel() {
  const [query, setQuery] = useState('');
  const [inputType, setInputType] = useState<'text' | 'url' | 'image'>('text');
  const [result, setResult] = useState<ProductInsights | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const rawApiBaseUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
  const apiBaseUrl =
    (rawApiBaseUrl && rawApiBaseUrl.length > 0
      ? rawApiBaseUrl
      : 'https://review-lens-api.onrender.com'
    ).replace(/\/+$|\/+(?=\?)/g, '');

  const safeResult = result
    ? {
        ...result,
        total_posts: result.total_posts ?? 0,
        positive_percent: result.positive_percent ?? 0,
        negative_percent: result.negative_percent ?? 0,
        neutral_percent: result.neutral_percent ?? 0,
        top_positive_reviews: result.top_positive_reviews ?? [],
        top_negative_reviews: result.top_negative_reviews ?? [],
        summary: result.summary ?? '',
        input_type: result.input_type ?? 'text',
        extracted_value: result.extracted_value ?? '',
      }
    : null;

  const parsedSummary = safeResult?.summary ? parseSummary(safeResult.summary) : null;

  const topPositiveReviews = safeResult?.top_positive_reviews ?? [];
  const topNegativeReviews = safeResult?.top_negative_reviews ?? [];

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch(`${apiBaseUrl}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: inputType,
          value: query.trim(),
        }),
      });

      if (!response.ok) throw new Error('Failed to fetch insights');

      const data = await response.json();
      setResult(normalizeProductInsights(data, query.trim(), inputType));
    } catch (err) {
      console.error(err);
      setError('Unable to fetch product reviews. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mx-auto w-full max-w-5xl min-w-0">
      <form
        onSubmit={handleSubmit}
        className="mb-10 flex flex-col gap-4 rounded-3xl border border-slate-800 bg-panel p-6"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.22em] text-slate-500">
              Search Reddit reviews
            </p>
            <p className="mt-1 text-sm text-slate-400">
              Enter product name, URL, or Reddit link.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {modes.map((mode) => (
              <button
                key={mode.id}
                type="button"
                disabled={mode.disabled}
                onClick={() => setInputType(mode.id)}
                className={`rounded-full border px-4 py-2 text-sm ${
                  inputType === mode.id
                    ? 'border-cyan-400 text-cyan-100'
                    : 'border-slate-700 text-slate-300'
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <input
            className="flex-1 rounded-2xl border border-slate-800 bg-slate-950 px-5 py-4 text-slate-100"
            placeholder="Search products..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />

          <button
            type="submit"
            disabled={loading}
            className="rounded-2xl bg-cyan-500 px-6 py-4 font-semibold text-black"
          >
            {loading ? 'Scanning...' : 'Analyze'}
          </button>
        </div>

        {error && <p className="text-rose-400 text-sm">{error}</p>}
      </form>

      {/* SAFE RENDERING (NO BUILD ERRORS EVER) */}
      {safeResult ? (
        <div className="space-y-8">
          <section className="rounded-3xl border border-slate-800 bg-panel p-6">
            <p className="text-cyan-300 text-sm uppercase">Product summary</p>

            <h2 className="mt-2 text-3xl font-semibold text-white">
              {safeResult.product ?? 'Unknown Product'}
            </h2>

            <p className="mt-4 text-slate-300">
              {parsedSummary?.overall ?? 'No summary available'}
            </p>
          </section>

          <section className="grid gap-4 sm:grid-cols-2">
            <div className="p-4 border rounded-2xl border-slate-800">
              <h3 className="text-emerald-300">Positive</h3>
              <ul className="mt-2 space-y-2 text-slate-300">
                {parsedSummary?.positives?.map((p, i) => (
                  <li key={i}>{p}</li>
                ))}
              </ul>
            </div>

            <div className="p-4 border rounded-2xl border-slate-800">
              <h3 className="text-rose-300">Negative</h3>
              <ul className="mt-2 space-y-2 text-slate-300">
                {parsedSummary?.negatives?.map((n, i) => (
                  <li key={i}>{n}</li>
                ))}
              </ul>
            </div>
          </section>
        </div>
      ) : (
        <div className="text-slate-400 p-6 border border-slate-800 rounded-2xl">
          Enter a product to analyze reviews
        </div>
      )}
    </section>
  );
}