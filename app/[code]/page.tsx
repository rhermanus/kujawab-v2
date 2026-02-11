import Link from "next/link";
import { notFound } from "next/navigation";
import { getProblemSetByCode } from "@/lib/queries";
import HtmlContent from "@/components/html-content";

export default async function ProblemSetPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const problemSet = await getProblemSetByCode(code);

  if (!problemSet) notFound();

  // Build a map of startNumber → extra description HTML
  const extraDescMap = new Map<number, string>();
  for (const ed of problemSet.extraDescriptions) {
    extraDescMap.set(ed.startNumber, ed.description);
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6">
        <Link href="/" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
          ← Kembali ke Beranda
        </Link>
      </div>

      <h1 className="text-2xl font-bold mb-8">{problemSet.name}</h1>

      <div className="space-y-8">
        {problemSet.problems.map((problem) => (
          <div key={problem.id}>
            {problem.number != null && extraDescMap.has(problem.number) && (
              <div className="mb-4 rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30 p-5">
                <HtmlContent
                  className="text-sm prose dark:prose-invert max-w-none"
                  html={extraDescMap.get(problem.number)!}
                />
              </div>
            )}

            <div className="border rounded-lg p-6">
              <div className="flex gap-2 mb-4">
                <span className="font-semibold shrink-0">{problem.number}.</span>
                <HtmlContent
                  className="prose dark:prose-invert max-w-none"
                  html={problem.description}
                />
              </div>

              <Link
                href={`/${code}/${problem.number}`}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                Lihat {problem._count.answers} jawaban →
              </Link>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
