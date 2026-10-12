export const CELL = 10;

export function sobelMagnitude(img) {
  const { width: W, height: H, data: d } = img;
  const out = new Float32Array(W * H).fill(NaN);
  for (let y = 1; y < H - 1; y++) {
    for (let x = 1; x < W - 1; x++) {
      const i = y * W + x;
      const a = d[i - W - 1], b = d[i - W], c = d[i - W + 1];
      const l = d[i - 1], r = d[i + 1];
      const e = d[i + W - 1], f = d[i + W], g = d[i + W + 1];
      const gx = (c + 2 * r + g) - (a + 2 * l + e);
      const gy = (e + 2 * f + g) - (a + 2 * b + c);
      out[i] = Math.hypot(gx, gy); // NaN はそのまま伝わる
    }
  }
  return { width: W, height: H, data: out };
}

// マスごとの平均 = 模様の強さ。有効画素が 8割未満のマスは NaN。
export function cellTexture(mag, cell = CELL) {
  const { width: W, height: H, data } = mag;
  const cols = Math.floor(W / cell);
  const rows = Math.floor(H / cell);
  const values = new Float64Array(cols * rows);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      let sum = 0;
      let n = 0;
      for (let y = r * cell; y < (r + 1) * cell; y++) {
        for (let x = c * cell; x < (c + 1) * cell; x++) {
          const v = data[y * W + x];
          if (!Number.isNaN(v)) { sum += v; n++; }
        }
      }
      values[r * cols + c] = n >= 0.8 * cell * cell ? sum / n : NaN;
    }
  }
  return { cols, rows, values };
}
