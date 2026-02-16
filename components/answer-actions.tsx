"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateAnswerAction, deleteAnswerAction } from "@/lib/answer-actions";
import RichEditor from "@/components/rich-editor";
import { Pencil, Trash2, Loader2 } from "lucide-react";

export default function AnswerActions({
  answerId,
  currentDescription,
}: {
  answerId: number;
  currentDescription: string;
}) {
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm("Hapus jawaban ini? Semua komentar dan vote juga akan dihapus.")) return;
    setDeleting(true);
    const result = await deleteAnswerAction(answerId);
    if (result.success) {
      router.refresh();
    } else {
      alert(result.error);
      setDeleting(false);
    }
  };

  if (editing) {
    return (
      <div className="mt-4 pt-4 border-t">
        <RichEditor
          initialContent={currentDescription}
          onSubmit={async (html) => {
            const result = await updateAnswerAction(answerId, html);
            if (result.success) {
              setEditing(false);
              router.refresh();
            }
            return result;
          }}
          submitLabel="Simpan"
          placeholder="Edit jawaban..."
          minHeight="15rem"
          minContentLength={10}
          onCancel={() => setEditing(false)}
        />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 mt-3 pt-3 border-t">
      <button
        onClick={() => setEditing(true)}
        className="flex items-center gap-1 px-2 py-1 text-xs text-zinc-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
      >
        <Pencil size={12} />
        Edit
      </button>
      <button
        onClick={handleDelete}
        disabled={deleting}
        className="flex items-center gap-1 px-2 py-1 text-xs text-zinc-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded disabled:opacity-50"
      >
        {deleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
        Hapus
      </button>
    </div>
  );
}
