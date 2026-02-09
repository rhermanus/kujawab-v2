"use client";

import { useState } from "react";

export default function Home() {
  const subjects = [
    "Komputer",
    "Matematika",
    "Fisika",
    "Kimia",
    "Biologi",
    "Astronomi",
    "Kebumian",
    "Ekonomi",
    "Geografi",
  ];

  const sampleProblemsets: Record<string, Array<{ name: string; problems: number; answers: number }>> = {
    Komputer: [
      { name: "Algoritma Dasar", problems: 12, answers: 34 },
      { name: "Struktur Data", problems: 8, answers: 19 },
    ],
    Matematika: [
      { name: "Aljabar", problems: 10, answers: 21 },
      { name: "Geometri", problems: 7, answers: 12 },
    ],
    Fisika: [
      { name: "Mekanika", problems: 9, answers: 15 },
      { name: "Optik", problems: 5, answers: 6 },
    ],
    Kimia: [
      { name: "Stoikiometri", problems: 6, answers: 8 },
      { name: "Kimia Organik", problems: 4, answers: 3 },
    ],
    Biologi: [
      { name: "Genetika", problems: 6, answers: 10 },
      { name: "Ekologi", problems: 5, answers: 7 },
    ],
    Astronomi: [
      { name: "Astronomi Dasar", problems: 6, answers: 9 },
    ],
    Kebumian: [
      { name: "Geologi", problems: 7, answers: 5 },
    ],
    Ekonomi: [
      { name: "Mikroekonomi", problems: 6, answers: 4 },
    ],
    Geografi: [
      { name: "Geografi Fisik", problems: 5, answers: 2 },
    ],
  };

  const topContributors = [
    { name: "Aulia", points: 152 },
    { name: "Budi", points: 137 },
    { name: "Citra", points: 128 },
  ];

  const recentAnswers = [
    { problem: "Soal Nomor 3", set: "Algoritma Dasar", user: "Dewi", time: "2 jam lalu" },
    { problem: "Soal Nomor 5", set: "Mekanika", user: "Eko", time: "4 jam lalu" },
    { problem: "Soal Nomor 1", set: "Aljabar", user: "Fajar", time: "8 jam lalu" },
    { problem: "Soal Nomor 7", set: "Stoikiometri", user: "Gilang", time: "1 hari lalu" },
    { problem: "Soal Nomor 2", set: "Genetika", user: "Hani", time: "2 hari lalu" },
  ];

  const [open, setOpen] = useState<Record<string, boolean>>({});

  function toggle(subject: string) {
    setOpen((s) => ({ ...s, [subject]: !s[subject] }));
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black text-zinc-900 dark:text-zinc-100">
      <header className="border-b border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto max-w-6xl px-4 py-6 flex items-center justify-between">
          <h1 className="text-xl font-bold">Kumpulan Soal dan Jawaban Olimpiade Sains</h1>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main content */}
        <section className="lg:col-span-2">
          <h2 className="text-2xl font-semibold mb-4">Daftar Mata Pelajaran</h2>

          <div className="space-y-4">
            {subjects.map((sub) => (
              <div key={sub} className="border rounded-lg overflow-hidden">
                <button
                  onClick={() => toggle(sub)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-zinc-50 dark:bg-zinc-900/40 hover:bg-zinc-100 dark:hover:bg-zinc-800/60"
                >
                  <span className="font-medium">{sub}</span>
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">{open[sub] ? "-" : "+"}</span>
                </button>

                {open[sub] && (
                  <div className="p-4 bg-white dark:bg-zinc-900 border-t border-zinc-100 dark:border-zinc-800">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-zinc-600 dark:text-zinc-400">
                          <th className="pb-2">Set Soal</th>
                          <th className="pb-2">Jumlah Soal</th>
                          <th className="pb-2">Jumlah Jawaban</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(sampleProblemsets[sub] || []).map((set) => (
                          <tr key={set.name} className="border-t">
                            <td className="py-3">{set.name}</td>
                            <td className="py-3">{set.problems}</td>
                            <td className="py-3">{set.answers}</td>
                          </tr>
                        ))}
                        {(sampleProblemsets[sub] || []).length === 0 && (
                          <tr>
                            <td colSpan={3} className="py-3 text-zinc-600 dark:text-zinc-400">
                              Belum ada set soal untuk mata pelajaran ini.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Sidebar */}
        <aside className="space-y-6">
          <div className="border rounded-lg p-4 bg-zinc-50 dark:bg-zinc-900/40">
            <h3 className="font-semibold mb-3">Kontributor teraktif</h3>
            <ol className="space-y-2 text-sm">
              {topContributors.map((c, i) => (
                <li key={c.name} className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{i + 1}. {c.name}</div>
                  </div>
                  <div className="text-zinc-600 dark:text-zinc-400">{c.points} pts</div>
                </li>
              ))}
            </ol>
          </div>

          <div className="border rounded-lg p-4 bg-zinc-50 dark:bg-zinc-900/40">
            <h3 className="font-semibold mb-3">Jawaban terbaru</h3>
            <ul className="space-y-3 text-sm">
              {recentAnswers.map((r) => (
                <li key={`${r.user}-${r.set}`} className="">
                  <div className="font-medium">{r.problem} — <span className="text-zinc-600 dark:text-zinc-400">{r.set}</span></div>
                  <div className="text-zinc-600 dark:text-zinc-400 text-xs">oleh {r.user} · {r.time}</div>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </main>

      <footer className="border-t border-zinc-200 dark:border-zinc-800 mt-12">
        <div className="mx-auto max-w-6xl px-4 py-6 text-sm text-zinc-600 dark:text-zinc-400">© 2026 Kujawab</div>
      </footer>
    </div>
  );
}
