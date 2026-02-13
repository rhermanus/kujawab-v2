"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createAnswerAction(problemId: number, description: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Anda harus masuk terlebih dahulu." };
  }

  const trimmed = description.trim();
  if (trimmed.length < 10) {
    return { success: false, error: "Jawaban terlalu pendek (minimal 10 karakter)." };
  }

  const problem = await prisma.problem.findUnique({
    where: { id: problemId },
    select: {
      id: true,
      number: true,
      problemSet: { select: { code: true } },
    },
  });

  if (!problem || !problem.problemSet.code) {
    return { success: false, error: "Soal tidak ditemukan." };
  }

  await prisma.answer.create({
    data: {
      problemId,
      authorId: Number(session.user.id),
      description: trimmed,
    },
  });

  revalidatePath(`/${problem.problemSet.code}/${problem.number}`);
  return { success: true };
}
