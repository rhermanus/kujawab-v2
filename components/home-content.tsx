"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import ProfilePic from "@/components/profile-pic";
import { Plus } from 'lucide-react';

interface ProblemSetEntry {
  code: string;
  name: string;
  problems: number;
  answers: number;
}

interface Contributor {
  username: string;
  firstName: string;
  lastName: string;
  profilePicture: string | null;
  points: number;
}

interface RecentAnswer {
  id: number;
  problemNumber: number | null;
  problemSetCode: string | null;
  problemSetName: string;
  authorUsername: string;
  authorFirstName: string;
  authorLastName: string;
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
  const { data: session } = useSession();
  const subjects = Object.keys(problemSetsByCategory);
  const [open, setOpen] = useState<Record<string, boolean>>({});

  function toggle(subject: string) {
    setOpen((s) => ({ ...s, [subject]: !s[subject] }));
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Main content */}
      <section className="lg:col-span-2">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold mb-3">Kumpulan Soal dan Jawaban Olimpiade Sains</h2>
          <hr className="border-t border-zinc-200 dark:border-zinc-700 mb-3"/>
        </div>

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
        {session?.user && (
          <div className="mb-4">
            <Link
              href="/problemfactory"
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus size={16} className="inline-block mr-1" />
              Tambah Soal
            </Link>
          </div>
        )}
        <div className="border rounded-lg p-4 bg-zinc-50 dark:bg-zinc-900/40">
          <h3 className="font-semibold mb-3">Kontributor teraktif</h3>
          <ul className="space-y-3 text-sm">
            {topContributors.map((c) => (
              <li key={c.username}>
                <Link href={`/user/${c.username}`} className="flex items-center gap-3 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 -mx-2 px-2 py-1 rounded-md">
                  <ProfilePic path={c.profilePicture} alt={`${c.firstName} ${c.lastName}`} className="w-8 h-8" />
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-blue-600 dark:text-blue-400 truncate">
                      {c.firstName} {c.lastName}
                    </div>
                    <div className="text-xs text-zinc-500">{c.points} pts</div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="border rounded-lg p-4 bg-zinc-50 dark:bg-zinc-900/40">
          <h3 className="font-semibold mb-3">Jawaban terbaru</h3>
          <ul className="space-y-3 text-sm">
            {recentAnswers.map((r) => (
              <li key={r.id}>
                <div className="font-medium">
                  <Link href={`/${r.problemSetCode}/${r.problemNumber}`} className="text-blue-600 dark:text-blue-400 hover:underline">
                    {r.problemSetName}, nomor {r.problemNumber}
                  </Link>
                </div>
                <div className="text-zinc-600 dark:text-zinc-400 text-xs">
                  oleh{" "}
                  <Link href={`/user/${r.authorUsername}`} className="hover:underline">
                    {r.authorFirstName} {r.authorLastName}
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
