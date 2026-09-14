import { NextResponse } from "next/server";
import { getState, setState } from "@/lib/state";

export async function POST() {
  const s = await getState();
  s.enabled = !s.enabled;
  await setState(s);
  return NextResponse.json({ enabled: s.enabled });
}   