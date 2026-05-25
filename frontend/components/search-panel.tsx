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
  const apiBaseUrl = (rawApiBaseUrl && rawApiBaseUrl.length > 0
    ? rawApiBaseUrl
    : 'https://review-lens-api.onrender.com').replace(/\/+$|\/+(?=\?)/g, '');

  const safeResult = result
    ? {
        ...result,
        total_posts: typeof result.total_posts === 'number' ? result.total_posts : 0,
        positive_percent: typeof result.positive_percent === 'number' ? result.positive_percent : 0,
        negative_percent: typeof result.negative_percent === 'number' ? result.negative_percent : 0,
        neutral_percent: typeof result.neutral_percent === 'number' ? result.neutral_percent : 0,
        top_positive_reviews: Array.isArray(result.top_positive_reviews) ? result.top_positive_reviews : [],
        top_negative_reviews: Array.isArray(result.top_negative_reviews) ? result.top_negative_reviews : [],
        summary: typeof result.summary === 'string' ? result.summary : '',
        input_type:
          result.input_type === 'url' || result.input_type === 'text' || result.input_type === 'image'
            ? result.input_type
            : 'text',
        extracted_value: typeof result.extracted_value === 'string' ? result.extracted_value : '',
      }
    : null;
  const parsedSummary = safeResult ? parseSummary(safeResult.summary) : null;
  const topPositiveReviews = safeResult?.top_positive_reviews ?? [];
  const topNegativeReviews = safeResult?.top_negative_reviews ?? [];

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!query.trim()) {
      return;
    }
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch(`${apiBaseUrl}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: inputType,
          value: query.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch insights');
      }

      const data = await response.json();
      setResult(normalizeProductInsights(data, query.trim(), inputType));
    } catch (err) {
      console.error('SearchPanel fetch error:', err);
      setError('Unable to fetch product reviews. Please try again with a valid product name or link.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mx-auto w-full max-w-5xl min-w-0">
      <form
        onSubmit={handleSubmit}
        className="mb-10 flex flex-col gap-4 rounded-3xl border border-slate-800 bg-panel p-6 shadow-xl shadow-slate-950/40"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.22em] text-slate-500">Search Reddit reviews</p>
            <p className="mt-1 text-sm text-slate-400">Enter a product name, URL, or paste a Reddit link to surface real discussion sentiment.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {modes.map((mode) => (
              <button
                key={mode.id}
                type="button"
                disabled={mode.disabled}
                onClick={() => setInputType(mode.id)}
                className={`rounded-full border px-4 py-2 text-sm transition ${
                  inputType === mode.id
                    ? 'border-cyan-400 bg-cyan-500/10 text-cyan-100'
                    : 'border-slate-700 text-slate-300 hover:border-slate-500 hover:text-slate-100'
                } ${mode.disabled ? 'cursor-not-allowed opacity-50' : ''}`}
              >
                {mode.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            className="min-w-0 flex-1 rounded-2xl border border-slate-800 bg-slate-950 px-5 py-5 text-slate-100 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
            placeholder="Search Reddit for iPhone 15, AirPods Pro, PlayStation 5..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-2xl bg-cyan-500 px-6 py-4 text-sm font-semibold text-slate-950 transition duration-200 hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Scanning reviews...' : 'Analyze'}
          </button>
        </div>
        {error ? <p className="text-sm text-rose-400">{error}</p> : null}
      </form>

      {loading ? (
        <div className="space-y-8 animate-fade-in-up">
          <section className="rounded-3xl border border-slate-800 bg-panel p-6 shadow-xl shadow-slate-950/20">
            <div className="space-y-4">
              <div className="h-4 w-1/3 rounded-full bg-slate-800" />
              <div className="h-5 w-2/3 rounded-full bg-slate-800" />
            </div>
            <div className="mt-6 grid gap-4 lg:grid-cols-[1.5fr_0.95fr]">
              <div className="space-y-4">
                <div className="h-24 rounded-3xl bg-slate-900" />
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="h-28 rounded-3xl bg-slate-900" />
                  <div className="h-28 rounded-3xl bg-slate-900" />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="h-28 rounded-3xl bg-slate-900" />
                  <div className="h-28 rounded-3xl bg-slate-900" />
                </div>
              </div>
              <div className="grid gap-4">
                <div className="h-24 rounded-3xl bg-slate-900" />
                <div className="h-24 rounded-3xl bg-slate-900" />
                <div className="h-24 rounded-3xl bg-slate-900" />
                <div className="h-24 rounded-3xl bg-slate-900" />
              </div>
            </div>
          </section>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-3xl border border-slate-800 bg-panel p-6 shadow-xl shadow-slate-950/10">
              <div className="h-5 w-1/2 rounded-full bg-slate-900" />
              <div className="mt-4 space-y-3">
                <div className="h-4 rounded-full bg-slate-900" />
                <div className="h-4 rounded-full bg-slate-900" />
                <div className="h-4 w-5/6 rounded-full bg-slate-900" />
              </div>
            </div>
            <div className="rounded-3xl border border-slate-800 bg-panel p-6 shadow-xl shadow-slate-950/10">
              <div className="h-5 w-1/2 rounded-full bg-slate-900" />
              <div className="mt-4 space-y-3">
                <div className="h-4 rounded-full bg-slate-900" />
                <div className="h-4 rounded-full bg-slate-900" />
                <div className="h-4 w-5/6 rounded-full bg-slate-900" />
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {result ? (
        <div className="space-y-8 animate-fade-in-up">
          <section className="rounded-3xl border border-slate-800 bg-panel p-6 shadow-xl shadow-slate-950/20">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="min-w-0">
                <p className="text-sm uppercase tracking-[0.18em] text-cyan-300">Product summary</p>
                <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-100 sm:text-4xl">
                  {safeResult.product}
                </h2>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1 text-xs uppercase tracking-[0.18em] text-slate-300">
                  {modeLabelMap[safeResult.input_type]}
                </span>
                {safeResult.input_type === 'url' && safeResult.extracted_value ? (
                  <span className="rounded-full border border-cyan-500 bg-cyan-500/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-cyan-200">
                    Extracted: {safeResult.extracted_value}
                  </span>
                ) : null}
              </div>
            </div>

            <div className="mt-8 grid gap-4 lg:grid-cols-[1.5fr_1fr]">
              <div className="rounded-3xl border border-slate-800 bg-slate-950 p-6">
                <p className="text-sm uppercase tracking-[0.18em] text-cyan-300">Overview</p>
                <p className="mt-4 max-w-full text-slate-300 leading-7">{parsedSummary?.overall}</p>
              </div>

              <div className="grid gap-4">
                <div className="rounded-3xl border border-slate-800 bg-slate-950 p-6">
                  <p className="text-sm uppercase tracking-[0.18em] text-emerald-300">Positive signals</p>
                  <ul className="mt-4 space-y-3 text-slate-300 list-inside list-disc">
                    {parsedSummary?.positives?.map((item, index) => (
                      <li key={index} className="max-w-full break-words overflow-hidden">
                        {item.replace(/[.]+$/, '')}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-3xl border border-slate-800 bg-slate-950 p-6">
                  <p className="text-sm uppercase tracking-[0.18em] text-rose-300">Negative signals</p>
                  <ul className="mt-4 space-y-3 text-slate-300 list-inside list-disc">
                    {parsedSummary?.negatives?.map((item, index) => (
                      <li key={index} className="max-w-full break-words overflow-hidden">
                        {item.replace(/[.]+$/, '')}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: 'Total Posts', value: safeResult.total_posts, tone: 'text-slate-100' },
              { label: 'Positive', value: `${safeResult.positive_percent}%`, tone: 'text-emerald-300' },
              { label: 'Negative', value: `${safeResult.negative_percent}%`, tone: 'text-rose-300' },
              { label: 'Neutral', value: `${safeResult.neutral_percent}%`, tone: 'text-slate-300' },
            ].map((stat) => (
              <div key={stat.label} className="rounded-3xl border border-slate-800 bg-slate-950 p-6">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">{stat.label}</p>
                <p className={`mt-3 text-3xl font-semibold ${stat.tone}`}>{stat.value}</p>
              </div>
            ))}
          </section>

          <section className="rounded-3xl border border-slate-800 bg-panel p-6 shadow-xl shadow-slate-950/20">
            <h3 className="text-xl font-semibold text-slate-100">Top Positive Insights</h3>
            <ul className="mt-5 space-y-3 text-slate-300 list-inside list-disc">
              {topPositiveReviews.slice(0, 10).map((review, index) => (
                <li key={review.id ?? index} className="max-w-full break-words leading-7">
                  {sanitizeInsight(review.text)}
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-3xl border border-slate-800 bg-panel p-6 shadow-xl shadow-slate-950/20">
            <h3 className="text-xl font-semibold text-slate-100">Top Negative Insights</h3>
            <ul className="mt-5 space-y-3 text-slate-300 list-inside list-disc">
              {topNegativeReviews.slice(0, 10).map((review, index) => (
                <li key={review.id ?? index} className="max-w-full break-words leading-7">
                  {sanitizeInsight(review.text)}
                </li>
              ))}
            </ul>
          </section>
        </div>
      ) : (
        <div className="rounded-3xl border border-slate-800 bg-panel p-8 text-slate-400">
          Enter a product name to generate sentiment insights from Reddit discussions and see how real conversations land.
        </div>
      )}
    </section>
  );
}
