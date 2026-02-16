"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { RecentAnswer } from "@/lib/queries";
import { timeAgo } from "@/lib/format";
import ExpandableAnswer from "./expandable-answer";
import HtmlContent from "./html-content";

function snippetFromHtml(html: string, maxLength = 150): { text: string; truncated: boolean } {
  const text = html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
  if (text.length <= maxLength) return { text, truncated: false };
  return { text: text.slice(0, maxLength) + "...", truncated: true };
}

function AnswerCard({ answer }: { answer: RecentAnswer }) {
  return (
    <div className="p-4">
      <div className="font-medium">
        <Link
          href={`/${answer.problem.problemSet.code}/${answer.problem.number}`}
          className="text-blue-600 dark:text-blue-400 hover:underline"
        >
          {answer.problem.problemSet.name}, nomor {answer.problem.number}
        </Link>
      </div>
      {snippetFromHtml(answer.description).truncated ? (
        <ExpandableAnswer snippet={snippetFromHtml(answer.description).text} fullHtml={answer.description} />
      ) : (
        <HtmlContent html={answer.description} className="text-sm mt-1" />
      )}
      <div className="flex gap-3 text-xs text-zinc-500 mt-1">
        <span>{timeAgo(answer.createdAt)}</span>
        <span>{answer.votes.reduce((sum: number, v: { value: number }) => sum + v.value, 0)} poin</span>
        <span>{answer._count.comments} komentar</span>
      </div>
    </div>
  );
}

export default function UserAnswers({
  initialAnswers,
  initialNextCursor,
  userId,
}: {
  initialAnswers: RecentAnswer[];
  initialNextCursor: number | null;
  userId: number;
}) {
  const [answers, setAnswers] = useState(initialAnswers);
  const [nextCursor, setNextCursor] = useState(initialNextCursor);
  const [loading, setLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(async () => {
    if (loading || nextCursor === null) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/users/${userId}/answers?cursor=${nextCursor}`);
      const data = await res.json();
      setAnswers((prev) => [...prev, ...data.answers]);
      setNextCursor(data.nextCursor);
    } finally {
      setLoading(false);
    }
  }, [loading, nextCursor, userId]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore]);

  if (answers.length === 0) {
    return <p className="text-zinc-600 dark:text-zinc-400">Belum ada jawaban.</p>;
  }

  return (
    <>
      <div className="border rounded-lg divide-y">
        {answers.map((answer) => (
          <AnswerCard key={answer.id} answer={answer} />
        ))}
      </div>
      {nextCursor !== null && (
        <div ref={sentinelRef} className="flex justify-center py-4">
          {loading && (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-600" />
          )}
        </div>
      )}
    </>
  );
}
