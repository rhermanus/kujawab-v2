"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { publishProblemSetAction } from "@/lib/problemfactory-actions";
import { Loader2 } from "lucide-react";

export default function PublishButton({ id }: { id: number }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handlePublish = async () => {
    setSubmitting(true);
    setError(null);
    const result = await publishProblemSetAction(id);
    if (result.success) {
      router.refresh();
    } else {
      setError(result.error ?? "Gagal menerbitkan.");
    }
    setSubmitting(false);
  };

  return (
    <div>
      <button
        onClick={handlePublish}
        disabled={submitting}
        className="px-3 py-1 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-1 mx-auto"
      >
        {submitting && <Loader2 size={12} className="animate-spin" />}
        Terbitkan
      </button>
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}
