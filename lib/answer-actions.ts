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

  const answer = await prisma.answer.create({
    data: {
      problemId,
      authorId: Number(session.user.id),
      description: trimmed,
    },
  });

  revalidatePath(`/${problem.problemSet.code}/${problem.number}`);
  return { success: true, answerId: answer.id };
}

export async function updateAnswerAction(answerId: number, description: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Anda harus masuk terlebih dahulu." };
  }

  const trimmed = description.trim();
  if (trimmed.length < 10) {
    return { success: false, error: "Jawaban terlalu pendek (minimal 10 karakter)." };
  }

  const answer = await prisma.answer.findUnique({
    where: { id: answerId },
    select: {
      authorId: true,
      problem: {
        select: { number: true, problemSet: { select: { code: true } } },
      },
    },
  });

  if (!answer) return { success: false, error: "Jawaban tidak ditemukan." };
  if (answer.authorId !== Number(session.user.id)) {
    return { success: false, error: "Anda hanya bisa mengedit jawaban sendiri." };
  }

  await prisma.answer.update({
    where: { id: answerId },
    data: { description: trimmed },
  });

  if (answer.problem.problemSet.code) {
    revalidatePath(`/${answer.problem.problemSet.code}/${answer.problem.number}`);
  }
  return { success: true };
}

export async function deleteAnswerAction(answerId: number) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Anda harus masuk terlebih dahulu." };
  }

  const answer = await prisma.answer.findUnique({
    where: { id: answerId },
    select: {
      authorId: true,
      problem: {
        select: { number: true, problemSet: { select: { code: true } } },
      },
    },
  });

  if (!answer) return { success: false, error: "Jawaban tidak ditemukan." };
  if (answer.authorId !== Number(session.user.id)) {
    return { success: false, error: "Anda hanya bisa menghapus jawaban sendiri." };
  }

  // Delete related votes and comments first
  await prisma.$transaction([
    prisma.vote.deleteMany({ where: { answerId } }),
    prisma.comment.deleteMany({ where: { answerId } }),
    prisma.answer.delete({ where: { id: answerId } }),
  ]);

  if (answer.problem.problemSet.code) {
    revalidatePath(`/${answer.problem.problemSet.code}/${answer.problem.number}`);
  }
  return { success: true };
}
