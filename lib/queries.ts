import { prisma } from "./prisma";
import { categoryLabel } from "./format";

// ─── Home page ────────────────────────────────────────────────────────

export async function getPublishedProblemSetsByCategory() {
  const rows = await prisma.$queryRaw<
    { category: string; id: number; code: string; name: string; problem_count: number; answer_count: bigint }[]
  >`
    SELECT
      ps.category,
      ps.id,
      ps.code,
      ps.name,
      ps.problem_count,
      COALESCE(ac.cnt, 0) AS answer_count
    FROM problemsets ps
    LEFT JOIN (
      SELECT p.problemset_id, COUNT(a.id) AS cnt
      FROM problems p
      JOIN answers a ON a.problem_id = p.id
      GROUP BY p.problemset_id
    ) ac ON ac.problemset_id = ps.id
    WHERE ps.status = 'PUBLISHED' AND ps.code IS NOT NULL
    ORDER BY ps.category, ps.name
  `;

  const grouped: Record<string, { code: string; name: string; problems: number; answers: number }[]> = {};
  for (const row of rows) {
    const label = categoryLabel(row.category);
    if (!grouped[label]) grouped[label] = [];
    grouped[label].push({
      code: row.code,
      name: row.name,
      problems: row.problem_count,
      answers: Number(row.answer_count),
    });
  }
  return grouped;
}

export async function getTopContributors(limit: number) {
  const rows = await prisma.$queryRaw<
    { username: string; first_name: string; last_name: string; profile_picture: string | null; points: bigint }[]
  >`
    SELECT u.username, u.first_name, u.last_name, u.profile_picture, COALESCE(SUM(v.value), 0) AS points
    FROM users u
    JOIN answers a ON a.author_id = u.id
    JOIN votes v ON v.answer_id = a.id
    GROUP BY u.id, u.username, u.first_name, u.last_name, u.profile_picture
    HAVING SUM(v.value) > 0
    ORDER BY points DESC
    LIMIT ${limit}
  `;

  return rows.map((r) => ({
    username: r.username,
    firstName: r.first_name,
    lastName: r.last_name,
    profilePicture: r.profile_picture,
    points: Number(r.points),
  }));
}

export async function getRecentAnswers(limit: number) {
  return prisma.answer.findMany({
    where: {
      problem: { problemSet: { status: "PUBLISHED", code: { not: null } } },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      createdAt: true,
      problem: {
        select: {
          number: true,
          problemSet: {
            select: { code: true, name: true },
          },
        },
      },
      author: {
        select: { username: true, firstName: true, lastName: true },
      },
    },
  });
}

// ─── Problem set page ─────────────────────────────────────────────────

export async function getProblemSetByCode(code: string) {
  return prisma.problemSet.findFirst({
    where: { code, status: "PUBLISHED" },
    include: {
      problems: {
        orderBy: { number: "asc" },
        select: {
          id: true,
          number: true,
          description: true,
          _count: { select: { answers: true } },
        },
      },
      extraDescriptions: {
        orderBy: { startNumber: "asc" },
      },
    },
  });
}

// ─── Problem detail page ──────────────────────────────────────────────

export async function getProblemByCodeAndNumber(code: string, number: number) {
  const problemSet = await prisma.problemSet.findFirst({
    where: { code, status: "PUBLISHED" },
    select: { id: true, name: true, code: true },
  });
  if (!problemSet) return null;

  // Find applicable extra description (cluster)
  const extraDescription = await prisma.extraDescription.findFirst({
    where: {
      problemSetId: problemSet.id,
      startNumber: { lte: number },
      endNumber: { gte: number },
    },
  });

  const answerInclude = {
    include: {
      author: { select: { id: true, username: true, firstName: true, lastName: true, profilePicture: true, bio: true } },
      votes: { select: { voterId: true, value: true } },
      comments: {
        orderBy: { createdAt: "asc" as const },
        include: {
          author: { select: { id: true, username: true, firstName: true, lastName: true, profilePicture: true, bio: true } },
        },
      },
    },
    orderBy: { createdAt: "asc" as const },
  };

  if (extraDescription) {
    // Clustered: fetch all problems in range, answers from first problem only
    const [problems, firstProblem] = await Promise.all([
      prisma.problem.findMany({
        where: {
          problemSetId: problemSet.id,
          number: { gte: extraDescription.startNumber, lte: extraDescription.endNumber },
        },
        orderBy: { number: "asc" },
        select: { id: true, number: true, description: true },
      }),
      prisma.problem.findFirst({
        where: { problemSetId: problemSet.id, number: extraDescription.startNumber },
        include: { answers: answerInclude },
      }),
    ]);

    if (problems.length === 0) return null;

    const answers = firstProblem?.answers ?? [];
    answers.sort((a, b) => {
      const pointsA = a.votes.reduce((sum, v) => sum + v.value, 0);
      const pointsB = b.votes.reduce((sum, v) => sum + v.value, 0);
      return pointsB - pointsA;
    });

    return { problemSet, problems, extraDescription, answers };
  }

  // Non-clustered: single problem with its own answers
  const problem = await prisma.problem.findFirst({
    where: { problemSetId: problemSet.id, number },
    include: { answers: answerInclude },
  });
  if (!problem) return null;

  problem.answers.sort((a, b) => {
    const pointsA = a.votes.reduce((sum, v) => sum + v.value, 0);
    const pointsB = b.votes.reduce((sum, v) => sum + v.value, 0);
    return pointsB - pointsA;
  });

  return {
    problemSet,
    problems: [{ id: problem.id, number: problem.number, description: problem.description }],
    extraDescription: null,
    answers: problem.answers,
  };
}

