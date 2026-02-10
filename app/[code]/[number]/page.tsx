import Link from "next/link";

const dummyProblem = {
  text: "Manakah dari berikut ini yang merupakan struktur data linear?",
  choices: {
    a: "Binary Tree",
    b: "Graph",
    c: "Array",
    d: "Hash Map",
    e: "Heap",
  },
};

const dummyAnswers = [
  {
    id: 1,
    user: "Aulia",
    points: 5,
    createdAt: "2 hari lalu",
    content:
      "Jawabannya adalah **C. Array**.\n\nArray adalah struktur data linear karena elemen-elemennya disimpan secara berurutan di memori. Setiap elemen dapat diakses melalui indeks yang berurutan.\n\nBinary Tree, Graph, dan Heap adalah struktur data non-linear karena elemen-elemennya tidak tersusun secara sekuensial.",
    comments: [
      { id: 1, user: "Budi", content: "Penjelasan yang sangat jelas, terima kasih!", createdAt: "1 hari lalu" },
      { id: 2, user: "Citra", content: "Linked list juga termasuk linear ya?", createdAt: "1 hari lalu" },
    ],
  },
  {
    id: 2,
    user: "Dewi",
    points: 2,
    createdAt: "1 hari lalu",
    content:
      "C. Array.\n\nStruktur data linear menyimpan data secara berurutan. Contoh lainnya: linked list, stack, queue. Sedangkan tree dan graph adalah non-linear.",
    comments: [],
  },
  {
    id: 3,
    user: "Eko",
    points: 0,
    createdAt: "5 jam lalu",
    content:
      "Jawaban: C. Array adalah struktur data linear.",
    comments: [
      { id: 3, user: "Fajar", content: "Bisa ditambahkan penjelasannya?", createdAt: "3 jam lalu" },
    ],
  },
];

export default async function ProblemPage({
  params,
}: {
  params: Promise<{ code: string; number: string }>;
}) {
  const { code, number } = await params;

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6">
        <Link href={`/${code}`} className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
          ← Kembali ke {code}
        </Link>
      </div>

      <h1 className="text-2xl font-bold mb-1">
        {code}, Nomor {number}
      </h1>
      <p className="text-zinc-600 dark:text-zinc-400 mb-6">
        {dummyAnswers.length} jawaban
      </p>

      {/* Problem */}
      <div className="border rounded-lg p-6 mb-8">
        <p className="mb-4">{dummyProblem.text}</p>
        <div className="space-y-2">
          {(Object.entries(dummyProblem.choices) as [string, string][]).map(([key, value]) => (
            <div key={key} className="flex gap-3 text-sm">
              <span className="font-medium text-zinc-600 dark:text-zinc-400 uppercase">{key}.</span>
              <span>{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Answers */}
      <h2 className="text-lg font-semibold mb-4">Jawaban</h2>
      <div className="space-y-6">
        {dummyAnswers.map((answer) => (
          <div key={answer.id} className="border rounded-lg">
            <div className="p-6">
              {/* Answer header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Link
                    href={`/user/${answer.user}`}
                    className="font-medium text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {answer.user}
                  </Link>
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">
                    {answer.createdAt}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <button className="text-zinc-400 hover:text-green-600">▲</button>
                  <span className="font-medium">{answer.points}</span>
                  <button className="text-zinc-400 hover:text-red-600">▼</button>
                </div>
              </div>

              {/* Answer content */}
              <div className="text-sm whitespace-pre-line">{answer.content}</div>
            </div>

            {/* Comments */}
            {answer.comments.length > 0 && (
              <div className="border-t bg-zinc-50 dark:bg-zinc-900/40 px-6 py-4 space-y-3">
                {answer.comments.map((comment) => (
                  <div key={comment.id} className="text-sm">
                    <span>
                      <Link
                        href={`/user/${comment.user}`}
                        className="font-medium text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        {comment.user}
                      </Link>
                      {" — "}
                      {comment.content}
                    </span>
                    <span className="text-xs text-zinc-500 ml-2">{comment.createdAt}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Write answer prompt */}
      <div className="mt-8 border rounded-lg p-6 text-center text-zinc-600 dark:text-zinc-400">
        <p>
          <Link href="/login" className="text-blue-600 dark:text-blue-400 hover:underline">
            Masuk
          </Link>{" "}
          untuk menulis jawaban
        </p>
      </div>
    </main>
  );
}
