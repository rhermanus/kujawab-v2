import { NextRequest, NextResponse } from "next/server";
import { getUserRecentAnswersPaginated } from "@/lib/queries";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const userId = Number(id);
  if (!userId || isNaN(userId)) {
    return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
  }

  const searchParams = request.nextUrl.searchParams;
  const cursor = searchParams.get("cursor");
  const limit = 10;

  const result = await getUserRecentAnswersPaginated(
    userId,
    limit,
    cursor ? Number(cursor) : undefined
  );

  return NextResponse.json(result);
}
