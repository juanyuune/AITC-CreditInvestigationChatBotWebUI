import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_CHATBOT_API_BASE_URL ?? "http://localhost:3001";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const question: string = body.question ?? "";
    if (!question.trim()) {
      return NextResponse.json({ error: "Question is required" }, { status: 400 });
    }

    const encodedQuestion = encodeURIComponent(question.trim());
    const response = await fetch(
      `${BACKEND_URL}/chatbot/${encodedQuestion}`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(180_000),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `Backend error: ${errorText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({
      answer: data.answer ?? "",
      message: data.answer ?? "",
      model: data.model ?? "unknown",
      provider: data.provider ?? "unknown",
      response_time_seconds: data.response_time_seconds ?? 0,
      cached: data.cached ?? false,
      dispatch_decision: data.dispatch_decision ?? "private",
    });
  } catch (error: any) {
    if (error?.name === "TimeoutError") {
      return NextResponse.json(
        { error: "Request timed out. Please try again." },
        { status: 504 }
      );
    }
    return NextResponse.json(
      { error: error?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}
