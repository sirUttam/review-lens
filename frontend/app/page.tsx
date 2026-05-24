import { SearchPanel } from '@/components/search-panel';

export default function HomePage() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-14 px-4 py-6 sm:px-0">
      <section className="space-y-6 text-center animate-fade-in-up">
        <p className="text-sm uppercase tracking-[0.32em] text-cyan-300/80">ReviewLens</p>
        <h1 className="mx-auto max-w-3xl text-4xl font-semibold tracking-tight text-slate-50 sm:text-5xl">
          Understand what Reddit conversations say about your product
        </h1>
        <p className="mx-auto max-w-2xl text-base leading-8 text-slate-400 sm:text-lg">
          Search Reddit posts and comments for sentiment, top reactions, and real user feedback — all in one clean view.
        </p>
      </section>

      <SearchPanel />
    </div>
  );
}
