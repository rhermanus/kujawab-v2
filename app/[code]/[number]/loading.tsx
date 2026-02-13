export default function Loading() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-8 animate-pulse">
      <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-40 mb-6" />
      <div className="h-8 bg-zinc-200 dark:bg-zinc-800 rounded w-80 mb-6" />

      {/* Problem card */}
      <div className="border rounded-lg p-6 mb-8">
        <div className="space-y-2">
          <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-full" />
          <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-5/6" />
          <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-2/3" />
        </div>
      </div>

      {/* Answers header */}
      <div className="h-6 bg-zinc-200 dark:bg-zinc-800 rounded w-32 mb-4" />

      {/* Answer cards */}
      <div className="space-y-6">
        {[1, 2].map((i) => (
          <div key={i} className="border rounded-lg p-6">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-10 h-10 bg-zinc-200 dark:bg-zinc-800 rounded-full shrink-0" />
              <div>
                <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-32 mb-1" />
                <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-20" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-full" />
              <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-4/5" />
              <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-3/5" />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
