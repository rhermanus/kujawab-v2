import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProblemByCodeAndNumber, getNavigableNumbers } from "@/lib/queries";

export async function generateMetadata({ params }: { params: Promise<{ code: string; number: string }> }): Promise<Metadata> {
  const { code, number } = await params;
  const result = await getProblemByCodeAndNumber(code, parseInt(number));
  if (!result) return { title: "Soal" };
  const title = `${result.problemSet.name}, No. ${number}`;
  const description = `Soal nomor ${number} dari ${result.problemSet.name} — ${result.answers.length} jawaban`;
  return {
    title,
    description,
    alternates: { canonical: `/${code.toUpperCase()}/${number}` },
    openGraph: { title, description, type: "article" },
  };
}
import { timeAgo } from "@/lib/format";
import ProfilePic from "@/components/profile-pic";
import HtmlContent from "@/components/html-content";
import AnswerEditor from "@/components/answer-editor";
import AnswerActions from "@/components/answer-actions";
import VoteButtons from "@/components/vote-buttons";
import CommentSection from "@/components/comment-section";
import { auth } from "@/auth";
import { ChevronLeft, ChevronRight, PenLine } from "lucide-react";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://www.kujawab.com";

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/&[^;]+;/g, " ").replace(/\s+/g, " ").trim();
}

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

  const navNumbers = await getNavigableNumbers(problemSet.id);
  const currentIdx = navNumbers.indexOf(problems[0].number!);
  const prevNumber = currentIdx > 0 ? navNumbers[currentIdx - 1] : null;
  const nextNumber = currentIdx < navNumbers.length - 1 ? navNumbers[currentIdx + 1] : null;

  // JSON-LD structured data (QAPage)
  const questionText = problems.map((p) => stripHtml(p.description)).join(" ");
  const sortedAnswers = answers.map((a) => ({
    text: stripHtml(a.description),
    author: `${a.author.firstName} ${a.author.lastName}`,
    votes: a.votes.reduce((sum, v) => sum + v.value, 0),
    date: a.createdAt.toISOString(),
  }));
  const topAnswer = sortedAnswers[0];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "QAPage",
    mainEntity: {
      "@type": "Question",
      name: `${problemSet.name}, Nomor ${numberLabel}`,
      text: questionText.slice(0, 500),
      answerCount: answers.length,
      ...(topAnswer && {
        acceptedAnswer: {
          "@type": "Answer",
          text: topAnswer.text.slice(0, 500),
          author: { "@type": "Person", name: topAnswer.author },
          upvoteCount: topAnswer.votes,
          dateCreated: topAnswer.date,
        },
      }),
      ...(sortedAnswers.length > 1 && {
        suggestedAnswer: sortedAnswers.slice(1).map((a) => ({
          "@type": "Answer",
          text: a.text.slice(0, 500),
          author: { "@type": "Person", name: a.author },
          upvoteCount: a.votes,
          dateCreated: a.date,
        })),
      }),
    },
  };

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="mb-6">
        <Link href={`/${code}`} className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
          ← Kembali ke {problemSet.name}
        </Link>
      </div>

      <h1 className="text-2xl font-bold mb-6">
        {problemSet.name}, Nomor {numberLabel}
      </h1>

      {/* Quick shortcuts */}
      <div className="flex items-center justify-center gap-4 mb-6">
        {prevNumber !== null ? (
          <Link
            href={`/${code}/${prevNumber}`}
            className="flex items-center gap-1 rounded-lg border px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            title={`Soal ${prevNumber}`}
          >
            <ChevronLeft size={18} />
            <span className="hidden sm:inline">Sebelumnya</span>
          </Link>
        ) : (
          <span className="flex items-center gap-1 rounded-lg border px-3 py-2 text-sm opacity-30 cursor-default">
            <ChevronLeft size={18} />
            <span className="hidden sm:inline">Sebelumnya</span>
          </span>
        )}

        <a
          href="#answer-editor"
          className="flex items-center gap-1 rounded-lg border px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          title="Tulis jawaban"
        >
          <PenLine size={18} />
          <span className="hidden sm:inline">Tulis Jawaban</span>
        </a>

        {nextNumber !== null ? (
          <Link
            href={`/${code}/${nextNumber}`}
            className="flex items-center gap-1 rounded-lg border px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            title={`Soal ${nextNumber}`}
          >
            <span className="hidden sm:inline">Selanjutnya</span>
            <ChevronRight size={18} />
          </Link>
        ) : (
          <span className="flex items-center gap-1 rounded-lg border px-3 py-2 text-sm opacity-30 cursor-default">
            <span className="hidden sm:inline">Selanjutnya</span>
            <ChevronRight size={18} />
          </span>
        )}
      </div>

      {/* Extra description */}
      {extraDescription && (
        <div className="mb-4 rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30 p-5">
          <p className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-2">
            Deskripsi Untuk Soal Nomor {extraDescription.startNumber} dan {extraDescription.endNumber}
          </p>
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
          const userVote = currentUserId
            ? answer.votes.find((v) => v.voterId === currentUserId)?.value ?? 0
            : 0;

          return (
            <div key={answer.id} id={`answer-${answer.id}`} className="border rounded-lg">
              <div className="p-6">
                {/* Answer header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3">
                    <Link href={`/user/${answer.author.username}`}>
                      <ProfilePic path={answer.author.profilePicture} alt={`Foto profil ${answer.author.username}`} className="w-10 h-10" />
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
                  <VoteButtons
                    answerId={answer.id}
                    points={points}
                    userVote={userVote}
                    isLoggedIn={isLoggedIn}
                  />
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
      <div id="answer-editor" />
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
