// 新品時に模様がほとんど無いマスは比べようがないので判定不能にする。
// しきい値 = max(絶対下限, 靴底内の基準の模様の強さの中央値 × 比率)
// 絶対下限 0.3 の根拠(合成靴底での実測、模様なしの靴底でマスに出る値の最大):
//   靴底の外をマスクする前は、縁の輪郭が漏れ込んで 0.24。マスク後は形がテンプレートどおりなら 0.005。
//   ただし実物の靴底がテンプレートより細いと輪郭がマスクの内側に入り、幅0.95倍で 0.07、0.92倍で 0.11、0.88倍で 0.56。
//   0.3 なら幅0.92倍のずれまで約3倍の余裕があり、本物の模様(実測 約1.5)よりは十分下。0.15 だと 0.92倍で余裕1.4倍しかない。
export const MIN_TEXTURE_ABS = 0.3;
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
    // ここでは 0〜1 に収めない。マスごとに切ると ± の揺れが + 側にだけ残り、平均が上ずる。
    return 1 - now / base;
  });
}
