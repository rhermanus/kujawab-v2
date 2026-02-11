import Link from "next/link";
import { notFound } from "next/navigation";
import { getUserByUsername, getUserStats, getUserRecentAnswers } from "@/lib/queries";
import { timeAgo } from "@/lib/format";

// TODO: Remove once images are imported locally
const PROD_ORIGIN = "https://www.kujawab.com";
function profilePicUrl(path: string | null): string {
  const p = path ?? "/profpic_placeholder.jpg";
  return p.startsWith("/") ? `${PROD_ORIGIN}${p}` : p;
}

function snippetFromHtml(html: string, maxLength = 150): string {
  const text = html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const user = await getUserByUsername(decodeURIComponent(username));

  if (!user) notFound();

  const [stats, recentAnswers] = await Promise.all([
    getUserStats(user.id),
    getUserRecentAnswers(user.id, 10),
  ]);

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6">
        <Link href="/" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
          ← Kembali ke Beranda
        </Link>
      </div>

      {/* Profile header */}
      <div className="flex items-start gap-5 mb-8">
        <img
          src={profilePicUrl(user.profilePicture)}
          alt={`Foto profil ${user.username}`}
          className="w-20 h-20 rounded-full object-cover border"
        />
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold">
            {user.firstName} {user.lastName}
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">@{user.username}</p>
          {user.bio && (
            <p className="mt-2 text-sm">{user.bio}</p>
          )}
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            {user.location && <span>{user.location}</span>}
            {user.website && (
              <a
                href={user.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                {user.website.replace(/^https?:\/\//, "")}
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="border rounded-lg p-4 text-center">
          <div className="text-2xl font-bold">{stats.points}</div>
          <div className="text-sm text-zinc-600 dark:text-zinc-400">Poin</div>
        </div>
        <div className="border rounded-lg p-4 text-center">
          <div className="text-2xl font-bold">{stats.totalAnswers}</div>
          <div className="text-sm text-zinc-600 dark:text-zinc-400">Jawaban</div>
        </div>
        <div className="border rounded-lg p-4 text-center">
          <div className="text-2xl font-bold">{stats.totalContributions}</div>
          <div className="text-sm text-zinc-600 dark:text-zinc-400">Kontribusi</div>
        </div>
      </div>

      <h2 className="text-lg font-semibold mb-4">Jawaban terbaru</h2>
      {recentAnswers.length > 0 ? (
        <div className="border rounded-lg divide-y">
          {recentAnswers.map((answer) => {
            const problemUrl = answer.problem.problemSet.code && answer.problem.number
              ? `/${answer.problem.problemSet.code}/${answer.problem.number}`
              : null;

            return (
              <div key={answer.id} className="p-4">
                <div className="font-medium">
                  <Link
                    href={`/${answer.problem.problemSet.code}`}
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {answer.problem.problemSet.name}, nomor {answer.problem.number}
                  </Link>
                </div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                  {snippetFromHtml(answer.description)}{" "}
                  {problemUrl && (
                    <Link
                      href={problemUrl}
                      className="text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      lihat selengkapnya
                    </Link>
                  )}
                </p>
                <div className="text-xs text-zinc-500 mt-1">
                  {timeAgo(answer.createdAt)}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-zinc-600 dark:text-zinc-400">Belum ada jawaban.</p>
      )}
    </main>
  );
}
