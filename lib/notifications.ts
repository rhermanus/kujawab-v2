import { prisma } from "./prisma";
import type { NotificationType } from "./generated/prisma/client";

export async function createNotification(
  type: NotificationType,
  senderId: number,
  receiverId: number,
  params?: Record<string, string | number>,
) {
  if (senderId === receiverId) return;

  await prisma.notification.create({
    data: {
      type,
      senderId,
      receiverId,
      sentTime: new Date(),
      params: params ?? undefined,
    },
  });
}

export async function getUnreadCount(userId: number) {
  return prisma.notification.count({
    where: { receiverId: userId, read: false },
  });
}

export async function getUserNotifications(userId: number, limit = 50) {
  const notifications = await prisma.notification.findMany({
    where: { receiverId: userId },
    orderBy: { sentTime: "desc" },
    take: limit,
    include: {
      sender: {
        select: {
          id: true,
          username: true,
          firstName: true,
          lastName: true,
          profilePicture: true,
        },
      },
    },
  });

  // Enrich legacy notifications that only have answer_id in params
  const legacyAnswerIds = notifications
    .map((n) => {
      const p = n.params as Record<string, unknown> | null;
      if (p && "answer_id" in p && !("problemSetCode" in p)) {
        return Number(p.answer_id);
      }
      return null;
    })
    .filter((id): id is number => id !== null);

  if (legacyAnswerIds.length > 0) {
    const uniqueIds = [...new Set(legacyAnswerIds)];
    const answers = await prisma.answer.findMany({
      where: { id: { in: uniqueIds } },
      select: {
        id: true,
        problem: {
          select: {
            number: true,
            problemSet: { select: { code: true, name: true } },
          },
        },
      },
    });
    const answerMap = new Map(answers.map((a) => [a.id, a]));

    for (const n of notifications) {
      const p = n.params as Record<string, unknown> | null;
      if (p && "answer_id" in p && !("problemSetCode" in p)) {
        const answer = answerMap.get(Number(p.answer_id));
        if (answer) {
          (n.params as Record<string, unknown>).problemSetCode = answer.problem.problemSet.code;
          (n.params as Record<string, unknown>).problemSetName = answer.problem.problemSet.name;
          (n.params as Record<string, unknown>).problemNumber = answer.problem.number;
        }
      }
    }
  }

  return notifications;
}

export async function markAsRead(notificationId: number, userId: number) {
  await prisma.notification.updateMany({
    where: { id: notificationId, receiverId: userId },
    data: { read: true },
  });
}

export async function markAllAsRead(userId: number) {
  await prisma.notification.updateMany({
    where: { receiverId: userId, read: false },
    data: { read: true },
  });
}
