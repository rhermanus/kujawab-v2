import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function checkApiKey(request: NextRequest) {
  const key = process.env.PROBLEMFACTORY_API_KEY;
  if (!key) throw new Error("PROBLEMFACTORY_API_KEY env var is not set");
  return request.headers.get("authorization") === `Bearer ${key}`;
}

// GET /api/problemfactory?id=123 — fetch problemset with problems and extra descriptions
export async function GET(request: NextRequest) {
  if (!checkApiKey(request)) return unauthorized();

  const id = Number(request.nextUrl.searchParams.get("id"));
  if (!id || isNaN(id)) {
    return NextResponse.json({ error: "Missing or invalid id param" }, { status: 400 });
  }

  const set = await prisma.problemSet.findUnique({
    where: { id },
    include: {
      problems: { orderBy: { number: "asc" }, select: { id: true, number: true, description: true } },
      extraDescriptions: { orderBy: { startNumber: "asc" }, select: { id: true, startNumber: true, endNumber: true, description: true } },
    },
  });

  if (!set) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(set);
}

// POST /api/problemfactory — action dispatch
export async function POST(request: NextRequest) {
  if (!checkApiKey(request)) return unauthorized();

  const body = await request.json();
  const { action } = body;

  switch (action) {
    case "create_set":
      return createSet(body);
    case "update_set":
      return updateSet(body);
    case "save_problem":
      return saveProblem(body);
    case "save_problems_batch":
      return saveProblemsBatch(body);
    case "save_extra_description":
      return saveExtraDescription(body);
    case "delete_extra_description":
      return deleteExtraDescription(body);
    default:
      return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  }
}

async function createSet(body: { name?: string; problemCount?: number; category?: string }) {
  const name = body.name?.trim();
  if (!name || name.length > 100) {
    return NextResponse.json({ error: "name must be 1-100 chars" }, { status: 400 });
  }
  const problemCount = body.problemCount;
  if (!problemCount || !Number.isInteger(problemCount) || problemCount < 1) {
    return NextResponse.json({ error: "problemCount must be a positive integer" }, { status: 400 });
  }

  const set = await prisma.problemSet.create({
    data: {
      name,
      problemCount,
      category: (body.category as any) || null,
      status: "DRAFT",
    },
  });

  return NextResponse.json({ id: set.id });
}

async function updateSet(body: { id?: number; name?: string; code?: string; category?: string }) {
  const id = body.id;
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const set = await prisma.problemSet.findUnique({ where: { id } });
  if (!set) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const update: Record<string, unknown> = {};

  if (body.name !== undefined) {
    const name = body.name.trim();
    if (!name || name.length > 100) {
      return NextResponse.json({ error: "name must be 1-100 chars" }, { status: 400 });
    }
    update.name = name;
  }

  if (body.code !== undefined) {
    const code = body.code.trim().toUpperCase();
    if (!code || code.length > 15 || !/^[A-Z0-9-]+$/.test(code)) {
      return NextResponse.json({ error: "code must be 1-15 uppercase alphanumeric/dash chars" }, { status: 400 });
    }
    const existing = await prisma.problemSet.findUnique({ where: { code } });
    if (existing && existing.id !== id) {
      return NextResponse.json({ error: "code already in use" }, { status: 409 });
    }
    update.code = code;
  }

  if (body.category !== undefined) {
    update.category = body.category || null;
  }

  await prisma.problemSet.update({ where: { id }, data: update });
  return NextResponse.json({ success: true });
}

