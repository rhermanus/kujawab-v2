"use client";

import { useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { requestPasswordResetAction } from "@/lib/password-actions";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await requestPasswordResetAction(email);
    if (result.success) {
      setSent(true);
    } else {
      setError(result.error || "Terjadi kesalahan.");
    }
    setLoading(false);
  }

  if (sent) {
    return (
      <main className="mx-auto max-w-md px-4 py-12">
        <h1 className="text-2xl font-bold mb-4">Cek Email Anda</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-6">
          Jika akun dengan email tersebut terdaftar, kami telah mengirim link untuk mereset kata sandi. Silakan cek inbox dan folder spam Anda.
        </p>
        <Link href="/login" className="text-blue-600 dark:text-blue-400 hover:underline text-sm">
          ← Kembali ke halaman masuk
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md px-4 py-12">
      <div className="mb-6">
        <Link href="/login" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
          ← Kembali ke halaman masuk
        </Link>
      </div>

      <h1 className="text-2xl font-bold mb-2">Lupa Kata Sandi</h1>
      <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6">
        Masukkan email Anda dan kami akan mengirim link untuk mereset kata sandi.
      </p>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1">Email</label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@contoh.com"
            required
          />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Mengirim..." : "Kirim Link Reset"}
        </Button>
      </form>
    </main>
  );
}
