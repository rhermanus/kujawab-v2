import Link from "next/link";
import { auth, signOut } from "@/auth";
import { profilePicUrl } from "@/lib/format";
import { getUnreadCount } from "@/lib/notifications";
import NotificationBell from "@/components/notification-bell";
import { House } from 'lucide-react';

export default async function Header() {
  const session = await auth();
  const unreadCount = session?.user?.id
    ? await getUnreadCount(Number(session.user.id))
    : 0;

  return (
    <header className="sticky top-0 z-50 bg-[#0098A6] shadow-md">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center gap-4">
        <Link href="/" className="text-xl font-bold text-white hover:opacity-80 shrink-0">
          Kujawab
        </Link>
        <form action="/search" className="flex-1 max-w-md">
          <input
            type="text"
            name="q"
            placeholder="Cari soal..."
            className="w-full rounded-md px-3 py-1.5 text-sm bg-white/20 text-white placeholder-white/60 border border-white/30 focus:outline-none focus:bg-white/30 focus:border-white/50"
          />
        </form>
        <nav className="flex items-center gap-6 text-sm ml-auto">
          <Link
            href="/"
            className="text-white/80 hover:text-white"
          >
            <House size={18} className="inline-block mr-1" />
            Beranda
          </Link>
          {session?.user ? (
            <>
              <NotificationBell unreadCount={unreadCount} />
              <Link
                href={`/user/${session.user.username}`}
                className="flex items-center gap-2 text-white/90 hover:text-white"
              >
                <img
                  src={profilePicUrl(session.user.profilePicture)}
                  alt=""
                  className="w-6 h-6 rounded-full object-cover"
                />
                {session.user.firstName}
              </Link>
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/" });
                }}
              >
                <button
                  type="submit"
                  className="text-white/80 hover:text-white"
                >
                  Keluar
                </button>
              </form>
            </>
          ) : (
            <Link
              href="/login"
              className="text-white/80 hover:text-white"
            >
              Masuk
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
