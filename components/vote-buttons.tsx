"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { voteAction, clearVoteAction } from "@/lib/vote-actions";
import { ThumbsUp, ThumbsDown } from "lucide-react";

export default function VoteButtons({
  answerId,
  points,
  userVote,
  isLoggedIn,
}: {
  answerId: number;
  points: number;
  userVote: number; // 1, -1, or 0
  isLoggedIn: boolean;
}) {
  const [optimisticPoints, setOptimisticPoints] = useState(points);
  const [optimisticVote, setOptimisticVote] = useState(userVote);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleVote = async (value: 1 | -1) => {
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }
    if (loading) return;

    setLoading(true);

    if (optimisticVote === value) {
      // Clear vote
      setOptimisticPoints(optimisticPoints - value);
      setOptimisticVote(0);
      await clearVoteAction(answerId);
    } else {
      // Set vote (handles switching from opposite vote too)
      const diff = value - optimisticVote;
      setOptimisticPoints(optimisticPoints + diff);
      setOptimisticVote(value);
      await voteAction(answerId, value);
    }

    setLoading(false);
    router.refresh();
  };

  return (
    <div className="flex items-center gap-1 text-sm">
      <button
        onClick={() => handleVote(1)}
        disabled={loading}
        className={`p-0.5 rounded transition-colors ${
          optimisticVote === 1
            ? "text-green-600 dark:text-green-400"
            : "text-zinc-400 hover:text-green-600 dark:hover:text-green-400"
        } disabled:opacity-50`}
        title="Upvote"
      >
        <ThumbsUp size={16} strokeWidth={optimisticVote === 1 ? 2.5 : 2} />
      </button>
      <span className={`font-medium min-w-[1.5rem] text-center ${
        optimisticPoints > 0 ? "text-green-600 dark:text-green-400" :
        optimisticPoints < 0 ? "text-red-600 dark:text-red-400" : ""
      }`}>
        {optimisticPoints}
      </span>
      <button
        onClick={() => handleVote(-1)}
        disabled={loading}
        className={`p-0.5 rounded transition-colors ${
          optimisticVote === -1
            ? "text-red-600 dark:text-red-400"
            : "text-zinc-400 hover:text-red-600 dark:hover:text-red-400"
        } disabled:opacity-50`}
        title="Downvote"
      >
        <ThumbsDown size={16} strokeWidth={optimisticVote === -1 ? 2.5 : 2} />
      </button>
    </div>
  );
}
