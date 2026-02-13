export default function Loading() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-8 animate-pulse">
      <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-40 mb-6" />

      {/* Profile header */}
      <div className="flex items-start gap-5 mb-8">
        <div className="w-20 h-20 bg-zinc-200 dark:bg-zinc-800 rounded-full shrink-0" />
        <div className="flex-1">
          <div className="h-7 bg-zinc-200 dark:bg-zinc-800 rounded w-48 mb-2" />
          <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-28 mb-3" />
          <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-64 mb-3" />
          <div className="flex gap-4">
            <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-20" />
            <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-24" />
          </div>
        </div>
      </div>

      {/* Recent answers */}
      <div className="h-6 bg-zinc-200 dark:bg-zinc-800 rounded w-40 mb-4" />
      <div className="border rounded-lg divide-y">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-4">
            <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-56 mb-2" />
            <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-full mb-1" />
            <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-4/5 mb-2" />
            <div className="flex gap-3">
              <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-16" />
              <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-12" />
              <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-16" />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
