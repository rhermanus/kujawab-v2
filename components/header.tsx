import Link from "next/link";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-[#0098A6] shadow-md">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-white hover:opacity-80">
          Kujawab
        </Link>
        <nav className="flex items-center gap-6 text-sm">
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
