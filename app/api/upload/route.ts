import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { uploadToR2 } from "@/lib/r2";

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
]);
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: "File type not allowed. Use JPEG, PNG, GIF, or WebP." },
      { status: 400 }
    );
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: "File too large. Maximum size is 5MB." },
      { status: 400 }
    );
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const url = await uploadToR2(buffer, file.name, file.type);
    return NextResponse.json({ url });
  } catch (e) {
    console.error("Upload failed:", e);
    return NextResponse.json(
      { error: "Upload failed" },
      { status: 500 }
    );
  }
}
