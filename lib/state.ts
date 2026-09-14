import { kv } from "@vercel/kv";

export interface Position {
  asset: string; side: "B"|"S"; entry: number; size: number;
  sl: number; tp: number; regime: string; armIdx: number;
  params: { tp_atr: number; sl_atr: number; min_conf: number };
  bars: number; mfe: number; mae: number; atr: number; rsi: number;
}

export interface BotState {
  enabled: boolean;
  positions: Record<string, Position>;
  banditStats: Record<string, { n: number; totalReward: number }>;
  equity: number; dailyPnl: number; lastTick: string;
}

const DEFAULT: BotState = { enabled: true, positions: {}, banditStats: {}, equity: 1000, dailyPnl: 0, lastTick: "" };

export async function getState(): Promise<BotState> {
  return (await kv.get<BotState>("bot:state")) || DEFAULT;
}
export async function setState(s: BotState): Promise<void> {
  s.lastTick = new Date().toISOString();
  await kv.set("bot:state", s);
}   