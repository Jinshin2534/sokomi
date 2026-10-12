import { insideSole, soleHalfWidth, MASK_SHRINK } from './mask.js';

// 靴底の縁の帯: テンプレートの半幅の 0.85〜1.15 倍。縁は歩いてもすり減らないので、
// ここのくっきり具合はすり減りに左右されずピントだけを映す。
const BAND_IN = 0.85;
const BAND_OUT = 1.15;

function inBand(u, v) {
  const w = soleHalfWidth(v);
  const a = Math.abs(u - 0.5);
  return w > 0 && a >= BAND_IN * w && a <= BAND_OUT * w;
}

// 正規化前・マスク前の靴底画像の統計。
// mean / clipped は靴底の内側(縮めた輪郭)で、sharp = 平均|ラプラシアン| / 平均|勾配| は縁の帯で測る。
// sharp は模様の量に左右されにくく、エッジがぼけると下がる。
export function photoStats(gray) {
  const { width: W, height: H, data: d } = gray;
  let sum = 0, n = 0, lap = 0, grad = 0, clipped = 0;
  for (let y = 1; y < H - 1; y++) {
    for (let x = 1; x < W - 1; x++) {
      const u = (x + 0.5) / W;
      const v = (y + 0.5) / H;
      const inner = insideSole(u, v, MASK_SHRINK);
      const band = inBand(u, v);
      if (!inner && !band) continue;
      const i = y * W + x;
      const c = d[i], l = d[i - 1], r = d[i + 1], t = d[i - W], b = d[i + W];
      if ([c, l, r, t, b].some(Number.isNaN)) continue;
      if (inner) {
        sum += c;
        n++;
        if (c >= 250 || c <= 5) clipped++;
      }
      if (band) {
        lap += Math.abs(4 * c - l - r - t - b);
        grad += Math.hypot(r - l, b - t);
      }
    }
  }
  return { mean: n ? sum / n : 0, sharp: grad > 0 ? lap / grad : 0, clipped: n ? clipped / n : 0 };
}

const LEVELS = ['高', '中', '低'];

// しきい値は合成靴底での実測(今/新品時の sharp 比)から:
//   同じ写真 1.00 / すり減り(かかと外を消す) 1.00 / 全部すり減り 1.06 / 半分の解像度 0.89
//   ぼかし 半径1×1回 0.83 / 半径2×1回 0.63 / 半径4×3回 0.35
export const SHARP_LOW = 0.6;
export const SHARP_MID = 0.8;
export const CLIP_MAX = 0.2;

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
    if (sharp < SHARP_LOW) raise(2, 'ピントが甘いか、手ブレしています');
    else if (sharp < SHARP_MID) raise(1, 'ややピントが甘いです');
  }

  if (base.clipped > CLIP_MAX) raise(1, '新品時の写真に白飛び・黒つぶれが多いです');
  if (now.clipped > CLIP_MAX) raise(1, '今の写真に白飛び・黒つぶれが多いです');

  return { level: LEVELS[level], reasons };
}
