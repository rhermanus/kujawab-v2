"use server";

import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { sendPasswordResetEmail } from "@/lib/email";

export async function requestPasswordResetAction(email: string) {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed) return { success: false, error: "Email harus diisi." };

  const user = await prisma.user.findUnique({ where: { email: trimmed } });

  // Always return success to prevent email enumeration
  if (!user || !user.password) {
    return { success: true };
  }

  // Generate token
  const token = randomBytes(32).toString("hex");

  // Delete old tokens for this email
  await prisma.passwordReminder.deleteMany({ where: { email: trimmed } });

  // Create new token
  await prisma.passwordReminder.create({
    data: { email: trimmed, token },
  });

  await sendPasswordResetEmail(trimmed, token);

  return { success: true };
}

export async function resetPasswordAction(token: string, password: string) {
  if (!token) return { success: false, error: "Token tidak valid." };
  if (password.length < 6) return { success: false, error: "Kata sandi minimal 6 karakter." };

  const reminder = await prisma.passwordReminder.findFirst({
    where: { token },
  });

  if (!reminder) return { success: false, error: "Token tidak valid atau sudah kedaluwarsa." };

  // Check if token is older than 1 hour
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  if (reminder.createdAt < oneHourAgo) {
    await prisma.passwordReminder.delete({ where: { id: reminder.id } });
    return { success: false, error: "Token sudah kedaluwarsa. Silakan minta reset ulang." };
  }

  const hash = await bcrypt.hash(password, 10);

  await prisma.$transaction([
    prisma.user.update({
      where: { email: reminder.email },
      data: { password: hash },
    }),
    prisma.passwordReminder.deleteMany({ where: { email: reminder.email } }),
  ]);

  return { success: true };
}

export async function changePasswordAction(currentPassword: string, newPassword: string) {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Anda harus masuk terlebih dahulu." };

  if (newPassword.length < 6) return { success: false, error: "Kata sandi baru minimal 6 karakter." };

  const user = await prisma.user.findUnique({
    where: { id: Number(session.user.id) },
    select: { password: true },
  });

  if (!user) return { success: false, error: "Pengguna tidak ditemukan." };

  if (!user.password) {
    // OAuth-only user setting password for the first time
    if (currentPassword) {
      return { success: false, error: "Akun ini menggunakan Google login dan belum memiliki kata sandi." };
    }
  } else {
    if (!currentPassword) return { success: false, error: "Kata sandi saat ini harus diisi." };
    const hash = user.password.replace(/^\$2y\$/, "$2b$");
    const valid = await bcrypt.compare(currentPassword, hash);
    if (!valid) return { success: false, error: "Kata sandi saat ini salah." };
  }

  const newHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: Number(session.user.id) },
    data: { password: newHash },
  });

  return { success: true };
}
