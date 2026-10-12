import { describe, it, expect } from 'vitest';
import {
  SOLE_TARGETS, solveHomography, applyHomography, invertHomography, checkPoints, pointsToSole, pointsOrientation,
} from '../src/lib/homography.js';

const PTS = [[200, 50], [200, 750], [60, 295], [340, 295]];

describe('homography', () => {
  it('4点を正規化座標へ写す', () => {
    const H = pointsToSole(PTS);
    PTS.forEach((p, i) => {
      const [u, v] = applyHomography(H, p);
      expect(u).toBeCloseTo(SOLE_TARGETS[i][0], 9);
      expect(v).toBeCloseTo(SOLE_TARGETS[i][1], 9);
    });
  });

  it('逆変換で元に戻る', () => {
    const H = pointsToSole(PTS);
    const inv = invertHomography(H);
    const [x, y] = applyHomography(inv, applyHomography(H, [123, 456]));
    expect(x).toBeCloseTo(123, 6);
    expect(y).toBeCloseTo(456, 6);
  });

  it('射影的な歪みも解ける', () => {
    const src = [[0, 0], [10, 0], [10, 10], [0, 10]];
    const dst = [[1, 1], [5, 0], [6, 7], [0, 4]];
    const H = solveHomography(src, dst);
    src.forEach((p, i) => {
      const q = applyHomography(H, p);
      expect(q[0]).toBeCloseTo(dst[i][0], 9);
      expect(q[1]).toBeCloseTo(dst[i][1], 9);
    });
  });

  it('左右反転した配置(反対の足)でも通る', () => {
    const mirrored = PTS.map(([x, y]) => [400 - x, y]);
    expect(() => pointsToSole(mirrored)).not.toThrow();
  });

  it('内側と外側が同じ側なら degenerate', () => {
    expect(() => checkPoints([[200, 50], [200, 750], [60, 295], [100, 300]])).toThrow('degenerate');
  });

  it('幅の点が一直線上なら degenerate', () => {
    expect(() => checkPoints([[200, 50], [200, 750], [200, 300], [201, 300]])).toThrow('degenerate');
  });

  it('つま先とかかとが同じ点なら degenerate', () => {
    expect(() => checkPoints([[200, 50], [200, 50], [60, 295], [340, 295]])).toThrow('degenerate');
  });

  it('幅の点がつま先より先なら degenerate', () => {
    expect(() => checkPoints([[200, 50], [200, 750], [60, 20], [340, 295]])).toThrow('degenerate');
  });

  it('pointsOrientation: 左右反転した配置では符号が逆', () => {
    const mirrored = PTS.map(([x, y]) => [400 - x, y]);
    const a = pointsOrientation(PTS);
    const b = pointsOrientation(mirrored);
    expect([1, -1]).toContain(a);
    expect(b).toBe(-a);
  });

  it('pointsOrientation: 内側と外側を入れ替えても符号が逆', () => {
    const swapped = [PTS[0], PTS[1], PTS[3], PTS[2]];
    expect(pointsOrientation(swapped)).toBe(-pointsOrientation(PTS));
  });
});
