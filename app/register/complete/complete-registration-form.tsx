"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { completeGoogleRegistrationAction } from "@/lib/auth-actions";

export default function CompleteRegistrationForm() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (status === "loading") {
    return (
      <main className="mx-auto max-w-md px-4 py-12">
        <p className="text-sm text-zinc-500">Memuat...</p>
      </main>
    );
  }

  const pending = session?.pendingRegistration;

  if (!pending) {
    return (
      <main className="mx-auto max-w-md px-4 py-12">
        <div className="mb-4 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 text-sm text-red-700 dark:text-red-400">
          Sesi pendaftaran tidak ditemukan atau sudah kedaluwarsa.
        </div>
        <Link href="/signup" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
          &larr; Kembali ke halaman daftar
        </Link>
      </main>
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const result = await completeGoogleRegistrationAction(formData);

    if (result.success) {
      // Refresh session — jwt callback will find the new user and clear pendingRegistration
      await update();
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
        <Link href="/signup" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
          &larr; Kembali ke halaman daftar
        </Link>
      </div>

      <h1 className="text-2xl font-bold mb-2">Lengkapi Pendaftaran</h1>
      <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6">
        Akun Google terverifikasi. Lengkapi data berikut untuk menyelesaikan pendaftaran.
      </p>

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
          <Input id="email" type="email" value={pending.email} readOnly className="bg-zinc-100 dark:bg-zinc-800" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium mb-1">
              Nama Depan
            </label>
            <Input id="firstName" name="firstName" placeholder="Nama depan" required maxLength={50} defaultValue={pending.firstName} />
          </div>
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium mb-1">
              Nama Belakang
            </label>
            <Input id="lastName" name="lastName" placeholder="Nama belakang" maxLength={50} defaultValue={pending.lastName} />
          </div>
        </div>
        <div>
          <label htmlFor="username" className="block text-sm font-medium mb-1">
            Username
          </label>
          <Input id="username" name="username" placeholder="username" required maxLength={20} pattern="[a-zA-Z0-9_]+" title="Hanya huruf, angka, dan underscore" />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Memproses..." : "Selesaikan Pendaftaran"}
        </Button>
      </form>
    </main>
  );
}
