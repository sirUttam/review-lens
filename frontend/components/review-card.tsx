'use client';

import { useState } from 'react';
import type { ReviewItem } from '@/lib/types';

interface ReviewCardProps {
  review: ReviewItem;
}

const sentimentStyles = {
  positive: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
  negative: 'bg-rose-500/10 text-rose-300 border-rose-500/20',
  neutral: 'bg-slate-500/10 text-slate-300 border-slate-500/20',
};

function sanitizeReviewText(text: string) {
  return text
    .replace(/https?:\/\/\S+/gi, '')
    .replace(/www\.\S+/gi, '')
    .replace(/[#>*_`~]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function ReviewCard({ review }: ReviewCardProps) {
  const [expanded, setExpanded] = useState(false);
  const rawText = review.text ?? '';
  const sanitizedText = sanitizeReviewText(rawText);
  const isLong = sanitizedText.length > 280;
  const previewText = !expanded && isLong
    ? `${sanitizedText.slice(0, 280).replace(/\s+\S*$/, '')}...`
    : sanitizedText;
  const textStyles = expanded
    ? {
        whiteSpace: 'pre-wrap' as const,
        wordBreak: 'break-word' as const,
        overflowWrap: 'anywhere' as const,
      }
    : {
        display: '-webkit-box' as const,
        WebkitLineClamp: 6 as const,
        WebkitBoxOrient: 'vertical' as const,
        overflow: 'hidden' as const,
        wordBreak: 'break-word' as const,
        overflowWrap: 'anywhere' as const,
      };

  const createdAt = review.created_at
    ? new Date(review.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    : '';

  return (
    <article className={`group overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 p-6 transition duration-300 hover:-translate-y-0.5 hover:border-cyan-400/30 hover:bg-slate-900/95 min-w-0 ${sentimentStyles[review.sentiment]}`}>
      <div className="mb-4 flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.18em] text-slate-500">
        <span className="rounded-full border border-slate-800 bg-slate-900 px-2.5 py-1 text-slate-300">{review.author ?? 'reddit_user'}</span>
        <span className="text-slate-500">•</span>
        <span className="truncate max-w-[10rem]">{review.subreddit ?? 'r/reddit'}</span>
        {createdAt ? (
          <>
            <span className="text-slate-500">•</span>
            <span>{createdAt}</span>
          </>
        ) : null}
      </div>
      <div className="mb-4 flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.18em] text-slate-400">
        <span className="rounded-full border border-slate-700 bg-slate-900 px-2.5 py-1">{review.source}</span>
        <span className="rounded-full border border-slate-700 bg-slate-900 px-2.5 py-1">{review.sentiment}</span>
        <span className="rounded-full border border-slate-700 bg-slate-900 px-2.5 py-1">👍 {review.likes}</span>
      </div>
      <p className="text-slate-100 leading-7 break-words" style={textStyles}>
        {previewText}
      </p>
      {isLong ? (
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="mt-4 text-sm font-semibold text-cyan-300 transition hover:text-cyan-200"
        >
          {expanded ? 'Show less' : 'Read more'}
        </button>
      ) : null}
    </article>
  );
}
