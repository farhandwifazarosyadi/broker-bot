interface Arm { tp_atr: number; sl_atr: number; min_conf: number; }
const ARMS: Record<string, Arm[]> = {
  trending_up: [{tp_atr:1.5,sl_atr:1.5,min_conf:0.55},{tp_atr:2.0,sl_atr:1.0,min_conf:0.65},{tp_atr:1.0,sl_atr:2.0,min_conf:0.50}],
  trending_down: [{tp_atr:1.5,sl_atr:1.5,min_conf:0.55},{tp_atr:1.0,sl_atr:1.0,min_conf:0.60},{tp_atr:2.0,sl_atr:2.0,min_conf:0.50}],
  choppy: [{tp_atr:0.8,sl_atr:1.2,min_conf:0.70},{tp_atr:1.0,sl_atr:1.5,min_conf:0.65},{tp_atr:0.6,sl_atr:1.0,min_conf:0.75}],
  high_vol: [{tp_atr:2.0,sl_atr:2.5,min_conf:0.65},{tp_atr:1.5,sl_atr:2.0,min_conf:0.70},{tp_atr:3.0,sl_atr:3.0,min_conf:0.60}],
};

interface BS { n: number; totalReward: number; }

export function selectParams(regime: string, stats: Record<string, BS>): { params: Arm; armIdx: number } {
  const arms = ARMS[regime] || ARMS.choppy;
  const keys = arms.map((_, i) => `${regime}:${i}`);
  const totalN = keys.reduce((s, k) => s + (stats[k]?.n || 0), 0);
  if (totalN === 0) { const i = Math.floor(Math.random()*arms.length); return { params: arms[i], armIdx: i }; }
  let bi = 0, bu = -Infinity;
  for (let i = 0; i < arms.length; i++) {
    const s = stats[keys[i]];
    if (!s || s.n === 0) return { params: arms[i], armIdx: i };
    const u = s.totalReward/s.n + Math.sqrt(2*Math.log(totalN+1)/s.n);
    if (u > bu) { bu = u; bi = i; }
  }
  return { params: arms[bi], armIdx: bi };
}

export function updateBandit(cur: BS | undefined, reward: number): BS {
  const s = cur || { n: 0, totalReward: 0 };
  return { n: s.n + 1, totalReward: s.totalReward + reward };
}   