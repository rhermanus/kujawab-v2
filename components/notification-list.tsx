"use client";

import Link from "next/link";
import { timeAgo } from "@/lib/format";
import ProfilePic from "@/components/profile-pic";
import { markAsReadAction, markAllAsReadAction } from "@/lib/notification-actions";

type NotificationItem = {
  id: number;
  type: string;
  sentTime: Date;
  read: boolean;
  params: Record<string, unknown> | null;
  sender: {
    id: number;
    username: string;
    firstName: string;
    lastName: string;
    profilePicture: string | null;
  };
};

const linkClass = "text-blue-600 dark:text-blue-400 hover:underline";

function UserLink({ n }: { n: NotificationItem }) {
  return (
    <Link href={`/user/${n.sender.username}`} className={linkClass}>
      {n.sender.firstName} {n.sender.lastName}
    </Link>
  );
}

function ProblemLink({ params }: { params: Record<string, unknown> | null }) {
  const code = params?.problemSetCode as string | undefined;
  const name = params?.problemSetName as string | undefined;
  const num = params?.problemNumber as number | undefined;
  if (!code || !name || !num) return null;
  return (
    <Link href={`/${code}/${num}`} className={linkClass}>
      {name}, nomor {num}
    </Link>
  );
}

function NotificationMessage({ n }: { n: NotificationItem }) {
  const problemLink = <ProblemLink params={n.params} />;

  switch (n.type) {
    case "ANSWER_UPVOTED":
      return problemLink
        ? <><UserLink n={n} /> menambahkan poin untuk jawaban kamu di {problemLink}</>
        : <><UserLink n={n} /> menambahkan poin untuk jawaban kamu</>;
    case "NEW_COMMENT":
      return problemLink
        ? <><UserLink n={n} /> mengomentari jawaban kamu di {problemLink}</>
        : <><UserLink n={n} /> mengomentari jawaban kamu</>;
    case "NEW_FOLLOWER":
      return <><UserLink n={n} /> kini mengikuti kamu</>;
    default:
      return <>Notifikasi dari <UserLink n={n} /></>;
  }
}

export default function NotificationList({
  notifications,
  hasUnread,
}: {
  notifications: NotificationItem[];
  hasUnread: boolean;
}) {
  return (
    <div>
      {hasUnread && (
        <div className="mb-4 flex justify-end">
          <form action={markAllAsReadAction}>
            <button
              type="submit"
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              Tandai semua sudah dibaca
            </button>
          </form>
        </div>
      )}

      {notifications.length === 0 ? (
        <p className="text-zinc-600 dark:text-zinc-400">Belum ada notifikasi.</p>
      ) : (
        <div className="border rounded-lg divide-y">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`flex items-start gap-3 p-4 ${
                !n.read ? "bg-blue-50 dark:bg-blue-950/30" : ""
              }`}
              onClick={() => {
                if (!n.read) markAsReadAction(n.id);
              }}
            >
              <Link href={`/user/${n.sender.username}`} className="shrink-0">
                <ProfilePic path={n.sender.profilePicture} className="w-10 h-10" />
              </Link>
              <div className="flex-1 min-w-0">
                <p className={`text-sm ${!n.read ? "font-semibold" : ""}`}>
                  <NotificationMessage n={n} />
                </p>
                <p className="text-xs text-zinc-500 mt-1">
                  {timeAgo(n.sentTime)}
                </p>
              </div>
              {!n.read && (
                <span className="mt-1.5 h-2 w-2 rounded-full bg-blue-500 shrink-0" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
