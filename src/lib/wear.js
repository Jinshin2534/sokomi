// 新品時に模様がほとんど無いマスは比べようがないので判定不能にする。
// しきい値 = max(絶対下限, 靴底内の基準の模様の強さの中央値 × 比率)
export const MIN_TEXTURE_ABS = 0.3; // 靴底の縁の輪郭がマスに漏れ込む量(実測 最大0.24)を超え、本物の模様(実測 約1.5〜2)よりずっと下
export const MIN_TEXTURE_REL = 0.25;

function median(xs) {
  if (xs.length === 0) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

export function cellWear(baseValues, nowValues, inSole) {
  const inside = [];
  for (let i = 0; i < baseValues.length; i++) {
    if (inSole[i] && Number.isFinite(baseValues[i])) inside.push(baseValues[i]);
  }
  const threshold = Math.max(MIN_TEXTURE_ABS, MIN_TEXTURE_REL * median(inside));
  return Array.from(baseValues, (base, i) => {
    const now = nowValues[i];
    if (!inSole[i] || !Number.isFinite(base) || !Number.isFinite(now) || base < threshold) return null;
    return Math.min(1, Math.max(0, 1 - now / base));
  });
}
