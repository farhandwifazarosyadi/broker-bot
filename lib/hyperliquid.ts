const API_URL = "https://api.hyperliquid.xyz";

export async function fetchCandles(asset: string, interval: string, limit: number) {
  const res = await fetch(`${API_URL}/info`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "candleSnapshot", req: { coin: asset, interval, startTime: 0, endTime: Date.now() } }),
  });
  const data = await res.json();
  return data.slice(-limit).map((c: any) => ({
    t: c.t, o: +c.o, h: +c.h, l: +c.l, c: +c.c, v: +c.v,
  }));
}

export async function getAssetIndex(asset: string): Promise<number> {
  const res = await fetch(`${API_URL}/info`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "meta" }),
  });
  const meta = await res.json();
  return meta.universe.findIndex((u: any) => u.name === asset);
}

export async function placeOrder(asset: string, side: "B" | "S", size: number) {
  // PLACEHOLDER — akan diimplementasikan setelah EIP-712 signing
  console.log(`[ORDER] ${asset} ${side} size=${size}`);
  return { status: "ok", note: "paper trade" };
}

export async function placeTriggerOrder(asset: string, side: "B" | "S", size: number, triggerPx: number, tpsl: "sl" | "tp") {
  console.log(`[TRIGGER] ${asset} ${side} size=${size} trigger=${triggerPx} ${tpsl}`);
  return { status: "ok" };
}

export async function getAccountValue(): Promise<number> {
  const account = process.env.HL_ACCOUNT;
  if (!account) return 1000;
  const res = await fetch(`${API_URL}/info`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "clearinghouseState", user: account }),
  });
  const data = await res.json();
  return parseFloat(data.marginSummary?.accountValue || "1000");
}   