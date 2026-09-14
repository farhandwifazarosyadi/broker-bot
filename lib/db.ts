import { kv } from "@vercel/kv";

export interface TradeRecord {
  timestamp: string; asset: string; action: string;
  entry: number; exit: number; pnl: number; pnlPct: number;
  regime: string; exitReason: string;
}

export async function recordTrade(t: TradeRecord) {
  const list = (await kv.get<TradeRecord[]>("trades")) || [];
  list.unshift(t);
  if (list.length > 500) list.pop();
  await kv.set("trades", list);
}

export async function getTrades(limit = 50): Promise<TradeRecord[]> {
  return ((await kv.get<TradeRecord[]>("trades")) || []).slice(0, limit);
}   