async function saveProblem(body: { problemSetId?: number; number?: number; description?: string }) {
  const { problemSetId, number, description } = body;
  if (!problemSetId || !number || !description) {
    return NextResponse.json({ error: "problemSetId, number, and description are required" }, { status: 400 });
  }

  const set = await prisma.problemSet.findUnique({ where: { id: problemSetId } });
  if (!set) return NextResponse.json({ error: "Problem set not found" }, { status: 404 });

  if (number < 1 || number > set.problemCount) {
    return NextResponse.json({ error: `number must be between 1 and ${set.problemCount}` }, { status: 400 });
  }

  const trimmed = description.trim();
  if (trimmed.length < 10) {
    return NextResponse.json({ error: "description too short (min 10 chars)" }, { status: 400 });
  }

  const existing = await prisma.problem.findFirst({
    where: { problemSetId, number },
  });

  if (existing) {
    await prisma.problem.update({
      where: { id: existing.id },
      data: { description: trimmed },
    });
    return NextResponse.json({ success: true, id: existing.id, created: false });
  } else {
    const problem = await prisma.problem.create({
      data: { problemSetId, number, description: trimmed },
    });
    return NextResponse.json({ success: true, id: problem.id, created: true });
  }
}

async function saveProblemsBatch(body: {
  problemSetId?: number;
  problems?: { number: number; description: string }[];
}) {
  const { problemSetId, problems } = body;
  if (!problemSetId || !problems || !Array.isArray(problems) || problems.length === 0) {
    return NextResponse.json({ error: "problemSetId and non-empty problems array are required" }, { status: 400 });
  }

  const set = await prisma.problemSet.findUnique({ where: { id: problemSetId } });
  if (!set) return NextResponse.json({ error: "Problem set not found" }, { status: 404 });

  const results: { number: number; id: number; created: boolean; error?: string }[] = [];

  for (const p of problems) {
    if (!p.number || !p.description) {
      results.push({ number: p.number, id: 0, created: false, error: "number and description are required" });
      continue;
    }
    if (p.number < 1 || p.number > set.problemCount) {
      results.push({ number: p.number, id: 0, created: false, error: `number must be between 1 and ${set.problemCount}` });
      continue;
    }
    const trimmed = p.description.trim();
    if (trimmed.length < 10) {
      results.push({ number: p.number, id: 0, created: false, error: "description too short" });
      continue;
    }

    const existing = await prisma.problem.findFirst({
      where: { problemSetId, number: p.number },
    });

    if (existing) {
      await prisma.problem.update({ where: { id: existing.id }, data: { description: trimmed } });
      results.push({ number: p.number, id: existing.id, created: false });
    } else {
      const created = await prisma.problem.create({
        data: { problemSetId, number: p.number, description: trimmed },
      });
      results.push({ number: p.number, id: created.id, created: true });
    }
  }

  return NextResponse.json({ success: true, results });
}

async function saveExtraDescription(body: {
  problemSetId?: number;
  startNumber?: number;
  endNumber?: number;
  description?: string;
  id?: number;
}) {
  const { problemSetId, startNumber, endNumber, description } = body;
  if (!problemSetId || !startNumber || !endNumber || !description) {
    return NextResponse.json(
      { error: "problemSetId, startNumber, endNumber, and description are required" },
      { status: 400 }
    );
  }

  const set = await prisma.problemSet.findUnique({ where: { id: problemSetId } });
  if (!set) return NextResponse.json({ error: "Problem set not found" }, { status: 404 });

  if (startNumber < 1 || endNumber > set.problemCount || startNumber > endNumber) {
    return NextResponse.json({ error: "Invalid number range" }, { status: 400 });
  }

  const trimmed = description.trim();
  if (trimmed.length < 10) {
    return NextResponse.json({ error: "description too short (min 10 chars)" }, { status: 400 });
  }

  if (body.id) {
    await prisma.extraDescription.update({
      where: { id: body.id },
      data: { startNumber, endNumber, description: trimmed },
    });
    return NextResponse.json({ success: true, id: body.id, created: false });
  } else {
    const ed = await prisma.extraDescription.create({
      data: { problemSetId, startNumber, endNumber, description: trimmed },
    });
    return NextResponse.json({ success: true, id: ed.id, created: true });
  }
}

async function deleteExtraDescription(body: { id?: number }) {
  if (!body.id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const ed = await prisma.extraDescription.findUnique({ where: { id: body.id } });
  if (!ed) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.extraDescription.delete({ where: { id: body.id } });
  return NextResponse.json({ success: true });
}
