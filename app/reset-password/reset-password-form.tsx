"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { resetPasswordAction } from "@/lib/password-actions";
import { Suspense } from "react";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  if (!token) {
    return (
      <main className="mx-auto max-w-md px-4 py-12">
        <h1 className="text-2xl font-bold mb-4">Token Tidak Valid</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-4">
          Link reset kata sandi tidak valid. Silakan minta link baru.
        </p>
        <Link href="/forgot-password" className="text-blue-600 dark:text-blue-400 hover:underline text-sm">
          Minta link reset baru
        </Link>
      </main>
    );
  }

  if (done) {
    return (
      <main className="mx-auto max-w-md px-4 py-12">
        <h1 className="text-2xl font-bold mb-4">Kata Sandi Berhasil Direset</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-6">
          Kata sandi Anda telah diperbarui. Silakan masuk dengan kata sandi baru.
        </p>
        <Link href="/login" className="text-blue-600 dark:text-blue-400 hover:underline text-sm">
          Masuk →
        </Link>
      </main>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirm) {
      setError("Konfirmasi kata sandi tidak cocok.");
      return;
    }

    setLoading(true);
    const result = await resetPasswordAction(token, password);
    if (result.success) {
      setDone(true);
    } else {
      setError(result.error || "Terjadi kesalahan.");
    }
    setLoading(false);
  }

  return (
    <main className="mx-auto max-w-md px-4 py-12">
      <h1 className="text-2xl font-bold mb-2">Reset Kata Sandi</h1>
      <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6">
        Masukkan kata sandi baru untuk akun Anda.
      </p>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-1">Kata Sandi Baru</label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Minimal 6 karakter"
            required
            minLength={6}
          />
        </div>
        <div>
          <label htmlFor="confirm" className="block text-sm font-medium mb-1">Konfirmasi Kata Sandi</label>
          <Input
            id="confirm"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Ulangi kata sandi"
            required
            minLength={6}
          />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Memproses..." : "Reset Kata Sandi"}
        </Button>
      </form>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
