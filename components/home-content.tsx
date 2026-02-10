"use client";

import { useState } from "react";
import Link from "next/link";

interface ProblemSetEntry {
  code: string;
  name: string;
  problems: number;
  answers: number;
}

interface Contributor {
  username: string;
  points: number;
}

interface RecentAnswer {
  id: number;
  problemNumber: number | null;
  problemSetCode: string | null;
  problemSetName: string;
  authorUsername: string;
  timeAgo: string;
}

interface HomeContentProps {
  problemSetsByCategory: Record<string, ProblemSetEntry[]>;
  topContributors: Contributor[];
  recentAnswers: RecentAnswer[];
}

export default function HomeContent({
  problemSetsByCategory,
  topContributors,
  recentAnswers,
}: HomeContentProps) {
  const subjects = Object.keys(problemSetsByCategory);
  const [open, setOpen] = useState<Record<string, boolean>>({});

  function toggle(subject: string) {
    setOpen((s) => ({ ...s, [subject]: !s[subject] }));
  }

  return (
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
                      {(problemSetsByCategory[sub] || []).map((set) => (
                        <tr key={set.code} className="border-t">
                          <td className="py-3">
                            <Link href={`/${set.code}`} className="text-blue-600 dark:text-blue-400 hover:underline">
                              {set.name}
                            </Link>
                          </td>
                          <td className="py-3">{set.problems}</td>
                          <td className="py-3">{set.answers}</td>
                        </tr>
                      ))}
                      {(problemSetsByCategory[sub] || []).length === 0 && (
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
              <li key={c.username} className="flex items-center justify-between">
                <div>
                  <Link href={`/user/${c.username}`} className="font-medium text-blue-600 dark:text-blue-400 hover:underline">
                    {i + 1}. {c.username}
                  </Link>
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
              <li key={r.id}>
                <div className="font-medium">
                  Soal Nomor {r.problemNumber} —{" "}
                  {r.problemSetCode ? (
                    <Link href={`/${r.problemSetCode}`} className="text-blue-600 dark:text-blue-400 hover:underline">
                      {r.problemSetName}
                    </Link>
                  ) : (
                    r.problemSetName
                  )}
                </div>
                <div className="text-zinc-600 dark:text-zinc-400 text-xs">
                  oleh{" "}
                  <Link href={`/user/${r.authorUsername}`} className="hover:underline">
                    {r.authorUsername}
                  </Link>{" "}
                  · {r.timeAgo}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </main>
  );
}
