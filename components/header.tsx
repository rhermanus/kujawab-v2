import Link from "next/link";
import { auth, signOut } from "@/auth";

export default async function Header() {
  const session = await auth();

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
            Beranda
          </Link>
          {session?.user ? (
            <>
              <span className="text-white/90">{session.user.name}</span>
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
