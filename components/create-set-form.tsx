"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createProblemSetAction } from "@/lib/problemfactory-actions";
import { Loader2, Plus } from "lucide-react";

const CATEGORIES = [
  { value: "", label: "— Pilih Kategori —" },
  { value: "KOMPUTER", label: "Komputer" },
  { value: "MATEMATIKA", label: "Matematika" },
  { value: "FISIKA", label: "Fisika" },
  { value: "KIMIA", label: "Kimia" },
  { value: "BIOLOGI", label: "Biologi" },
  { value: "ASTRONOMI", label: "Astronomi" },
  { value: "KEBUMIAN", label: "Kebumian" },
  { value: "EKONOMI", label: "Ekonomi" },
  { value: "GEOGRAFI", label: "Geografi" },
];

export default function CreateSetForm() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [count, setCount] = useState("");
  const [category, setCategory] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const result = await createProblemSetAction(name, Number(count), category);
    if (result.success) {
      setName("");
      setCount("");
      setCategory("");
      setOpen(false);
      router.push(`/problemfactory/${result.id}`);
    } else {
      setError(result.error ?? "Gagal membuat set.");
    }
    setSubmitting(false);
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
      >
        <Plus size={16} />
        Buat Set Baru
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-3 flex-wrap">
      <div>
        <label className="block text-xs text-zinc-500 mb-1">Nama Set</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          maxLength={100}
          className="border rounded-lg px-3 py-2 text-sm bg-transparent dark:border-zinc-700 w-60"
          placeholder="e.g. OSN Matematika 2025"
          autoFocus
        />
      </div>
      <div>
        <label className="block text-xs text-zinc-500 mb-1">Kategori</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          required
          className="border rounded-lg px-3 py-2 text-sm bg-transparent dark:border-zinc-700"
        >
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs text-zinc-500 mb-1">Jumlah Soal</label>
        <input
          type="number"
          value={count}
          onChange={(e) => setCount(e.target.value)}
          required
          min={1}
          className="border rounded-lg px-3 py-2 text-sm bg-transparent dark:border-zinc-700 w-24"
          placeholder="40"
        />
      </div>
      <button
        type="submit"
        disabled={submitting}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm flex items-center gap-2"
      >
        {submitting && <Loader2 size={14} className="animate-spin" />}
        Buat
      </button>
      <button
        type="button"
        onClick={() => { setOpen(false); setError(null); }}
        className="px-4 py-2 rounded-lg border dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-sm"
      >
        Batal
      </button>
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
    </form>
  );
}
