import { NextResponse } from "next/server";
import { getState, setState } from "@/lib/state";

export async function POST() {
  const s = await getState();
  s.enabled = false;
  s.positions = {};
  await setState(s);
  return NextResponse.json({ status: "killed" });
}   