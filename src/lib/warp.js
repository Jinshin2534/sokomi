import { pointsToSole, invertHomography, applyHomography } from './homography.js';

export const WARP_W = 120;
export const WARP_H = 300;
const SUB = 3; // 1画素あたり 3×3 の副標本で平均（縮小時のエイリアシング対策）

export function luminance(image) {
  const { width, height, data } = image;
  const out = new Float32Array(width * height);
  for (let i = 0, k = 0; i < out.length; i++, k += 4) {
    out[i] = 0.299 * data[k] + 0.587 * data[k + 1] + 0.114 * data[k + 2];
  }
  return { width, height, data: out };
}

// 画素中心は (px+0.5, py+0.5)。写真の外なら NaN。
function sampleBilinear(g, x, y) {
  const fx = x - 0.5;
  const fy = y - 0.5;
  const x0 = Math.floor(fx);
  const y0 = Math.floor(fy);
  if (x0 < 0 || y0 < 0 || x0 + 1 >= g.width || y0 + 1 >= g.height) return NaN;
  const tx = fx - x0;
  const ty = fy - y0;
  const i = y0 * g.width + x0;
  const d = g.data;
  const top = d[i] * (1 - tx) + d[i + 1] * tx;
  const bottom = d[i + g.width] * (1 - tx) + d[i + g.width + 1] * tx;
  return top * (1 - ty) + bottom * ty;
}

export function warpToSole(image, points, W = WARP_W, H = WARP_H) {
  const g = luminance(image);
  const inv = invertHomography(pointsToSole(points));
  const out = new Float32Array(W * H);
  for (let j = 0; j < H; j++) {
    for (let i = 0; i < W; i++) {
      let sum = 0;
      let bad = false;
      for (let sy = 0; sy < SUB && !bad; sy++) {
        for (let sx = 0; sx < SUB; sx++) {
          const u = (i + (sx + 0.5) / SUB) / W;
          const v = (j + (sy + 0.5) / SUB) / H;
          const [x, y] = applyHomography(inv, [u, v]);
          const s = sampleBilinear(g, x, y);
          if (Number.isNaN(s)) { bad = true; break; }
          sum += s;
        }
      }
      out[j * W + i] = bad ? NaN : sum / (SUB * SUB);
    }
  }
  return { width: W, height: H, data: out };
}
