import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { getUserByUsername, getUserStats, getUserRecentAnswersPaginated, getFollowerCount, getFollowingCount } from "@/lib/queries";
import { profilePicUrl } from "@/lib/format";

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }): Promise<Metadata> {
  const { username } = await params;
  const user = await getUserByUsername(decodeURIComponent(username));
  if (!user) return { title: "Pengguna" };
  const title = `${user.firstName} ${user.lastName}`;
  const description = user.bio || `Profil ${title} di Kujawab`;
  const images = user.profilePicture ? [profilePicUrl(user.profilePicture)] : [];
  return {
    title,
    description,
    alternates: { canonical: `/user/${user.username}` },
    openGraph: { title, description, type: "profile", images },
  };
}
import { getFollowStatus } from "@/lib/follow-actions";
import { joinDate } from "@/lib/format";
import FollowButton from "@/components/follow-button";
import ProfilePic from "@/components/profile-pic";
import UserAnswers from "@/components/user-answers";

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

  const [stats, { answers: initialAnswers, nextCursor }, followerCount, followingCount, isFollowing] = await Promise.all([
    getUserStats(user.id),
    getUserRecentAnswersPaginated(user.id, 10),
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
        <ProfilePic path={user.profilePicture} alt={`Foto profil ${user.username}`} className="w-20 h-20" expandable />
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
      <UserAnswers initialAnswers={initialAnswers} initialNextCursor={nextCursor} userId={user.id} />
    </main>
  );
}
