import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { getPublishedProblemSetsByCategory, getTopContributors, getRecentAnswers } from "@/lib/queries";
import { getUnreadCount } from "@/lib/notifications";
import { timeAgo } from "@/lib/format";
import { NextResponse } from "next/server";

export async function GET() {
  const results: Record<string, unknown> = {};

  try {
    results.dbUsers = await prisma.user.count();
  } catch (e: unknown) {
    results.dbError = e instanceof Error ? e.message : String(e);
  }

  try {
    const session = await auth();
    results.auth = session ? "has session" : "no session";
    if (session?.user?.id) {
      results.unread = await getUnreadCount(Number(session.user.id));
    }
  } catch (e: unknown) {
    results.authError = e instanceof Error ? e.message : String(e);
  }

  try {
    const data = await getPublishedProblemSetsByCategory();
    results.categories = Object.keys(data).length;
  } catch (e: unknown) {
    results.queryError = e instanceof Error ? `${e.message}\n${e.stack}` : String(e);
  }

  try {
    const contributors = await getTopContributors(3);
    results.contributors = contributors.length;
  } catch (e: unknown) {
    results.contributorsError = e instanceof Error ? `${e.message}\n${e.stack}` : String(e);
  }

  try {
    const answers = await getRecentAnswers(5);
    // Try serializing like the page does
    const serialized = answers.map((a) => ({
      id: a.id,
      problemNumber: a.problem.number,
      problemSetCode: a.problem.problemSet.code,
      problemSetName: a.problem.problemSet.name,
      authorUsername: a.author.username,
      authorFirstName: a.author.firstName,
      authorLastName: a.author.lastName,
      timeAgo: timeAgo(a.createdAt),
    }));
    results.recentAnswers = serialized.length;
  } catch (e: unknown) {
    results.answersError = e instanceof Error ? `${e.message}\n${e.stack}` : String(e);
  }

  return NextResponse.json(results);
}
