"use client";

import { useOptimistic, useTransition } from "react";
import { followAction, unfollowAction } from "@/lib/follow-actions";

export default function FollowButton({
  targetUserId,
  initialFollowing,
}: {
  targetUserId: number;
  initialFollowing: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [isFollowing, setOptimisticFollowing] = useOptimistic(initialFollowing);

  function handleClick() {
    startTransition(async () => {
      setOptimisticFollowing(!isFollowing);
      if (isFollowing) {
        await unfollowAction(targetUserId);
      } else {
        await followAction(targetUserId);
      }
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className={`rounded-md px-4 py-1 text-sm font-medium transition-colors ${
        isFollowing
          ? "border border-zinc-300 dark:border-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:border-red-300 hover:text-red-600"
          : "bg-[#0098A6] text-white hover:bg-[#007A86]"
      }`}
    >
      {isFollowing ? "Mengikuti" : "Ikuti"}
    </button>
  );
}
