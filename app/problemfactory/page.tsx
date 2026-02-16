import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { getDraftProblemSets, isAdmin } from "@/lib/queries";
import CreateSetForm from "@/components/create-set-form";
import PublishButton from "@/components/publish-button";

export default async function ProblemFactoryPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = Number(session.user.id);
  const [sets, userIsAdmin] = await Promise.all([
    getDraftProblemSets(),
    isAdmin(userId),
  ]);

  const draftSets = sets.filter((s) => s.status === "DRAFT");
  const reviewSets = sets.filter((s) => s.status === "READY_FOR_REVIEW");

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6">
        <Link href="/" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
          ← Kembali ke Beranda
        </Link>
      </div>

      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Problem Factory</h1>
        <CreateSetForm />
      </div>

      {/* Draft sets */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold mb-4">Draft</h2>
        {draftSets.length === 0 ? (
          <p className="text-sm text-zinc-500">Belum ada set draft.</p>
        ) : (
          <SetTable sets={draftSets} />
        )}
      </section>

      {/* Ready for review sets */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Siap Review</h2>
        {reviewSets.length === 0 ? (
          <p className="text-sm text-zinc-500">Belum ada set yang siap review.</p>
        ) : (
          <SetTable sets={reviewSets} showPublish={userIsAdmin} />
        )}
      </section>
    </main>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "READY_FOR_REVIEW") {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
        Siap Review
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
      Draft
    </span>
  );
}

function SetTable({
  sets,
  showPublish = false,
}: {
  sets: Awaited<ReturnType<typeof getDraftProblemSets>>;
  showPublish?: boolean;
}) {
  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-zinc-50 dark:bg-zinc-900/40 border-b">
          <tr>
            <th className="text-left px-4 py-3 font-medium">Nama Set</th>
            <th className="text-center px-4 py-3 font-medium w-28">Target Soal</th>
            <th className="text-center px-4 py-3 font-medium w-28">Terisi</th>
            <th className="text-center px-4 py-3 font-medium w-32">Status</th>
            {showPublish && <th className="text-center px-4 py-3 font-medium w-28">Aksi</th>}
          </tr>
        </thead>
        <tbody className="divide-y">
          {sets.map((set) => (
            <tr key={set.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/20">
              <td className="px-4 py-3">
                <Link
                  href={`/problemfactory/${set.id}`}
                  className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                >
                  {set.name}
                </Link>
              </td>
              <td className="text-center px-4 py-3">{set.problemCount}</td>
              <td className="text-center px-4 py-3">{set._count.problems}</td>
              <td className="text-center px-4 py-3">
                <StatusBadge status={set.status} />
              </td>
              {showPublish && (
                <td className="text-center px-4 py-3">
                  <PublishButton id={set.id} />
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
