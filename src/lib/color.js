const STOPS = [
  [0, [46, 160, 90]],
  [0.5, [230, 190, 40]],
  [1, [210, 60, 50]],
];

// すり減り度 0〜1 を 緑→黄→赤 に。判定不能 (null) は null。
export function wearColor(w) {
  if (w == null) return null;
  const t = Math.min(1, Math.max(0, w));
  const [a, b] = t <= 0.5 ? [STOPS[0], STOPS[1]] : [STOPS[1], STOPS[2]];
  const k = (t - a[0]) / (b[0] - a[0]);
  const c = a[1].map((x, i) => Math.round(x + (b[1][i] - x) * k));
  return `rgb(${c.join(', ')})`;
}
