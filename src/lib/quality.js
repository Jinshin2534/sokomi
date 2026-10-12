import { insideSole, MASK_SHRINK } from './mask.js';

// 正規化前の靴底画像の統計。sharp = 平均|ラプラシアン| / 平均|勾配|。
// 模様の量には左右されにくく、エッジがぼけると下がる（すり減りとピント甘さを分けるため）。
export function photoStats(gray) {
  const { width: W, height: H, data: d } = gray;
  let sum = 0, n = 0, lap = 0, grad = 0, clipped = 0;
  for (let y = 1; y < H - 1; y++) {
    for (let x = 1; x < W - 1; x++) {
      if (!insideSole((x + 0.5) / W, (y + 0.5) / H, MASK_SHRINK)) continue;
      const i = y * W + x;
      const c = d[i], l = d[i - 1], r = d[i + 1], t = d[i - W], b = d[i + W];
      if ([c, l, r, t, b].some(Number.isNaN)) continue;
      sum += c;
      n++;
      if (c >= 250 || c <= 5) clipped++;
      lap += Math.abs(4 * c - l - r - t - b);
      grad += Math.hypot(r - l, b - t);
    }
  }
  return { mean: n ? sum / n : 0, sharp: grad > 0 ? lap / grad : 0, clipped: n ? clipped / n : 0 };
}

const LEVELS = ['高', '中', '低'];

export function compareQuality(baseGray, nowGray) {
  const base = photoStats(baseGray);
  const now = photoStats(nowGray);
  const reasons = [];
  let level = 0;
  const raise = (to, reason) => { level = Math.max(level, to); reasons.push(reason); };

  const bright = base.mean > 0 ? now.mean / base.mean : 1;
  if (bright < 0.5) raise(2, '今の写真が新品時よりかなり暗いです');
  else if (bright < 0.7) raise(1, '今の写真が新品時より少し暗いです');
  else if (bright > 2) raise(2, '今の写真が新品時よりかなり明るいです');
  else if (bright > 1.4) raise(1, '今の写真が新品時より少し明るいです');

  if (base.sharp > 0 && now.sharp > 0) {
    const sharp = now.sharp / base.sharp;
    if (sharp < 0.6) raise(2, 'ピントが甘いか、手ブレしています');
    else if (sharp < 0.8) raise(1, 'ややピントが甘いです');
  }

  if (now.clipped > 0.2) raise(1, '白飛び・黒つぶれが多いです');

  return { level: LEVELS[level], reasons };
}
