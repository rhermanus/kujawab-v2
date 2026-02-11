"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { loginAction } from "@/lib/auth-actions";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const result = await loginAction(formData);

    if (result.success) {
      router.push("/");
      router.refresh();
    } else {
      setError(result.error || "Terjadi kesalahan.");
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-md px-4 py-12">
      <div className="mb-6">
        <Link href="/" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
          &larr; Kembali ke Beranda
        </Link>
      </div>

      <h1 className="text-2xl font-bold mb-6">Masuk</h1>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1">
            Email
          </label>
          <Input id="email" name="email" type="email" placeholder="email@contoh.com" required />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-1">
            Kata Sandi
          </label>
          <Input id="password" name="password" type="password" placeholder="Kata sandi" required />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Memproses..." : "Masuk"}
        </Button>
        <p className="text-sm text-center text-zinc-600 dark:text-zinc-400">
          Belum terdaftar?{" "}
          <span className="text-zinc-400 dark:text-zinc-600">
            Daftar (segera hadir)
          </span>
        </p>
      </form>
    </main>
  );
}
