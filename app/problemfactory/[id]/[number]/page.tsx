import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { getProblemSetById, getProblemBySetAndNumber } from "@/lib/queries";

export async function generateMetadata({ params }: { params: Promise<{ id: string; number: string }> }): Promise<Metadata> {
  const { id, number } = await params;
  const ps = await getProblemSetById(Number(id));
  return { title: ps ? `${ps.name}, No. ${number}` : "Soal" };
}
import ProblemEditor from "@/components/problem-editor";

export default async function ProblemEditorPage({
  params,
}: {
  params: Promise<{ id: string; number: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id: idStr, number: numStr } = await params;
  const id = Number(idStr);
  const number = Number(numStr);
  if (isNaN(id) || isNaN(number)) notFound();

  const problemSet = await getProblemSetById(id);
  if (!problemSet) notFound();
  if (problemSet.status === "PUBLISHED") redirect(`/${problemSet.code}`);
  if (number < 1 || number > problemSet.problemCount) notFound();

  const existing = await getProblemBySetAndNumber(id, number);

  const prevNum = number > 1 ? number - 1 : null;
  const nextNum = number < problemSet.problemCount ? number + 1 : null;

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6">
        <Link
          href={`/problemfactory/${id}`}
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          ← Kembali ke {problemSet.name}
        </Link>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">
          Soal {number} dari {problemSet.problemCount}
        </h1>
        <div className="flex gap-2">
          {prevNum && (
            <Link
              href={`/problemfactory/${id}/${prevNum}`}
              className="px-3 py-1.5 text-sm border rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 dark:border-zinc-700"
            >
              ← Soal {prevNum}
            </Link>
          )}
          {nextNum && (
            <Link
              href={`/problemfactory/${id}/${nextNum}`}
              className="px-3 py-1.5 text-sm border rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 dark:border-zinc-700"
            >
              Soal {nextNum} →
            </Link>
          )}
        </div>
      </div>

      <ProblemEditor
        problemSetId={id}
        number={number}
        initialContent={existing?.description}
      />
    </main>
  );
}
