import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * TODO:
 * 1. Replace this placeholder API with real persistence from your backend system.
 * 2. Recommended backend capabilities:
 *    - GET /api/chat/sessions?userId=...          -> list conversation history
 *    - POST /api/chat/sessions                    -> create a new conversation/case
 * 3. Frontend currently uses localStorage as the working history source so the UI
 *    remains usable before backend integration is ready.
 */
export async function GET(_req: NextRequest) {
  return NextResponse.json({
    sessions: [],
    integrationStatus: "pending_backend_integration",
    message: "Placeholder API is ready. Connect this route to your backend session store.",
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));

  return NextResponse.json(
    {
      session: {
        id: body.id ?? null,
        title: body.title ?? "新對話",
      },
      integrationStatus: "pending_backend_integration",
      message: "Session create API contract is reserved for backend integration.",
    },
    { status: 202 },
  );
}
