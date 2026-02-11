import Link from "next/link";

export default function Header() {
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
          <Link
            href="/login"
            className="text-white/80 hover:text-white"
          >
            Masuk
          </Link>
        </nav>
      </div>
    </header>
  );
}
