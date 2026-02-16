import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { getUserByUsername, getUserStats, getUserRecentAnswers, getFollowerCount, getFollowingCount } from "@/lib/queries";
import { getFollowStatus } from "@/lib/follow-actions";
import { timeAgo, joinDate, profilePicUrl } from "@/lib/format";
import ExpandableAnswer from "@/components/expandable-answer";
import FollowButton from "@/components/follow-button";
import HtmlContent from "@/components/html-content";
import ImageLightbox from "@/components/image-lightbox";

function snippetFromHtml(html: string, maxLength = 150): { text: string; truncated: boolean } {
  const text = html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
  if (text.length <= maxLength) return { text, truncated: false };
  return { text: text.slice(0, maxLength) + "...", truncated: true };
}

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const user = await getUserByUsername(decodeURIComponent(username));

  if (!user) notFound();

  const session = await auth();
  const isOwnProfile = session?.user?.id === String(user.id);

  const currentUserId = session?.user?.id ? Number(session.user.id) : null;

  const [stats, recentAnswers, followerCount, followingCount, isFollowing] = await Promise.all([
    getUserStats(user.id),
    getUserRecentAnswers(user.id, 10),
    getFollowerCount(user.id),
    getFollowingCount(user.id),
    currentUserId && !isOwnProfile ? getFollowStatus(currentUserId, user.id) : Promise.resolve(false),
  ]);

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6">
        <Link href="/" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
          &larr; Kembali ke Beranda
        </Link>
      </div>

      {/* Profile header */}
      <div className="flex items-start gap-5 mb-8">
        <ImageLightbox
          src={profilePicUrl(user.profilePicture)}
          alt={`Foto profil ${user.username}`}
          className="w-20 h-20 rounded-full object-cover border"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">
              {user.firstName} {user.lastName}
            </h1>
            {isOwnProfile ? (
              <div className="flex gap-2">
                <Link
                  href={`/user/${user.username}/edit`}
                  className="rounded-md border px-3 py-1 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  Edit profil
                </Link>
                <Link
                  href="/change-password"
                  className="rounded-md border px-3 py-1 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  Ubah kata sandi
                </Link>
              </div>
            ) : currentUserId ? (
              <FollowButton targetUserId={user.id} initialFollowing={isFollowing} />
            ) : null}
          </div>
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
            <span>{joinDate(user.createdAt)}</span>
          </div>
          <div className="flex gap-4 mt-3 text-sm">
            <span><strong>{stats.points}</strong> Poin</span>
            <span><strong>{stats.totalAnswers}</strong> Jawaban</span>
            <span><strong>{followerCount}</strong> Pengikut</span>
            <span><strong>{followingCount}</strong> Mengikuti</span>
          </div>
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
                    href={`/${answer.problem.problemSet.code}/${answer.problem.number}`}
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {answer.problem.problemSet.name}, nomor {answer.problem.number}
                  </Link>
                </div>
                {snippetFromHtml(answer.description).truncated ? (
                  <ExpandableAnswer snippet={snippetFromHtml(answer.description).text} fullHtml={answer.description} />
                ) : (
                  <HtmlContent html={answer.description} className="text-sm mt-1" />
                )}
                <div className="flex gap-3 text-xs text-zinc-500 mt-1">
                  <span>{timeAgo(answer.createdAt)}</span>
                  <span>{answer.votes.reduce((sum, v) => sum + v.value, 0)} poin</span>
                  <span>{answer._count.comments} komentar</span>
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
