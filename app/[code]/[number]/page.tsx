import Link from "next/link";
import { notFound } from "next/navigation";
import { getProblemByCodeAndNumber } from "@/lib/queries";
import { timeAgo, profilePicUrl } from "@/lib/format";
import HtmlContent from "@/components/html-content";
import AnswerEditor from "@/components/answer-editor";
import AnswerActions from "@/components/answer-actions";
import CommentSection from "@/components/comment-section";
import { auth } from "@/auth";

export default async function ProblemPage({
  params,
}: {
  params: Promise<{ code: string; number: string }>;
}) {
  const { code, number } = await params;
  const [result, session] = await Promise.all([
    getProblemByCodeAndNumber(code, parseInt(number)),
    auth(),
  ]);

  if (!result) notFound();

  const { problemSet, problems, extraDescription, answers } = result;

  const isClustered = problems.length > 1;
  const numberLabel = isClustered
    ? `${problems[0].number}–${problems[problems.length - 1].number}`
    : String(number);

  const isLoggedIn = !!session?.user;
  const currentUserId = session?.user?.id ? Number(session.user.id) : null;

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6">
        <Link href={`/${code}`} className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
          ← Kembali ke {problemSet.name}
        </Link>
      </div>

      <h1 className="text-2xl font-bold mb-6">
        {problemSet.name}, Nomor {numberLabel}
      </h1>

      {/* Extra description */}
      {extraDescription && (
        <div className="mb-4 rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30 p-5">
          <HtmlContent
            className=""
            html={extraDescription.description}
          />
        </div>
      )}

      {/* Problems */}
      {problems.map((problem) => (
        <div key={problem.id} className="border rounded-lg p-6 mb-4">
          {isClustered ? (
            <div className="flex gap-2">
              <span className="font-semibold shrink-0">{problem.number}.</span>
              <HtmlContent className="" html={problem.description} />
            </div>
          ) : (
            <HtmlContent className="" html={problem.description} />
          )}
        </div>
      ))}

      {/* Answers */}
      <h2 className="text-lg font-semibold mb-4 mt-8">{answers.length} jawaban</h2>
      <div className="space-y-6">
        {answers.map((answer) => {
          const points = answer.votes.reduce((sum, v) => sum + v.value, 0);

          return (
            <div key={answer.id} id={`answer-${answer.id}`} className="border rounded-lg">
              <div className="p-6">
                {/* Answer header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3">
                    <Link href={`/user/${answer.author.username}`}>
                      <img
                        src={profilePicUrl(answer.author.profilePicture)}
                        alt={`Foto profil ${answer.author.username}`}
                        className="w-10 h-10 rounded-full object-cover border"
                      />
                    </Link>
                    <div>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/user/${answer.author.username}`}
                          className="font-medium text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          {answer.author.firstName} {answer.author.lastName}
                        </Link>
                        <span className="text-sm text-zinc-600 dark:text-zinc-400">
                          {timeAgo(answer.createdAt)}
                        </span>
                      </div>
                      {answer.author.bio && (
                        <p className="text-xs text-zinc-500 mt-0.5">{answer.author.bio}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <button className="text-zinc-400 hover:text-green-600">▲</button>
                    <span className="font-medium">{points}</span>
                    <button className="text-zinc-400 hover:text-red-600">▼</button>
                  </div>
                </div>

                {/* Answer content */}
                <HtmlContent
                  className=""
                  html={answer.description}
                />

                {/* Edit/Delete for author */}
                {currentUserId === answer.author.id && (
                  <AnswerActions
                    answerId={answer.id}
                    currentDescription={answer.description}
                  />
                )}
              </div>

              {/* Comments */}
              {(answer.comments.length > 0 || isLoggedIn) && (
                <CommentSection
                  answerId={answer.id}
                  comments={answer.comments.map((c) => ({
                    ...c,
                    createdAt: c.createdAt.toISOString(),
                  }))}
                  isLoggedIn={isLoggedIn}
                  currentUserId={currentUserId}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Write answer */}
      {session?.user ? (
        <AnswerEditor problemId={problems[0].id} />
      ) : (
        <div className="mt-8 border rounded-lg p-6 text-center text-zinc-600 dark:text-zinc-400">
          <p>
            <Link href="/login" className="text-blue-600 dark:text-blue-400 hover:underline">
              Masuk
            </Link>{" "}
            untuk menulis jawaban
          </p>
        </div>
      )}
    </main>
  );
}
