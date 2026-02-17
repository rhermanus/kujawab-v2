"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateProblemSetAction } from "@/lib/problemfactory-actions";
import { CATEGORY_LABELS } from "@/lib/format";
import { Loader2, Pencil, Check, X } from "lucide-react";

export default function SetMetadataEditor({
  id,
  name,
  code,
  category,
  isAdmin,
}: {
  id: number;
  name: string;
  code: string | null;
  category: string | null;
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [editingName, setEditingName] = useState(false);
  const [nameVal, setNameVal] = useState(name);
  const [codeVal, setCodeVal] = useState(code ?? "");
  const [categoryVal, setCategoryVal] = useState(category ?? "");
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const save = async (field: string, data: Record<string, string>) => {
    setSaving(field);
    setError(null);
    const result = await updateProblemSetAction(id, data);
    if (result.success) {
      if (field === "name") setEditingName(false);
      router.refresh();
    } else {
      setError(result.error ?? "Gagal menyimpan.");
    }
    setSaving(null);
  };

  return (
    <div className="mb-8">
      {/* Name */}
      <div className="mb-4">
        {editingName ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={nameVal}
              onChange={(e) => setNameVal(e.target.value)}
              className="text-2xl font-bold border-b-2 border-blue-500 bg-transparent outline-none flex-1"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") save("name", { name: nameVal });
                if (e.key === "Escape") { setEditingName(false); setNameVal(name); }
              }}
            />
            <button
              onClick={() => save("name", { name: nameVal })}
              disabled={saving === "name"}
              className="p-1 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded"
            >
              {saving === "name" ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
            </button>
            <button
              onClick={() => { setEditingName(false); setNameVal(name); }}
              className="p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded"
            >
              <X size={18} />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{name}</h1>
            <button
              onClick={() => setEditingName(true)}
              className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded"
            >
              <Pencil size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Admin-only: Code URL + Category */}
      {isAdmin && (
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Kode URL</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={codeVal}
                onChange={(e) => setCodeVal(e.target.value)}
                placeholder="e.g. OSN-MAT-2025"
                className="border rounded-lg px-3 py-1.5 text-sm bg-transparent dark:border-zinc-700 w-44"
              />
              <button
                onClick={() => save("code", { code: codeVal })}
                disabled={saving === "code"}
                className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1"
              >
                {saving === "code" && <Loader2 size={12} className="animate-spin" />}
                Simpan
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Kategori</label>
            <div className="flex items-center gap-2">
              <select
                value={categoryVal}
                onChange={(e) => setCategoryVal(e.target.value)}
                className="border rounded-lg px-3 py-1.5 text-sm bg-transparent dark:border-zinc-700"
              >
                <option value="">— Pilih kategori —</option>
                {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
              <button
                onClick={() => save("category", { category: categoryVal })}
                disabled={saving === "category"}
                className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1"
              >
                {saving === "category" && <Loader2 size={12} className="animate-spin" />}
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-600 dark:text-red-400 mt-2">{error}</p>}
    </div>
  );
}
