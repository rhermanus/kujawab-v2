"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";
import { revalidatePath } from "next/cache";

export async function followAction(targetUserId: number) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Anda harus masuk terlebih dahulu." };
  }

  const currentUserId = Number(session.user.id);
  if (currentUserId === targetUserId) {
    return { success: false, error: "Anda tidak bisa mengikuti diri sendiri." };
  }

  await prisma.follow.upsert({
    where: {
      followerId_followingId: {
        followerId: currentUserId,
        followingId: targetUserId,
      },
    },
    update: {},
    create: {
      followerId: currentUserId,
      followingId: targetUserId,
    },
  });

  await createNotification("NEW_FOLLOWER", currentUserId, targetUserId);

  revalidatePath("/notifications");
  return { success: true };
}

export async function unfollowAction(targetUserId: number) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Anda harus masuk terlebih dahulu." };
  }

  const currentUserId = Number(session.user.id);

  await prisma.follow.deleteMany({
    where: {
      followerId: currentUserId,
      followingId: targetUserId,
    },
  });

  return { success: true };
}

export async function getFollowStatus(currentUserId: number, targetUserId: number) {
  const follow = await prisma.follow.findUnique({
    where: {
      followerId_followingId: {
        followerId: currentUserId,
        followingId: targetUserId,
      },
    },
  });
  return !!follow;
}