// ─── User profile page ───────────────────────────────────────────────

export async function getUserByUsername(username: string) {
  return prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      username: true,
      profilePicture: true,
      bio: true,
      location: true,
      website: true,
      createdAt: true,
    },
  });
}

export async function getUserStats(userId: number) {
  const [pointsResult, answers, comments, problemHistory] = await Promise.all([
    prisma.$queryRaw<{ points: bigint }[]>`
      SELECT COALESCE(SUM(v.value), 0) AS points
      FROM answers a
      JOIN votes v ON v.answer_id = a.id
      WHERE a.author_id = ${userId}
    `,
    prisma.answer.count({ where: { authorId: userId } }),
    prisma.comment.count({ where: { authorId: userId } }),
    prisma.problemHistory.count({ where: { authorId: userId } }),
  ]);

  return {
    points: Number(pointsResult[0]?.points ?? 0),
    totalAnswers: answers,
    totalComments: comments,
    totalContributions: problemHistory,
  };
}

// ─── Search ──────────────────────────────────────────────────────────

export async function searchProblems(query: string, limit = 50) {
  return prisma.problem.findMany({
    where: {
      description: { contains: query, mode: "insensitive" },
      problemSet: { status: "PUBLISHED", code: { not: null } },
    },
    take: limit,
    select: {
      id: true,
      number: true,
      description: true,
      _count: { select: { answers: true } },
      problemSet: {
        select: { code: true, name: true },
      },
    },
  });
}

export async function getFollowerCount(userId: number) {
  return prisma.follow.count({ where: { followingId: userId } });
}

export async function getFollowingCount(userId: number) {
  return prisma.follow.count({ where: { followerId: userId } });
}

// ─── Problem Factory ──────────────────────────────────────────────────

export async function getDraftProblemSets() {
  return prisma.problemSet.findMany({
    where: { status: { not: "PUBLISHED" } },
    orderBy: { updatedAt: "desc" },
    include: {
      _count: { select: { problems: true } },
    },
  });
}

export async function getProblemSetById(id: number) {
  return prisma.problemSet.findUnique({
    where: { id },
    include: {
      problems: {
        orderBy: { number: "asc" },
        select: {
          id: true,
          number: true,
          description: true,
        },
      },
      extraDescriptions: {
        orderBy: { startNumber: "asc" },
      },
    },
  });
}

export async function getProblemBySetAndNumber(problemSetId: number, number: number) {
  return prisma.problem.findFirst({
    where: { problemSetId, number },
  });
}

export async function isAdmin(userId: number) {
  const admin = await prisma.admin.findUnique({ where: { userId } });
  return !!admin;
}

// ─── User profile page ───────────────────────────────────────────────

export async function getUserRecentAnswers(userId: number, limit: number) {
  return prisma.answer.findMany({
    where: {
      authorId: userId,
      problem: { problemSet: { status: "PUBLISHED", code: { not: null } } },
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limit,
    select: {
      id: true,
      description: true,
      createdAt: true,
      problem: {
        select: {
          number: true,
          problemSet: {
            select: { code: true, name: true },
          },
        },
      },
      votes: { select: { value: true } },
      _count: { select: { comments: true } },
    },
  });
}

const recentAnswerSelect = {
  id: true,
  description: true,
  createdAt: true,
  problem: {
    select: {
      number: true,
      problemSet: {
        select: { code: true, name: true },
      },
    },
  },
  votes: { select: { value: true } },
  _count: { select: { comments: true } },
} as const;

export type RecentAnswer = NonNullable<Awaited<ReturnType<typeof getUserRecentAnswersPaginated>>["answers"][number]>;

export async function getUserRecentAnswersPaginated(userId: number, limit: number, cursor?: number) {
  const answers = await prisma.answer.findMany({
    where: {
      authorId: userId,
      problem: { problemSet: { status: "PUBLISHED", code: { not: null } } },
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    select: recentAnswerSelect,
  });

  const hasMore = answers.length > limit;
  if (hasMore) answers.pop();

  return {
    answers,
    nextCursor: hasMore ? answers[answers.length - 1].id : null,
  };
}
