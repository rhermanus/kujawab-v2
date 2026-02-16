"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

async function getAnswerPath(answerId: number) {
  const answer = await prisma.answer.findUnique({
    where: { id: answerId },
    select: { problem: { select: { number: true, problemSet: { select: { code: true } } } } },
  });
  if (!answer?.problem.problemSet.code) return null;
  return `/${answer.problem.problemSet.code}/${answer.problem.number}`;
}

export async function voteAction(answerId: number, value: 1 | -1) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Anda harus masuk terlebih dahulu." };
  }

  const voterId = Number(session.user.id);

  await prisma.vote.upsert({
    where: { answerId_voterId: { answerId, voterId } },
    update: { value },
    create: { answerId, voterId, value },
  });

  const path = await getAnswerPath(answerId);
  if (path) revalidatePath(path);
  return { success: true };
}

export async function clearVoteAction(answerId: number) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Anda harus masuk terlebih dahulu." };
  }

  const voterId = Number(session.user.id);

  await prisma.vote.deleteMany({
    where: { answerId, voterId },
  });

  const path = await getAnswerPath(answerId);
  if (path) revalidatePath(path);
  return { success: true };
}
