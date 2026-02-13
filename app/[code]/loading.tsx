export default function Loading() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-8 animate-pulse">
      <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-40 mb-6" />
      <div className="h-8 bg-zinc-200 dark:bg-zinc-800 rounded w-72 mb-8" />

      <div className="space-y-8">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="border rounded-lg p-6">
            <div className="space-y-2 mb-4">
              <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-full" />
              <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-3/4" />
            </div>
            <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-32" />
          </div>
        ))}
      </div>
    </main>
  );
}
