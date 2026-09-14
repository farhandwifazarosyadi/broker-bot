interface Candle { t: number; o: number; h: number; l: number; c: number; v: number; }

export function detectRegime(candles: Candle[]): string {
  const lb = Math.min(50, candles.length);
  const closes = candles.slice(-lb).map(c => c.c);
  const slope = (closes[closes.length-1] - closes[0]) / closes[0];
  const m = closes.reduce((a,b)=>a+b,0)/closes.length;
  const vol = Math.sqrt(closes.reduce((s,v)=>s+(v-m)**2,0)/closes.length) / m;

  if (vol > 0.015) return "high_vol";
  if (Math.abs(slope) > 0.03 && slope > 0) return "trending_up";
  if (Math.abs(slope) > 0.03 && slope < 0) return "trending_down";
  return "choppy";
}   