import Link from "next/link";

interface Problem {
  number: number;
  text: string;
  choices: Record<string, string>;
  answerCount: number;
  extra_description?: string;
}

const dummyProblems: Problem[] = [
  {
    number: 1,
    text: "Manakah dari berikut ini yang merupakan struktur data linear?",
    choices: {
      a: "Binary Tree",
      b: "Graph",
      c: "Array",
      d: "Hash Map",
      e: "Heap",
    },
    answerCount: 3,
  },
  {
    number: 2,
    text: "Apa kompleksitas waktu rata-rata dari algoritma Quick Sort?",
    choices: {
      a: "O(n)",
      b: "O(n log n)",
      c: "O(n²)",
      d: "O(log n)",
      e: "O(2ⁿ)",
    },
    answerCount: 1,
  },
  {
    number: 3,
    text: "Algoritma pencarian berikut yang memerlukan data terurut adalah...",
    choices: {
      a: "Linear Search",
      b: "Binary Search",
      c: "Depth-First Search",
      d: "Breadth-First Search",
      e: "Interpolation Search tanpa syarat",
    },
    answerCount: 0,
  },
  {
    number: 4,
    extra_description:
      "Deskripsi untuk soal nomor 4 - 6\n\nSi Ani memiliki suasana hati yang dipengaruhi oleh cuaca. Berikut adalah aturannya:\n• Jika hari ini cerah dan kemarin hujan, Ani akan berseri-seri.\n• Jika hari ini cerah dan kemarin cerah, Ani akan biasa-biasa saja.\n• Jika hari ini hujan dan kemarin cerah, Ani akan pemurung.\n• Jika hari ini hujan dan kemarin hujan, Ani akan pemarah.\n• Jika terjadi badai, Ani akan apatis terlepas dari kondisi sebelumnya.",
    text: "Jika hari Senin cerah dan hari Minggu hujan, bagaimana suasana hati Ani pada hari Senin?",
    choices: {
      a: "Berseri-seri",
      b: "Biasa-biasa saja",
      c: "Pemurung",
      d: "Pemarah",
      e: "Apatis",
    },
    answerCount: 2,
  },
  {
    number: 5,
    text: "Jika hari Selasa dan Rabu keduanya hujan, bagaimana suasana hati Ani pada hari Rabu?",
    choices: {
      a: "Berseri-seri",
      b: "Biasa-biasa saja",
      c: "Pemurung",
      d: "Pemarah",
      e: "Apatis",
    },
    answerCount: 1,
  },
  {
    number: 6,
    text: "Jika terjadi badai pada hari Kamis, bagaimana suasana hati Ani?",
    choices: {
      a: "Berseri-seri",
      b: "Biasa-biasa saja",
      c: "Pemurung",
      d: "Pemarah",
      e: "Apatis",
    },
    answerCount: 0,
  },
];

export default async function ProblemSetPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6">
        <Link href="/" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
          ← Kembali ke Beranda
        </Link>
      </div>

      <h1 className="text-2xl font-bold mb-1">{code}</h1>
      <p className="text-zinc-600 dark:text-zinc-400 mb-8">
        Set soal dengan {dummyProblems.length} soal
      </p>

      <div className="space-y-8">
        {dummyProblems.map((problem) => (
          <div key={problem.number}>
            {problem.extra_description && (
              <div className="mb-4 rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30 p-5">
                <p className="whitespace-pre-line text-sm">{problem.extra_description}</p>
              </div>
            )}

            <div className="border rounded-lg p-6">
              <h2 className="font-semibold mb-3">
                Soal {problem.number}
              </h2>
              <p className="mb-4">{problem.text}</p>

              <div className="space-y-2 mb-4">
                {(Object.entries(problem.choices) as [string, string][]).map(([key, value]) => (
                  <div key={key} className="flex gap-3 text-sm">
                    <span className="font-medium text-zinc-600 dark:text-zinc-400 uppercase">{key}.</span>
                    <span>{value}</span>
                  </div>
                ))}
              </div>

              <Link
                href={`/${code}/${problem.number}`}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                Lihat {problem.answerCount} jawaban →
              </Link>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
