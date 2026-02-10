import Link from "next/link";

const dummyUser = {
  firstName: "Aulia",
  lastName: "Rahma",
  username: "aulia",
  profilePicture: "/profpic_placeholder.jpg",
  bio: "Mahasiswa Informatika | Suka algoritma dan struktur data",
  location: "Jakarta, Indonesia",
  website: "https://aulia.dev",
};

const dummyStats = {
  points: 85,
  totalAnswers: 23,
  totalContributions: 5,
};

const dummyRecentAnswers = [
  { problem: "Soal Nomor 3", setCode: "ALGDASAR", setName: "Algoritma Dasar", time: "2 jam lalu" },
  { problem: "Soal Nomor 1", setCode: "MEKNIKA", setName: "Mekanika", time: "1 hari lalu" },
  { problem: "Soal Nomor 5", setCode: "ALJABAR1", setName: "Aljabar", time: "3 hari lalu" },
];

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6">
        <Link href="/" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
          ← Kembali ke Beranda
        </Link>
      </div>

      {/* Profile header */}
      <div className="flex items-start gap-5 mb-8">
        <img
          src={dummyUser.profilePicture}
          alt={`Foto profil ${dummyUser.username}`}
          className="w-20 h-20 rounded-full object-cover border"
        />
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold">
            {dummyUser.firstName} {dummyUser.lastName}
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">@{decodeURIComponent(username)}</p>
          {dummyUser.bio && (
            <p className="mt-2 text-sm">{dummyUser.bio}</p>
          )}
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            {dummyUser.location && <span>{dummyUser.location}</span>}
            {dummyUser.website && (
              <a
                href={dummyUser.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                {dummyUser.website.replace(/^https?:\/\//, "")}
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="border rounded-lg p-4 text-center">
          <div className="text-2xl font-bold">{dummyStats.points}</div>
          <div className="text-sm text-zinc-600 dark:text-zinc-400">Poin</div>
        </div>
        <div className="border rounded-lg p-4 text-center">
          <div className="text-2xl font-bold">{dummyStats.totalAnswers}</div>
          <div className="text-sm text-zinc-600 dark:text-zinc-400">Jawaban</div>
        </div>
        <div className="border rounded-lg p-4 text-center">
          <div className="text-2xl font-bold">{dummyStats.totalContributions}</div>
          <div className="text-sm text-zinc-600 dark:text-zinc-400">Kontribusi</div>
        </div>
      </div>

      <h2 className="text-lg font-semibold mb-4">Jawaban terbaru</h2>
      <div className="border rounded-lg divide-y">
        {dummyRecentAnswers.map((answer) => (
          <div key={`${answer.setCode}-${answer.problem}`} className="p-4">
            <div className="font-medium">
              {answer.problem} —{" "}
              <Link href={`/${answer.setCode}`} className="text-blue-600 dark:text-blue-400 hover:underline">
                {answer.setName}
              </Link>
            </div>
            <div className="text-sm text-zinc-600 dark:text-zinc-400">{answer.time}</div>
          </div>
        ))}
      </div>
    </main>
  );
}
