"use client";

import { useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);

  return (
    <main className="mx-auto max-w-md px-4 py-12">
      <div className="mb-6">
        <Link href="/" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
          ← Kembali ke Beranda
        </Link>
      </div>

      <h1 className="text-2xl font-bold mb-6">
        {isRegister ? "Daftar" : "Masuk"}
      </h1>

      {isRegister ? (
        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium mb-1">
                Nama Depan
              </label>
              <Input id="firstName" type="text" placeholder="Nama depan" />
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium mb-1">
                Nama Belakang
              </label>
              <Input id="lastName" type="text" placeholder="Nama belakang" />
            </div>
          </div>
          <div>
            <label htmlFor="username" className="block text-sm font-medium mb-1">
              Username
            </label>
            <Input id="username" type="text" placeholder="Username" />
          </div>
          <div>
            <label htmlFor="reg-email" className="block text-sm font-medium mb-1">
              Email
            </label>
            <Input id="reg-email" type="email" placeholder="email@contoh.com" />
          </div>
          <div>
            <label htmlFor="reg-password" className="block text-sm font-medium mb-1">
              Kata Sandi
            </label>
            <Input id="reg-password" type="password" placeholder="Minimal 8 karakter" />
          </div>
          <div>
            <label htmlFor="reg-confirm" className="block text-sm font-medium mb-1">
              Konfirmasi Kata Sandi
            </label>
            <Input id="reg-confirm" type="password" placeholder="Ulangi kata sandi" />
          </div>
          <Button type="submit" className="w-full">
            Daftar
          </Button>
          <p className="text-sm text-center text-zinc-600 dark:text-zinc-400">
            Sudah punya akun?{" "}
            <button
              type="button"
              onClick={() => setIsRegister(false)}
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              Masuk
            </button>
          </p>
        </form>
      ) : (
        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">
              Email
            </label>
            <Input id="email" type="email" placeholder="email@contoh.com" />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1">
              Kata Sandi
            </label>
            <Input id="password" type="password" placeholder="Kata sandi" />
          </div>
          <div className="flex items-center gap-2">
            <input id="remember" type="checkbox" className="rounded border-zinc-300" />
            <label htmlFor="remember" className="text-sm">
              Ingat saya
            </label>
          </div>
          <Button type="submit" className="w-full">
            Masuk
          </Button>
          <p className="text-sm text-center text-zinc-600 dark:text-zinc-400">
            Belum terdaftar?{" "}
            <button
              type="button"
              onClick={() => setIsRegister(true)}
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              Daftar
            </button>
          </p>
        </form>
      )}
    </main>
  );
}
