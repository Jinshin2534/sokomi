import { pointsToSole, applyHomography } from './homography.js';
import { insideSole } from './mask.js';

export const DEMO_POINTS = [[200, 50], [200, 750], [60, 295], [340, 295]];

// 靴底を模した画像。v 方向に 30 本の溝(角の立った縞)。amp(u,v) は模様の残り具合 0〜1。
export function makeSoleImage({ width = 400, height = 800, points = DEMO_POINTS, amp = () => 1, gain = 1 } = {}) {
  const H = pointsToSole(points);
  const data = new Uint8ClampedArray(width * height * 4);
  const k4 = Math.tanh(4);
  for (let py = 0; py < height; py++) {
    for (let px = 0; px < width; px++) {
      const [u, v] = applyHomography(H, [px + 0.5, py + 0.5]);
      let val = 40;
      if (insideSole(u, v)) {
        const s = Math.tanh(4 * Math.sin(2 * Math.PI * v * 30)) / k4;
        val = 128 + 60 * amp(u, v) * s;
      }
      val *= gain;
      const k = (py * width + px) * 4;
      data[k] = data[k + 1] = data[k + 2] = val;
      data[k + 3] = 255;
    }
  }
  return { width, height, data };
}

export function transformPoints(points, { angle = 0, scale = 1, center = [200, 400], offset = [0, 0] } = {}) {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return points.map(([x, y]) => {
    const dx = (x - center[0]) * scale;
    const dy = (y - center[1]) * scale;
    return [center[0] + offset[0] + dx * c - dy * s, center[1] + offset[1] + dx * s + dy * c];
  });
}

const clamp01 = (x) => Math.min(1, Math.max(0, x));

// デモ用: かかと外側ほど強く、つま先も少しすり減った靴
export function DEMO_WEAR(u, v) {
  const heel = clamp01((v - 0.6) / 0.4) * clamp01((u - 0.35) / 0.5);
  const toe = v < 0.15 ? 0.3 : 0;
  return clamp01(1 - 0.9 * heel - toe);
}
