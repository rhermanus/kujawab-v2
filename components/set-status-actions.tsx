"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  markReadyForReviewAction,
  revertToDraftAction,
  publishProblemSetAction,
} from "@/lib/problemfactory-actions";
import { Loader2 } from "lucide-react";

export default function SetStatusActions({
  id,
  status,
  isAdmin,
  hasCode,
}: {
  id: number;
  status: string;
  isAdmin: boolean;
  hasCode: boolean;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleAction = async (action: (id: number) => Promise<{ success: boolean; error?: string }>) => {
    setSubmitting(true);
    setError(null);
    const result = await action(id);
    if (result.success) {
      router.refresh();
    } else {
      setError(result.error ?? "Gagal.");
    }
    setSubmitting(false);
  };

  const statusLabel = status === "DRAFT" ? "Draft" : status === "READY_FOR_REVIEW" ? "Siap Review" : "Diterbitkan";
  const statusColor =
    status === "DRAFT"
      ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
      : status === "READY_FOR_REVIEW"
      ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
      : "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400";

  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusColor}`}>
        {statusLabel}
      </span>

      {status === "DRAFT" && (
        <button
          onClick={() => handleAction(markReadyForReviewAction)}
          disabled={submitting}
          className="px-4 py-1.5 text-sm bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50 flex items-center gap-2"
        >
          {submitting && <Loader2 size={14} className="animate-spin" />}
          Tandai Siap Review
        </button>
      )}

      {status === "READY_FOR_REVIEW" && (
        <>
          <button
            onClick={() => handleAction(revertToDraftAction)}
            disabled={submitting}
            className="px-4 py-1.5 text-sm border rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 dark:border-zinc-700 disabled:opacity-50 flex items-center gap-2"
          >
            {submitting && <Loader2 size={14} className="animate-spin" />}
            Kembalikan ke Draft
          </button>
          {isAdmin && (
            <button
              onClick={() => handleAction(publishProblemSetAction)}
              disabled={submitting || !hasCode}
              title={!hasCode ? "Set harus punya kode" : "Terbitkan set"}
              className="px-4 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
            >
              {submitting && <Loader2 size={14} className="animate-spin" />}
              Terbitkan
            </button>
          )}
        </>
      )}

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
