// 4点の対応から射影変換 (3x3, 行優先 9要素) を求める。
// 点の順番は [つま先, かかと, 内側の最大幅, 外側の最大幅]。
export const SOLE_TARGETS = [
  [0.5, 0],
  [0.5, 1],
  [0, 0.35],
  [1, 0.35],
];

export function solveHomography(src, dst) {
  const A = [];
  const b = [];
  for (let i = 0; i < 4; i++) {
    const [x, y] = src[i];
    const [X, Y] = dst[i];
    A.push([x, y, 1, 0, 0, 0, -X * x, -X * y]);
    b.push(X);
    A.push([0, 0, 0, x, y, 1, -Y * x, -Y * y]);
    b.push(Y);
  }
  return [...solveLinear(A, b), 1];
}

// 部分ピボット付きガウス・ジョルダン消去
function solveLinear(A, b) {
  const n = b.length;
  const M = A.map((row, i) => [...row, b[i]]);
  for (let c = 0; c < n; c++) {
    let p = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    if (Math.abs(M[p][c]) < 1e-12) throw new Error('degenerate');
    [M[c], M[p]] = [M[p], M[c]];
    for (let r = 0; r < n; r++) {
      if (r === c) continue;
      const f = M[r][c] / M[c][c];
      for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k];
    }
  }
  return M.map((row, i) => row[n] / row[i]);
}

export function applyHomography(H, [x, y]) {
  const w = H[6] * x + H[7] * y + H[8];
  return [(H[0] * x + H[1] * y + H[2]) / w, (H[3] * x + H[4] * y + H[5]) / w];
}

// 余因子行列 / 行列式。射影変換は定数倍に意味がないので正規化はしない。
export function invertHomography(H) {
  const [a, b, c, d, e, f, g, h, i] = H;
  const A = e * i - f * h;
  const B = -(d * i - f * g);
  const C = d * h - e * g;
  const det = a * A + b * B + c * C;
  if (det === 0 || !Number.isFinite(det)) throw new Error('degenerate');
  return [
    A, -(b * i - c * h), b * f - c * e,
    B, a * i - c * g, -(a * f - c * d),
    C, -(a * h - b * g), a * e - b * d,
  ].map((v) => v / det);
}

// 内側と外側の点が「つま先→かかと」の線の両側に、線の途中の高さで打たれているか。
export function checkPoints(points) {
  const [toe, heel, inner, outer] = points;
  const ax = heel[0] - toe[0];
  const ay = heel[1] - toe[1];
  const len2 = ax * ax + ay * ay;
  if (len2 < 1) throw new Error('degenerate');
  const side = (p) => (ax * (p[1] - toe[1]) - ay * (p[0] - toe[0])) / len2;
  const along = (p) => (ax * (p[0] - toe[0]) + ay * (p[1] - toe[1])) / len2;
  const si = side(inner);
  const so = side(outer);
  if (Math.abs(si) < 0.05 || Math.abs(so) < 0.05 || Math.sign(si) === Math.sign(so)) {
    throw new Error('degenerate');
  }
  for (const p of [inner, outer]) {
    const t = along(p);
    if (t < 0.05 || t > 0.95) throw new Error('degenerate');
  }
}

export function pointsToSole(points) {
  checkPoints(points);
  return solveHomography(points, SOLE_TARGETS);
}
