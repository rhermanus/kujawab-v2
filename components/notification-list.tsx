"use client";

import Link from "next/link";
import { profilePicUrl, timeAgo } from "@/lib/format";
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

function problemLabel(params: Record<string, unknown> | null) {
  const name = params?.problemSetName;
  const num = params?.problemNumber;
  if (name && num) return `${name}, nomor ${num}`;
  return null;
}

function notificationMessage(n: NotificationItem) {
  const name = `${n.sender.firstName} ${n.sender.lastName}`;
  const label = problemLabel(n.params);

  switch (n.type) {
    case "ANSWER_UPVOTED":
      return label
        ? `${name} menambahkan poin untuk jawaban kamu di ${label}`
        : `${name} menambahkan poin untuk jawaban kamu`;
    case "NEW_COMMENT":
      return label
        ? `${name} mengomentari jawaban kamu di ${label}`
        : `${name} mengomentari jawaban kamu`;
    case "NEW_FOLLOWER":
      return `${name} kini mengikuti kamu`;
    default:
      return `Notifikasi dari ${name}`;
  }
}

function notificationHref(n: NotificationItem) {
  const params = n.params as { problemSetCode?: string; problemNumber?: number } | null;

  switch (n.type) {
    case "ANSWER_UPVOTED":
    case "NEW_COMMENT":
      if (params?.problemSetCode && params?.problemNumber) {
        return `/${params.problemSetCode}/${params.problemNumber}`;
      }
      return null;
    case "NEW_FOLLOWER":
      return `/user/${n.sender.username}`;
    default:
      return null;
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
          {notifications.map((n) => {
            const href = notificationHref(n);
            const content = (
              <div
                className={`flex items-start gap-3 p-4 ${
                  !n.read ? "bg-blue-50 dark:bg-blue-950/30" : ""
                }`}
              >
                <img
                  src={profilePicUrl(n.sender.profilePicture)}
                  alt=""
                  className="w-10 h-10 rounded-full object-cover shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${!n.read ? "font-semibold" : ""}`}>
                    {notificationMessage(n)}
                  </p>
                  <p className="text-xs text-zinc-500 mt-1">
                    {timeAgo(n.sentTime)}
                  </p>
                </div>
                {!n.read && (
                  <span className="mt-1.5 h-2 w-2 rounded-full bg-blue-500 shrink-0" />
                )}
              </div>
            );

            if (href) {
              return (
                <Link
                  key={n.id}
                  href={href}
                  onClick={() => {
                    if (!n.read) markAsReadAction(n.id);
                  }}
                  className="block hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
                >
                  {content}
                </Link>
              );
            }

            return (
              <div key={n.id}>
                {content}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
