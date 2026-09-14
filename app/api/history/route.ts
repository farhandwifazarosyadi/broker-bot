import { NextRequest, NextResponse } from "next/server";
import { getTrades } from "@/lib/db";

export async function GET(req: NextRequest) {
  const limit = parseInt(req.nextUrl.searchParams.get("limit") || "50");
  return NextResponse.json({ trades: await getTrades(limit) });
}   