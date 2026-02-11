import Link from "next/link";
import { searchProblems } from "@/lib/queries";
import HtmlContent from "@/components/html-content";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";
  const results = query ? await searchProblems(query) : [];

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">
        {query ? `Hasil pencarian "${query}"` : "Pencarian"}
      </h1>

      {query && results.length === 0 && (
        <p className="text-zinc-600 dark:text-zinc-400">
          Tidak ada hasil untuk &quot;{query}&quot;.
        </p>
      )}

      <div className="space-y-6">
        {results.map((problem) => (
          <div key={problem.id} className="border rounded-lg p-6">
            <div className="mb-3">
              <Link
                href={`/${problem.problemSet.code}/${problem.number}`}
                className="font-semibold text-blue-600 dark:text-blue-400 hover:underline"
              >
                {problem.problemSet.name}, nomor {problem.number}
              </Link>
              <span className="text-sm text-zinc-500 ml-2">
                {problem._count.answers} jawaban
              </span>
            </div>
            <HtmlContent
              className=""
              html={problem.description}
            />
          </div>
        ))}
      </div>
    </main>
  );
}
