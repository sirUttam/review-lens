export default function WhyUsPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-16 px-4 py-8 sm:px-6 lg:px-8">

      {/* HERO */}
      <section className="rounded-[32px] border border-slate-800 bg-slate-900 p-8 text-center text-slate-100 shadow-xl shadow-slate-950/30">
        <p className="text-sm uppercase tracking-[0.34em] text-cyan-300/80">
          Why ReviewLens exists
        </p>

        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-50 sm:text-5xl">
          Real opinions are scattered across the internet. We bring them into one clean view.
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-slate-400 sm:text-lg">
          ReviewLens surfaces honest Reddit product sentiment, removing the guesswork from review research and making it simple to understand what people really think.
        </p>
      </section>

      {/* PROBLEM GRID */}
      <section className="grid gap-6 md:grid-cols-2">
        {[
          {
            icon: '🔍',
            title: 'Scattered opinions',
            description: 'Reviews are scattered across Reddit, YouTube, forums, and websites.',
          },
          {
            icon: '⏳',
            title: 'Wasted time',
            description: 'Users waste time checking multiple platforms for the same information.',
          },
          {
            icon: '🎭',
            title: 'Fake signals',
            description: 'Fake and biased reviews create confusion and block confident decisions.',
          },
          {
            icon: '🤔',
            title: 'Unclear sentiment',
            description: 'It is hard to know what people actually think without a clear summary.',
          },
        ].map((item) => (
          <div
            key={item.title}
            className="group rounded-3xl border border-slate-800 bg-slate-950 p-6 transition duration-300 hover:-translate-y-1 hover:border-cyan-400/30 hover:bg-slate-900"
          >
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-lg">
              {item.icon}
            </div>

            <h2 className="text-xl font-semibold text-slate-100">
              {item.title}
            </h2>

            <p className="mt-3 text-slate-400 leading-7 break-words">
              {item.description}
            </p>
          </div>
        ))}
      </section>

      {/* HOW IT WORKS */}
      <section className="rounded-[32px] border border-slate-800 bg-slate-900 p-8 shadow-xl shadow-slate-950/20">

        <div className="mb-10 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-cyan-300/80">
              How it works
            </p>

            <h2 className="mt-4 text-3xl font-semibold text-slate-50 sm:text-4xl">
              Simplified review intelligence in three steps
            </h2>

            <p className="mt-4 text-slate-400 leading-7">
              ReviewLens turns Reddit discussions into structured sentiment insights.
            </p>
          </div>

          <div className="grid gap-4">
            {[
              {
                step: '01',
                title: 'Search Product',
                description: 'Enter product name or Reddit URL.',
              },
              {
                step: '02',
                title: 'Fetch Discussions',
                description: 'Collect relevant Reddit posts and comments.',
              },
              {
                step: '03',
                title: 'Generate Insights',
                description: 'Show sentiment breakdown and key themes.',
              },
            ].map((item) => (
              <div
                key={item.step}
                className="rounded-3xl border border-slate-800 bg-slate-950 p-6 transition duration-300 hover:-translate-y-1 hover:border-cyan-400/30 hover:bg-slate-900"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-sm font-semibold text-cyan-300">
                  {item.step}
                </div>

                <h3 className="text-lg font-semibold text-slate-100">
                  {item.title}
                </h3>

                <p className="mt-3 text-slate-400 leading-7 break-words">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* FLOW */}
        <div className="flex flex-col items-center justify-center gap-2 rounded-3xl border border-slate-800 bg-slate-950 p-5 text-center text-sm text-slate-400 sm:flex-row sm:text-base">
          <span>Search Product</span>
          <span className="text-cyan-300">↓</span>
          <span>Fetch Reddit</span>
          <span className="text-cyan-300">↓</span>
          <span>Generate Insights</span>
        </div>
      </section>

      {/* BENEFITS */}
      <section className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { title: 'Save Time', description: 'Skip manual review hunting.' },
          { title: 'Avoid Fake Reviews', description: 'Use real Reddit data.' },
          { title: 'Understand Sentiment', description: 'Clear positive vs negative signals.' },
          { title: 'Better Decisions', description: 'Make informed purchases.' },
        ].map((item) => (
          <div
            key={item.title}
            className="rounded-3xl border border-slate-800 bg-slate-950 p-6 transition hover:border-cyan-400/30 hover:bg-slate-900"
          >
            <h3 className="text-lg font-semibold text-slate-50">
              {item.title}
            </h3>

            <p className="mt-3 text-slate-400 leading-7 break-words">
              {item.description}
            </p>
          </div>
        ))}
      </section>

      {/* CTA */}
      <section className="text-center">
        <a
          href="/"
          className="inline-flex rounded-full bg-cyan-500 px-8 py-4 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
        >
          Analyze a Product
        </a>
      </section>

    </div>
  );
}