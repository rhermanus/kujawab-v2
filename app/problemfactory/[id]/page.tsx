import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { getProblemSetById, isAdmin } from "@/lib/queries";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const ps = await getProblemSetById(Number(id));
  return { title: ps?.name ?? "Problem Set" };
}
import HtmlContent from "@/components/html-content";
import SetMetadataEditor from "@/components/set-metadata-editor";
import ExtraDescEditor from "@/components/extra-desc-editor";
import SetStatusActions from "@/components/set-status-actions";

export default async function SetEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id: idStr } = await params;
  const id = Number(idStr);
  if (isNaN(id)) notFound();

  const [problemSet, userIsAdmin] = await Promise.all([
    getProblemSetById(id),
    isAdmin(Number(session.user.id)),
  ]);

  if (!problemSet) notFound();
  if (problemSet.status === "PUBLISHED") redirect(`/${problemSet.code}`);

  // Build problem map for quick lookup
  const problemMap = new Map(
    problemSet.problems.map((p) => [p.number, p])
  );

  // Build extra description map: startNumber → extraDescription
  const extraDescMap = new Map(
    problemSet.extraDescriptions.map((ed) => [ed.startNumber, ed])
  );

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6">
        <Link href="/problemfactory" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
          ← Kembali ke Problem Factory
        </Link>
      </div>

      {/* Metadata editor */}
      <SetMetadataEditor
        id={problemSet.id}
        name={problemSet.name}
        code={problemSet.code}
        isAdmin={userIsAdmin}
      />

      {/* Status actions */}
      <div className="mb-8">
        <SetStatusActions
          id={problemSet.id}
          status={problemSet.status}
          isAdmin={userIsAdmin}
          hasCode={!!problemSet.code}
        />
      </div>

      {/* Extra description editor */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          Soal ({problemSet.problems.length}/{problemSet.problemCount})
        </h2>
        <ExtraDescEditor
          problemSetId={problemSet.id}
          problemCount={problemSet.problemCount}
          existingDescriptions={problemSet.extraDescriptions.map((ed) => ({
            id: ed.id,
            startNumber: ed.startNumber,
            endNumber: ed.endNumber,
            description: ed.description,
          }))}
        />
      </div>

      {/* Problem list — same layout as published page */}
      <div className="space-y-8">
        {Array.from({ length: problemSet.problemCount }, (_, i) => i + 1).map((num) => {
          const problem = problemMap.get(num);
          const extraDesc = extraDescMap.get(num);

          return (
            <div key={num}>
              {extraDesc && (
                <div className="mb-4 rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30 p-5">
                  <p className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-2">
                    Deskripsi Untuk Soal Nomor {extraDesc.startNumber} dan {extraDesc.endNumber}
                  </p>
                  <HtmlContent className="" html={extraDesc.description} />
                </div>
              )}

              <div className="border rounded-lg p-6">
                <div className="flex gap-2 mb-4">
                  <span className="font-semibold shrink-0">{num}.</span>
                  {problem ? (
                    <HtmlContent className="" html={problem.description} />
                  ) : (
                    <span className="text-zinc-400 italic">Belum ada soal</span>
                  )}
                </div>

                <Link
                  href={`/problemfactory/${problemSet.id}/${num}`}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {problem ? "Edit →" : "Tambah →"}
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
