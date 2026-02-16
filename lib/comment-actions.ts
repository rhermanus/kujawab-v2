"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createCommentAction(answerId: number, content: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Anda harus masuk terlebih dahulu." };
  }

  const trimmed = content.trim();
  if (trimmed.length < 5) {
    return { success: false, error: "Komentar terlalu pendek (minimal 5 karakter)." };
  }

  const answer = await prisma.answer.findUnique({
    where: { id: answerId },
    select: {
      id: true,
      problem: {
        select: {
          number: true,
          problemSet: { select: { code: true } },
        },
      },
    },
  });

  if (!answer || !answer.problem.problemSet.code) {
    return { success: false, error: "Jawaban tidak ditemukan." };
  }

  const comment = await prisma.comment.create({
    data: {
      answerId,
      authorId: Number(session.user.id),
      content: trimmed,
    },
  });

  revalidatePath(`/${answer.problem.problemSet.code}/${answer.problem.number}`);
  return { success: true, commentId: comment.id };
}

export async function deleteCommentAction(commentId: number) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Anda harus masuk terlebih dahulu." };
  }

  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: {
      authorId: true,
      answer: {
        select: {
          problem: {
            select: { number: true, problemSet: { select: { code: true } } },
          },
        },
      },
    },
  });

  if (!comment) return { success: false, error: "Komentar tidak ditemukan." };
  if (comment.authorId !== Number(session.user.id)) {
    return { success: false, error: "Anda hanya bisa menghapus komentar sendiri." };
  }

  await prisma.comment.delete({ where: { id: commentId } });

  if (comment.answer.problem.problemSet.code) {
    revalidatePath(`/${comment.answer.problem.problemSet.code}/${comment.answer.problem.number}`);
  }
  return { success: true };
}
