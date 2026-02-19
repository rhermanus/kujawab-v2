"use server";

import { signIn, auth } from "@/auth";
import { AuthError } from "next-auth";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function loginAction(formData: FormData) {
  try {
    await signIn("credentials", {
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      redirect: false,
    });
    return { success: true };
  } catch (error) {
    if (error instanceof AuthError) {
      return { success: false, error: "Email atau kata sandi salah." };
    }
    throw error;
  }
}

export async function signupAction(formData: FormData) {
  const firstName = (formData.get("firstName") as string)?.trim();
  const lastName = (formData.get("lastName") as string)?.trim() ?? "";
  const username = (formData.get("username") as string)?.trim();
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;

  // Validation
  if (!firstName || firstName.length > 50) {
    return { success: false, error: "Nama depan wajib diisi (maks 50 karakter)." };
  }
  if (lastName.length > 50) {
    return { success: false, error: "Nama belakang maks 50 karakter." };
  }
  if (!username || username.length > 20 || !/^[a-zA-Z0-9_]+$/.test(username)) {
    return { success: false, error: "Username wajib diisi (maks 20 karakter, hanya huruf, angka, dan underscore)." };
  }
  if (!email || email.length > 100 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { success: false, error: "Email tidak valid." };
  }
  if (!password || password.length < 8) {
    return { success: false, error: "Kata sandi minimal 8 karakter." };
  }

  // Check uniqueness
  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }] },
    select: { email: true, username: true },
  });
  if (existing) {
    if (existing.email === email) {
      return { success: false, error: "Email sudah terdaftar." };
    }
    return { success: false, error: "Username sudah digunakan." };
  }

  // Create user
  const hashedPassword = await bcrypt.hash(password, 10);
  await prisma.user.create({
    data: {
      firstName,
      lastName,
      username,
      email,
      password: hashedPassword,
      confirmed: true,
    },
  });

  // Auto sign-in
  try {
    await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    return { success: true };
  } catch (error) {
    if (error instanceof AuthError) {
      return { success: false, error: "Akun berhasil dibuat, tetapi gagal masuk otomatis. Silakan masuk secara manual." };
    }
    throw error;
  }
}

export async function completeGoogleRegistrationAction(formData: FormData) {
  const session = await auth();
  const pending = session?.pendingRegistration;
  if (!pending) {
    return { success: false, error: "Sesi pendaftaran tidak ditemukan atau sudah kedaluwarsa." };
  }

  const firstName = (formData.get("firstName") as string)?.trim();
  const lastName = (formData.get("lastName") as string)?.trim() ?? "";
  const username = (formData.get("username") as string)?.trim();

  // Validation
  if (!firstName || firstName.length > 50) {
    return { success: false, error: "Nama depan wajib diisi (maks 50 karakter)." };
  }
  if (lastName.length > 50) {
    return { success: false, error: "Nama belakang maks 50 karakter." };
  }
  if (!username || username.length > 20 || !/^[a-zA-Z0-9_]+$/.test(username)) {
    return { success: false, error: "Username wajib diisi (maks 20 karakter, hanya huruf, angka, dan underscore)." };
  }

  // Check uniqueness
  const existing = await prisma.user.findFirst({
    where: { OR: [{ email: pending.email }, { username }] },
    select: { email: true, username: true },
  });
  if (existing) {
    if (existing.email === pending.email) {
      return { success: false, error: "Email sudah terdaftar." };
    }
    return { success: false, error: "Username sudah digunakan." };
  }

  // Create user with Google OAuth data
  await prisma.user.create({
    data: {
      firstName,
      lastName,
      username,
      email: pending.email,
      confirmed: true,
      oauth2Id: pending.oauth2Id,
      oauth2Provider: pending.oauth2Provider,
      profilePicture: pending.profilePicture,
    },
  });

  return { success: true };
}
