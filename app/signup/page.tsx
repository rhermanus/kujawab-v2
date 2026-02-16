"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { signupAction } from "@/lib/auth-actions";

export default function SignupPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    const formData = new FormData(e.currentTarget);
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (password !== confirmPassword) {
      setError("Kata sandi tidak cocok.");
      return;
    }
    if (password.length < 8) {
      setError("Kata sandi minimal 8 karakter.");
      return;
    }

    setLoading(true);
    const result = await signupAction(formData);

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

      <h1 className="text-2xl font-bold mb-6">Daftar</h1>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium mb-1">
              Nama Depan
            </label>
            <Input id="firstName" name="firstName" placeholder="Nama depan" required maxLength={50} />
          </div>
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium mb-1">
              Nama Belakang
            </label>
            <Input id="lastName" name="lastName" placeholder="Nama belakang" maxLength={50} />
          </div>
        </div>
        <div>
          <label htmlFor="username" className="block text-sm font-medium mb-1">
            Username
          </label>
          <Input id="username" name="username" placeholder="username" required maxLength={20} pattern="[a-zA-Z0-9_]+" title="Hanya huruf, angka, dan underscore" />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1">
            Email
          </label>
          <Input id="email" name="email" type="email" placeholder="email@contoh.com" required maxLength={100} />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-1">
            Kata Sandi
          </label>
          <Input id="password" name="password" type="password" placeholder="Minimal 8 karakter" required minLength={8} />
        </div>
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1">
            Konfirmasi Kata Sandi
          </label>
          <Input id="confirmPassword" name="confirmPassword" type="password" placeholder="Ulangi kata sandi" required minLength={8} />
        </div>
        <Button type="submit" className="w-full" disabled={loading || googleLoading}>
          {loading ? "Memproses..." : "Daftar"}
        </Button>
      </form>

      <div className="my-6 flex items-center gap-4">
        <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-700" />
        <span className="text-sm text-zinc-500">atau</span>
        <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-700" />
      </div>

      <Button
        variant="outline"
        className="w-full"
        disabled={loading || googleLoading}
        onClick={() => {
          setGoogleLoading(true);
          signIn("google", { callbackUrl: "/" });
        }}
      >
        {googleLoading ? "Memproses..." : "Daftar dengan Google"}
      </Button>

      <p className="mt-6 text-sm text-center text-zinc-600 dark:text-zinc-400">
        Sudah punya akun?{" "}
        <Link href="/login" className="text-blue-600 dark:text-blue-400 hover:underline">
          Masuk
        </Link>
      </p>
    </main>
  );
}
