interface Candle { t: number; o: number; h: number; l: number; c: number; v: number; }

export function computeSignal(candles: Candle[]) {
  const closes = candles.map(c => c.c);
  const n = closes.length;

  const ema9 = ema(closes, 9);
  const ema21 = ema(closes, 21);
  const rsi = rsiCalc(closes, 14);
  const atr = atrCalc(candles, 14);
  const vwap = candles.reduce((s, c) => s + ((c.h + c.l + c.c) / 3) * c.v, 0) / candles.reduce((s, c) => s + c.v, 0);
  const momentum = n > 5 ? (closes[n-1] - closes[n-6]) / closes[n-6] : 0;
  const lastPrice = closes[n-1];

  let score = 0;
  if (ema9 > ema21) score += 0.3; else score -= 0.3;
  if (rsi > 30 && rsi < 50) score += 0.25;
  else if (rsi > 70) score -= 0.25;
  if (lastPrice > vwap) score += 0.2; else score -= 0.2;
  if (momentum > 0) score += 0.25 * Math.min(momentum / 0.01, 1);
  else score += 0.25 * Math.max(momentum / 0.01, -1);

  const action = score > 0.4 ? "buy" : score < -0.3 ? "sell" : "hold";
  return { action, confidence: Math.abs(score), lastPrice, atr, rsi };
}

function ema(v: number[], p: number) { const k = 2/(p+1); let e = v[0]; for (let i=1;i<v.length;i++) e = v[i]*k+e*(1-k); return e; }
function rsiCalc(c: number[], p: number) {
  let g=0,l=0;
  for(let i=c.length-p;i<c.length;i++){const d=c[i]-c[i-1];if(d>0)g+=d;else l-=d;}
  if(l===0)return 100;
  return 100-100/(1+(g/p)/(l/p));
}
function atrCalc(c: Candle[], p: number) {
  const trs:number[]=[];
  for(let i=Math.max(1,c.length-p);i<c.length;i++){
    trs.push(Math.max(c[i].h-c[i].l,Math.abs(c[i].h-c[i-1].c),Math.abs(c[i].l-c[i-1].c)));
  }
  return trs.reduce((a,b)=>a+b,0)/trs.length;
}   