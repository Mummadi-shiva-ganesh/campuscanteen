import { NextResponse } from "next/server";
import { readDBSync, writeDBSync, type MockDatabase } from "@/lib/supabase/mock-server";

/**
 * API proxy for the browser-side Mock Supabase client.
 * The browser cannot access the filesystem directly, so all DB
 * read/write operations are proxied through this endpoint.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, db: incomingDB } = body as {
      action: "readDB" | "writeDB";
      db?: MockDatabase;
    };

    if (action === "readDB") {
      const db = readDBSync();
      return NextResponse.json(db);
    }

    if (action === "writeDB" && incomingDB) {
      writeDBSync(incomingDB);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Mock DB API error" },
      { status: 500 },
    );
  }
}
