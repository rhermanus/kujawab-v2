export default function Loading() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-8 animate-pulse">
      {/* Title */}
      <div className="h-8 bg-zinc-200 dark:bg-zinc-800 rounded w-64 mb-6" />
      <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-96 mb-8" />

      {/* Category sections */}
      {[1, 2, 3].map((i) => (
        <div key={i} className="mb-8">
          <div className="h-6 bg-zinc-200 dark:bg-zinc-800 rounded w-48 mb-4" />
          <div className="border rounded-lg divide-y">
            {[1, 2, 3].map((j) => (
              <div key={j} className="p-4 flex justify-between items-center">
                <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-60" />
                <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-20" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </main>
  );
}
