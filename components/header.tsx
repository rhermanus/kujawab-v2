import Link from "next/link";
import { auth, signOut } from "@/auth";
import { getUnreadCount } from "@/lib/notifications";
import NotificationBell from "@/components/notification-bell";
import ProfilePic from "@/components/profile-pic";
import { House, LogOut } from 'lucide-react';

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
        <nav className="flex items-center gap-3 sm:gap-6 text-sm ml-auto shrink-0">
          <Link
            href="/"
            className="text-white/80 hover:text-white"
            title="Beranda"
          >
            <House size={18} className="inline-block sm:mr-1" />
            <span className="hidden sm:inline">Beranda</span>
          </Link>
          {session?.user ? (
            <>
              <NotificationBell unreadCount={unreadCount} />
              <Link
                href={`/user/${session.user.username}`}
                className="flex items-center gap-2 text-white/90 hover:text-white"
                title={session.user.firstName ?? undefined}
              >
                <ProfilePic path={session.user.profilePicture} className="w-6 h-6" />
                <span className="hidden sm:inline">{session.user.firstName}</span>
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
                  title="Keluar"
                >
                  <LogOut size={18} className="sm:hidden" />
                  <span className="hidden sm:inline">Keluar</span>
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
