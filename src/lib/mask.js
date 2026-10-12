// 正規化座標 (u: 0=内側〜1=外側, v: 0=つま先〜1=かかと) での靴底の半幅。
const lerpCos = (a, b, t) => a + (b - a) * (1 - Math.cos(Math.PI * t)) / 2;

export function soleHalfWidth(v) {
  if (v <= 0 || v >= 1) return 0;
  if (v < 0.35) {
    const t = (0.35 - v) / 0.35;
    return 0.5 * Math.sqrt(1 - t * t);
  }
  if (v < 0.6) return lerpCos(0.5, 0.36, (v - 0.35) / 0.25);
  if (v < 0.85) return lerpCos(0.36, 0.38, (v - 0.6) / 0.25);
  const t = (v - 0.85) / 0.15;
  return 0.38 * Math.sqrt(1 - t * t);
}

export function insideSole(u, v, shrink = 1) {
  return Math.abs(u - 0.5) <= soleHalfWidth(v) * shrink;
}

// 靴底の縁と背景の境目は強いエッジだがすり減らない。混ぜないよう縮めた輪郭の内側だけ使う。
export const MASK_SHRINK = 0.9;

export function cellMask(cols, rows, shrink = MASK_SHRINK) {
  const out = new Array(cols * rows);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const u0 = c / cols, u1 = (c + 1) / cols;
      const v0 = r / rows, v1 = (r + 1) / rows;
      out[r * cols + c] = [[u0, v0], [u1, v0], [u0, v1], [u1, v1]].every(([u, v]) => insideSole(u, v, shrink));
    }
  }
  return out;
}
