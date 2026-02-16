import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { getUserNotifications } from "@/lib/notifications";
import NotificationList from "@/components/notification-list";

export default async function NotificationsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = Number(session.user.id);
  const notifications = await getUserNotifications(userId);
  const hasUnread = notifications.some((n) => !n.read);

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6">
        <Link href="/" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
          &larr; Kembali ke Beranda
        </Link>
      </div>

      <h1 className="text-2xl font-bold mb-6">Notifikasi</h1>

      <NotificationList
        notifications={notifications.map((n) => ({
          ...n,
          params: n.params as Record<string, unknown> | null,
        }))}
        hasUnread={hasUnread}
      />
    </main>
  );
}
