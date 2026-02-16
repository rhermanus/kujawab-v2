"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { changePasswordAction } from "@/lib/password-actions";

export default function ChangePasswordPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  if (status === "loading") return null;
  if (!session?.user) {
    router.push("/login");
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (newPassword !== confirm) {
      setError("Konfirmasi kata sandi baru tidak cocok.");
      return;
    }

    setLoading(true);
    const result = await changePasswordAction(currentPassword, newPassword);
    if (result.success) {
      setSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirm("");
    } else {
      setError(result.error || "Terjadi kesalahan.");
    }
    setLoading(false);
  }

  return (
    <main className="mx-auto max-w-md px-4 py-12">
      <div className="mb-6">
        <Link
          href={`/user/${session.user.username}`}
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          ← Kembali ke profil
        </Link>
      </div>

      <h1 className="text-2xl font-bold mb-6">Ubah Kata Sandi</h1>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 rounded-md bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-3 text-sm text-green-700 dark:text-green-400">
          Kata sandi berhasil diubah.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="current" className="block text-sm font-medium mb-1">Kata Sandi Saat Ini</label>
          <Input
            id="current"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Kata sandi saat ini"
            required
          />
        </div>
        <div>
          <label htmlFor="new" className="block text-sm font-medium mb-1">Kata Sandi Baru</label>
          <Input
            id="new"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Minimal 6 karakter"
            required
            minLength={6}
          />
        </div>
        <div>
          <label htmlFor="confirm" className="block text-sm font-medium mb-1">Konfirmasi Kata Sandi Baru</label>
          <Input
            id="confirm"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Ulangi kata sandi baru"
            required
            minLength={6}
          />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Memproses..." : "Ubah Kata Sandi"}
        </Button>
      </form>
    </main>
  );
}
