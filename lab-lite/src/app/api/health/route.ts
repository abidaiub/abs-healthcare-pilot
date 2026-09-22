import { NextResponse } from "next/server";
import { query } from "../../../lib/db";

export async function GET() {
  try {
    await query("select 1");
    return NextResponse.json({
      status: "ok",
      service: "ABS Lab Lite Cloud API",
      database: "connected",
      timestamp: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json(
      {
        status: "degraded",
        service: "ABS Lab Lite Cloud API",
        database: "unavailable",
        timestamp: new Date().toISOString(),
      },
      { status: 503 },
    );
  }
}
