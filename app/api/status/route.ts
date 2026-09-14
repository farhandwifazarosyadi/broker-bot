import { NextResponse } from "next/server";
import { getState } from "@/lib/state";

export async function GET() {
  const s = await getState();
  return NextResponse.json({ enabled: s.enabled, equity: s.equity, dailyPnl: s.dailyPnl, openPositions: Object.keys(s.positions).length, positions: s.positions, lastTick: s.lastTick });
}   