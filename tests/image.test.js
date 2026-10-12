import { describe, it, expect } from 'vitest';
import { luminance, warpToSole } from '../src/lib/warp.js';
import { illuminationNormalize } from '../src/lib/normalize.js';
import { sobelMagnitude, cellTexture } from '../src/lib/texture.js';
import { pointsToSole, invertHomography, applyHomography } from '../src/lib/homography.js';

const PTS = [[200, 50], [200, 750], [60, 295], [340, 295]];

function rgbaFrom(width, height, f) {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const v = f(x, y);
    const k = (y * width + x) * 4;
    data[k] = data[k + 1] = data[k + 2] = v;
    data[k + 3] = 255;
  }
  return { width, height, data };
}

function grayFrom(width, height, f) {
  const data = new Float32Array(width * height);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) data[y * width + x] = f(x, y);
  return { width, height, data };
}

describe('luminance', () => {
  it('赤は 0.299 倍', () => {
    const img = { width: 1, height: 1, data: new Uint8ClampedArray([255, 0, 0, 255]) };
    expect(luminance(img).data[0]).toBeCloseTo(0.299 * 255, 3);
  });
});

describe('warpToSole', () => {
  it('120×300 で、写真の値を正しい位置から拾う', () => {
    // 画素 px の値 = 50 + 0.2*(px+0.5) → 連続座標 x での値は 50 + 0.2x
    const img = rgbaFrom(400, 800, (x) => 50 + 0.2 * (x + 0.5));
    const g = warpToSole(img, PTS);
    expect(g.width).toBe(120);
    expect(g.height).toBe(300);
    const inv = invertHomography(pointsToSole(PTS));
    for (const [i, j] of [[60, 150], [10, 100], [100, 250]]) {
      const [x] = applyHomography(inv, [(i + 0.5) / 120, (j + 0.5) / 300]);
      expect(Math.abs(g.data[j * 120 + i] - (50 + 0.2 * x))).toBeLessThan(0.6);
    }
  });

  it('写真の外にはみ出した所は NaN', () => {
    const img = rgbaFrom(400, 400, () => 100);
    const g = warpToSole(img, PTS);
    expect(Number.isNaN(g.data[299 * 120 + 60])).toBe(true);
    expect(Number.isNaN(g.data[20 * 120 + 60])).toBe(false);
  });
});

describe('illuminationNormalize', () => {
  it('明るさを何倍にしても結果は同じ', () => {
    const a = grayFrom(40, 40, (x, y) => 100 + 40 * Math.sin(x * 0.7) * Math.cos(y * 0.3));
    const b = grayFrom(40, 40, (x, y) => 0.5 * a.data[y * 40 + x]);
    const na = illuminationNormalize(a);
    const nb = illuminationNormalize(b);
    for (let i = 0; i < na.data.length; i++) expect(nb.data[i]).toBeCloseTo(na.data[i], 5);
  });

  it('NaN は NaN のまま、周りは有限', () => {
    const g = grayFrom(20, 20, () => 100);
    g.data[5 * 20 + 5] = NaN;
    const n = illuminationNormalize(g);
    expect(Number.isNaN(n.data[5 * 20 + 5])).toBe(true);
    expect(n.data[5 * 20 + 6]).toBeCloseTo(1, 6);
  });
});

describe('sobelMagnitude / cellTexture', () => {
  it('縦の段差で勾配 40、平らな所は 0、縁は NaN', () => {
    const g = grayFrom(5, 5, (x) => (x < 2 ? 0 : 10));
    const m = sobelMagnitude(g);
    expect(m.data[2 * 5 + 1]).toBeCloseTo(40);
    expect(m.data[2 * 5 + 2]).toBeCloseTo(40);
    expect(m.data[2 * 5 + 3]).toBeCloseTo(0);
    expect(Number.isNaN(m.data[0])).toBe(true);
  });

  it('マスの平均、NaN が 2割を超えるマスは NaN', () => {
    const m = grayFrom(20, 20, () => 2);
    for (let y = 0; y < 10; y++) for (let x = 10; x < 13; x++) m.data[y * 20 + x] = NaN; // 30%
    const t = cellTexture(m, 10);
    expect(t.cols).toBe(2);
    expect(t.rows).toBe(2);
    expect(t.values[0]).toBeCloseTo(2);
    expect(Number.isNaN(t.values[1])).toBe(true);
    expect(t.values[2]).toBeCloseTo(2);
  });
});
