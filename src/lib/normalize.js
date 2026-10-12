// 照明のゲイン(明るさ・露出)とゆるい陰影を消すため、広い窓の局所平均で割る。
// 局所標準偏差では割らない: すり減って平らな所のノイズを増幅して、すり減りが見えなくなる。
export function illuminationNormalize(gray, radius = 15, floor = 8) {
  const { width: W, height: H, data } = gray;
  const S = new Float64Array((W + 1) * (H + 1));
  const N = new Float64Array((W + 1) * (H + 1));
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const v = data[y * W + x];
      const ok = !Number.isNaN(v);
      const k = (y + 1) * (W + 1) + (x + 1);
      S[k] = (ok ? v : 0) + S[k - 1] + S[k - (W + 1)] - S[k - (W + 1) - 1];
      N[k] = (ok ? 1 : 0) + N[k - 1] + N[k - (W + 1)] - N[k - (W + 1) - 1];
    }
  }
  const box = (A, x0, y0, x1, y1) =>
    A[y1 * (W + 1) + x1] - A[y0 * (W + 1) + x1] - A[y1 * (W + 1) + x0] + A[y0 * (W + 1) + x0];
  const out = new Float32Array(W * H);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const v = data[y * W + x];
      if (Number.isNaN(v)) { out[y * W + x] = NaN; continue; }
      const x0 = Math.max(0, x - radius);
      const x1 = Math.min(W, x + radius + 1);
      const y0 = Math.max(0, y - radius);
      const y1 = Math.min(H, y + radius + 1);
      const mean = box(S, x0, y0, x1, y1) / box(N, x0, y0, x1, y1);
      out[y * W + x] = v / Math.max(mean, floor);
    }
  }
  return { width: W, height: H, data: out };
}
