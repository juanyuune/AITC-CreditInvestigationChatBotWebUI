import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    sessionId: string;
  }>;
};

/**
 * TODO:
 * Connect these handlers to your backend conversation/case storage.
 * Suggested contract:
 * - GET    : fetch one conversation with all messages
 * - PUT    : update title, metadata, or message snapshots
 * - DELETE : archive or soft-delete a conversation
 */
export async function GET(_req: NextRequest, context: RouteContext) {
  const { sessionId } = await context.params;

  return NextResponse.json({
    session: {
      id: sessionId,
      title: "待串接",
      messages: [],
    },
    integrationStatus: "pending_backend_integration",
  });
}

export async function PUT(req: NextRequest, context: RouteContext) {
  const { sessionId } = await context.params;
  const body = await req.json().catch(() => ({}));

  return NextResponse.json({
    session: {
      id: sessionId,
      ...body,
    },
    integrationStatus: "pending_backend_integration",
    message: "Session update API contract is reserved for backend integration.",
  });
}

export async function DELETE(
  _req: NextRequest,
  context: RouteContext,
) {
  const { sessionId } = await context.params;

  return NextResponse.json({
    sessionId,
    integrationStatus: "pending_backend_integration",
    message: "Session delete API contract is reserved for backend integration.",
  });
}
