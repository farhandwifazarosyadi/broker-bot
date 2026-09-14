import { NextRequest, NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import { getState, setState } from "@/lib/state";
import { fetchCandles, placeOrder, placeTriggerOrder } from "@/lib/hyperliquid";
import { computeSignal } from "@/lib/signal";
import { detectRegime } from "@/lib/regime";
import { selectParams, updateBandit } from "@/lib/bandit";
import { recordTrade } from "@/lib/db";

export const maxDuration = 60;
const ASSETS = ["NVDA", "TSLA", "AAPL"];
const MAX_RISK = 0.01, MAX_DAILY_LOSS = 0.03, MAX_POS = 5;

export async function GET(req: NextRequest) {
  const lock = await kv.set("bot:lock", "1", { nx: true, ex: 55 });
  if (!lock) return NextResponse.json({ status: "skipped" });

  try {
    const state = await getState();
    if (!state.enabled) return NextResponse.json({ status: "disabled" });

    const results: string[] = [];

    for (const asset of ASSETS) {
      try {
        const candles = await fetchCandles(asset, "15m", 200);
        if (candles.length < 30) continue;

        const regime = detectRegime(candles);
        const { params, armIdx } = selectParams(regime, state.banditStats);

        if (state.positions[asset]) {
          const pos = state.positions[asset];
          pos.bars++;
          const lp = candles[candles.length - 1].c;
          const hitSL = pos.side === "B" ? lp <= pos.sl : lp >= pos.sl;
          const hitTP = pos.side === "B" ? lp >= pos.tp : lp <= pos.tp;
          const timeout = pos.bars > 48;

          if (hitSL || hitTP || timeout) {
            const dir = pos.side === "B" ? 1 : -1;
            const pnl = (lp - pos.entry) * pos.size * dir;
            const pnlPct = (lp - pos.entry) / pos.entry * dir;
            const reason = hitSL ? "sl" : hitTP ? "tp" : "timeout";
            results.push(`EXIT ${asset}[${reason}] ${pnl.toFixed(2)}`);

            await recordTrade({ timestamp: new Date().toISOString(), asset, action: pos.side === "B" ? "buy" : "sell", entry: pos.entry, exit: lp, pnl, pnlPct, regime: pos.regime, exitReason: reason });
            state.banditStats[`${regime}:${armIdx}`] = updateBandit(state.banditStats[`${regime}:${armIdx}`], pnlPct);
            state.equity += pnl;
            state.dailyPnl += pnl;
            delete state.positions[asset];
          }
          continue;
        }

        const sig = computeSignal(candles);
        if (sig.action === "hold") continue;
        if (Object.keys(state.positions).length >= MAX_POS) continue;
        if (state.dailyPnl < -state.equity * MAX_DAILY_LOSS) continue;
        if (sig.confidence < params.min_conf) continue;

        const entry = sig.lastPrice;
        const tpD = params.tp_atr * sig.atr, slD = params.sl_atr * sig.atr;
        const side = sig.action === "buy" ? "B" : "S";
        const sl = side === "B" ? entry - slD : entry + slD;
        const tp = side === "B" ? entry + tpD : entry - tpD;
        const size = (state.equity * MAX_RISK) / Math.abs(entry - sl);
        if (size <= 0) continue;

        await placeOrder(asset, side, size);
        await placeTriggerOrder(asset, side === "B" ? "S" : "B", size, sl, "sl");
        await placeTriggerOrder(asset, side === "B" ? "S" : "B", size, tp, "tp");

        state.positions[asset] = { asset, side, entry, size, sl, tp, regime, armIdx, params, bars: 0, mfe: 0, mae: 0, atr: sig.atr, rsi: sig.rsi };
        results.push(`ENTRY ${asset} ${side}@${entry.toFixed(2)}[${regime}]`);
      } catch (e: any) {
        results.push(`ERR ${asset}: ${e.message}`);
      }
    }

    await setState(state);
    await kv.del("bot:lock");
    return NextResponse.json({ status: "ok", results, equity: state.equity, dailyPnl: state.dailyPnl, openPositions: Object.keys(state.positions).length });
  } catch (e: any) {
    await kv.del("bot:lock");
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}   