import type { Metadata } from "next";
import { getPublishedProblemSetsByCategory, getTopContributors, getRecentAnswers } from "@/lib/queries";
import { timeAgo } from "@/lib/format";
import HomeContent from "@/components/home-content";

export const metadata: Metadata = { title: "Beranda" };

export default async function Home() {
  const [problemSetsByCategory, topContributors, recentAnswersRaw] = await Promise.all([
    getPublishedProblemSetsByCategory(),
    getTopContributors(3),
    getRecentAnswers(5),
  ]);

  const recentAnswers = recentAnswersRaw.map((a) => ({
    id: a.id,
    problemNumber: a.problem.number,
    problemSetCode: a.problem.problemSet.code,
    problemSetName: a.problem.problemSet.name,
    authorUsername: a.author.username,
    authorFirstName: a.author.firstName,
    authorLastName: a.author.lastName,
    timeAgo: timeAgo(a.createdAt),
  }));

  return (
    <HomeContent
      problemSetsByCategory={problemSetsByCategory}
      topContributors={topContributors}
      recentAnswers={recentAnswers}
    />
  );
}
