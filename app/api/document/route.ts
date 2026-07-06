import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_CHATBOT_API_BASE_URL ?? "http://localhost:3001";

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get("mode") ?? "session";
    const formData = await req.formData();
    const endpoint =
      mode === "knowledge"
        ? `${BACKEND_URL}/document/knowledge/add`
        : `${BACKEND_URL}/document/upload`;

    const response = await fetch(endpoint, {
      method: "POST",
      body: formData,
      signal: AbortSignal.timeout(60_000),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({ error: `Upload failed: ${errorText}` }, { status: response.status });
    }

    return NextResponse.json(await response.json());
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? "Upload failed" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const response = await fetch(`${BACKEND_URL}/document/knowledge/list`, {
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) return NextResponse.json({ documents: [], total_chunks: 0 });
    return NextResponse.json(await response.json());
  } catch {
    return NextResponse.json({ documents: [], total_chunks: 0 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const filename = searchParams.get("filename");
    if (!filename) return NextResponse.json({ error: "filename required" }, { status: 400 });

    const response = await fetch(
      `${BACKEND_URL}/document/knowledge/${encodeURIComponent(filename)}`,
      { method: "DELETE", signal: AbortSignal.timeout(10_000) }
    );

    if (!response.ok) return NextResponse.json({ error: "Delete failed" }, { status: response.status });
    return NextResponse.json(await response.json());
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? "Delete failed" }, { status: 500 });
  }
}
