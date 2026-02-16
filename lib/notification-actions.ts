"use server";

import { auth } from "@/auth";
import { markAsRead, markAllAsRead } from "@/lib/notifications";
import { revalidatePath } from "next/cache";

export async function markAsReadAction(notificationId: number) {
  const session = await auth();
  if (!session?.user?.id) return;

  await markAsRead(notificationId, Number(session.user.id));
  revalidatePath("/notifications");
}

export async function markAllAsReadAction() {
  const session = await auth();
  if (!session?.user?.id) return;

  await markAllAsRead(Number(session.user.id));
  revalidatePath("/notifications");
}
