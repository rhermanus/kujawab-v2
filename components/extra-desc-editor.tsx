"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  saveExtraDescriptionAction,
  deleteExtraDescriptionAction,
} from "@/lib/problemfactory-actions";
import { Loader2, Plus, Pencil, Trash2, X } from "lucide-react";
import RichEditor from "@/components/rich-editor";

interface ExtraDesc {
  id: number;
  startNumber: number;
  endNumber: number;
  description: string;
}

export default function ExtraDescEditor({
  problemSetId,
  problemCount,
  existingDescriptions,
}: {
  problemSetId: number;
  problemCount: number;
  existingDescriptions: ExtraDesc[];
}) {
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<ExtraDesc | null>(null);
  const [showList, setShowList] = useState(false);

  return (
    <div className="flex items-center gap-2">
      {existingDescriptions.length > 0 && (
        <button
          onClick={() => setShowList(!showList)}
          className="text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
        >
          {existingDescriptions.length} deskripsi tambahan
        </button>
      )}
      <button
        onClick={() => { setEditing(null); setShowModal(true); }}
        className="flex items-center gap-1 px-3 py-1.5 text-sm border rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 dark:border-zinc-700"
      >
        <Plus size={14} />
        Tambah deskripsi paket soal
      </button>

      {/* List of existing descriptions */}
      {showList && existingDescriptions.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowList(false)}>
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-5 max-w-lg w-full mx-4 border dark:border-zinc-700" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">Deskripsi Tambahan</h3>
              <button onClick={() => setShowList(false)} className="text-zinc-400 hover:text-zinc-600">
                <X size={16} />
              </button>
            </div>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {existingDescriptions.map((ed) => (
                <ExtraDescItem
                  key={ed.id}
                  desc={ed}
                  onEdit={() => { setEditing(ed); setShowList(false); setShowModal(true); }}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit modal */}
      {showModal && (
        <ExtraDescModal
          problemSetId={problemSetId}
          problemCount={problemCount}
          existing={editing}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}

function ExtraDescItem({
  desc,
  onEdit,
}: {
  desc: ExtraDesc;
  onEdit: () => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm("Hapus deskripsi tambahan ini?")) return;
    setDeleting(true);
    await deleteExtraDescriptionAction(desc.id);
    router.refresh();
  };

  return (
    <div className="flex items-start justify-between border rounded-lg p-3 dark:border-zinc-700">
      <div>
        <span className="text-sm font-medium">
          Soal {desc.startNumber}–{desc.endNumber}
        </span>
        <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{desc.description.replace(/<[^>]*>/g, "").slice(0, 100)}</p>
      </div>
      <div className="flex gap-1 shrink-0 ml-3">
        <button onClick={onEdit} className="p-1.5 text-zinc-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded">
          <Pencil size={14} />
        </button>
        <button onClick={handleDelete} disabled={deleting} className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded disabled:opacity-50">
          {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
        </button>
      </div>
    </div>
  );
}

function ExtraDescModal({
  problemSetId,
  problemCount,
  existing,
  onClose,
}: {
  problemSetId: number;
  problemCount: number;
  existing: ExtraDesc | null;
  onClose: () => void;
}) {
  const [startNumber, setStartNumber] = useState(existing?.startNumber?.toString() ?? "");
  const [endNumber, setEndNumber] = useState(existing?.endNumber?.toString() ?? "");
  const router = useRouter();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-5 max-w-2xl w-full mx-4 border dark:border-zinc-700 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold">{existing ? "Edit" : "Tambah"} Deskripsi Tambahan</h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600">
            <X size={16} />
          </button>
        </div>

        <div className="flex gap-4 mb-4">
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Dari Soal</label>
            <input
              type="number"
              value={startNumber}
              onChange={(e) => setStartNumber(e.target.value)}
              min={1}
              max={problemCount}
              className="border rounded-lg px-3 py-1.5 text-sm bg-transparent dark:border-zinc-700 w-24"
            />
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Sampai Soal</label>
            <input
              type="number"
              value={endNumber}
              onChange={(e) => setEndNumber(e.target.value)}
              min={1}
              max={problemCount}
              className="border rounded-lg px-3 py-1.5 text-sm bg-transparent dark:border-zinc-700 w-24"
            />
          </div>
        </div>

        <RichEditor
          initialContent={existing?.description}
          onSubmit={async (html) => {
            const result = await saveExtraDescriptionAction(
              problemSetId,
              Number(startNumber),
              Number(endNumber),
              html,
              existing?.id
            );
            if (result.success) {
              router.refresh();
              onClose();
            }
            return result;
          }}
          submitLabel={existing ? "Simpan" : "Tambah"}
          placeholder="Tulis deskripsi tambahan..."
          minHeight="10rem"
          minContentLength={10}
          onCancel={onClose}
        />
      </div>
    </div>
  );
}
