import { describe, it, expect } from 'vitest';
import { soleHalfWidth, insideSole, cellMask, maskOutsideSole } from '../src/lib/mask.js';
import { cellWear } from '../src/lib/wear.js';
import { REGIONS, aggregate } from '../src/lib/regions.js';
import { wearColor } from '../src/lib/color.js';

describe('靴底テンプレート', () => {
  it('つま先とかかとで幅0、最大幅は v=0.35 で 0.5', () => {
    expect(soleHalfWidth(0)).toBe(0);
    expect(soleHalfWidth(1)).toBe(0);
    expect(soleHalfWidth(0.35)).toBeCloseTo(0.5);
    expect(soleHalfWidth(0.6)).toBeCloseTo(0.36);
  });

  it('つなぎ目で連続', () => {
    for (const v of [0.35, 0.6, 0.85]) {
      expect(Math.abs(soleHalfWidth(v - 1e-6) - soleHalfWidth(v + 1e-6))).toBeLessThan(1e-3);
    }
  });

  it('内外判定', () => {
    expect(insideSole(0.5, 0.5)).toBe(true);
    expect(insideSole(0.02, 0.9)).toBe(false);
  });

  it('cellMask は左右対称で、1行目は空、中央は入る', () => {
    const m = cellMask(12, 30);
    expect(m.slice(0, 12).every((x) => !x)).toBe(true);
    expect(m[10 * 12 + 6]).toBe(true);
    for (let r = 0; r < 30; r++) for (let c = 0; c < 12; c++) {
      expect(m[r * 12 + c]).toBe(m[r * 12 + (11 - c)]);
    }
    const n = m.filter(Boolean).length;
    expect(n).toBeGreaterThan(120);
    expect(n).toBeLessThan(300);
  });
});

describe('maskOutsideSole', () => {
  it('画素中心が靴底テンプレートの外なら NaN、内側はそのまま、元の画像は変えない', () => {
    const W = 120, H = 300;
    const g = { width: W, height: H, data: new Float32Array(W * H).fill(100) };
    const m = maskOutsideSole(g);
    expect(m.width).toBe(W);
    expect(m.height).toBe(H);
    expect(Number.isNaN(m.data[0])).toBe(true);                    // 左上の角
    expect(Number.isNaN(m.data[290 * W + 2])).toBe(true);          // かかと付近の内側の外
    expect(m.data[150 * W + 60]).toBe(100);                         // 中央
    expect(g.data[0]).toBe(100);
    let wrong = 0;
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
      const inside = insideSole((i + 0.5) / W, (j + 0.5) / H, 1);
      if (Number.isNaN(m.data[j * W + i]) === inside) wrong++;
    }
    expect(wrong).toBe(0);
  });
});

describe('cellWear', () => {
  it('1 − 今/基準 をそのまま返す(増えたら負)。模様が無い基準・欠損・靴底外は null', () => {
    const base = Float64Array.from([1, 1, 0.01, 1, 1]);
    const now = Float64Array.from([0.5, 2, 0.01, NaN, 0]);
    const inSole = [true, true, true, true, false];
    expect(cellWear(base, now, inSole)).toEqual([0.5, -1, null, null, null]);
  });

  it('基準が全部平らなら全部 null', () => {
    const base = Float64Array.from([0.01, 0.02, 0.01]);
    const now = Float64Array.from([0, 0, 0]);
    expect(cellWear(base, now, [true, true, true])).toEqual([null, null, null]);
  });
});

describe('aggregate', () => {
  const cols = 12;
  const rows = 30;
  const all = new Array(cols * rows).fill(true);
  const regionOf = (i) => {
    const u = ((i % cols) + 0.5) / cols;
    const v = (Math.floor(i / cols) + 0.5) / rows;
    return REGIONS.find((r) => r.test(u, v)).id;
  };

  it('部位ごとの平均と全体', () => {
    const wear = all.map((_, i) => (regionOf(i) === 'heelOut' ? 0.9 : 0.1));
    const res = aggregate(wear, all, cols, rows);
    const byId = Object.fromEntries(res.regions.map((r) => [r.id, r]));
    expect(byId.heelOut.mean).toBeCloseTo(0.9);
    expect(byId.toe.mean).toBeCloseTo(0.1);
    expect(byId.heelOut.coverage).toBe(1);
    expect(res.overall).toBeCloseTo((60 * 0.9 + 300 * 0.1) / 360);
    expect(res.regions.map((r) => r.label)).toEqual(['つま先', '母趾球', '小趾側', '土踏まず', 'かかと内', 'かかと外']);
  });

  it('±の揺れは平均で打ち消し合い、平均してから 0〜1 に収める', () => {
    const noise = all.map((_, i) => (i % 2 ? 0.1 : -0.1));
    const res = aggregate(noise, all, cols, rows);
    expect(res.overall).toBeCloseTo(0, 9);
    for (const r of res.regions) expect(Math.abs(r.mean)).toBeLessThan(0.02);
    const neg = aggregate(all.map(() => -0.3), all, cols, rows);
    expect(neg.overall).toBe(0);
    expect(neg.regions.every((r) => r.mean === 0)).toBe(true);
    const over = aggregate(all.map(() => 1.4), all, cols, rows);
    expect(over.overall).toBe(1);
    expect(over.regions.every((r) => r.mean === 1)).toBe(true);
  });

  it('判定可能が 30% 未満の部位は null', () => {
    const wear = all.map((_, i) => (regionOf(i) === 'arch' ? null : 0.2));
    const res = aggregate(wear, all, cols, rows);
    const arch = res.regions.find((r) => r.id === 'arch');
    expect(arch.mean).toBeNull();
    expect(arch.coverage).toBe(0);
    expect(res.overall).toBeCloseTo(0.2);
  });

  it('全体の判定可能が 25% 未満なら全体も null', () => {
    const wear = all.map((_, i) => (i < 10 ? 0.5 : null));
    expect(aggregate(wear, all, cols, rows).overall).toBeNull();
  });

  it('靴底外のマスは数えない', () => {
    const inSole = all.map((_, i) => regionOf(i) !== 'toe');
    const wear = all.map(() => 0.3);
    const res = aggregate(wear, inSole, cols, rows);
    const toe = res.regions.find((r) => r.id === 'toe');
    expect(toe.mean).toBeNull();
    expect(toe.coverage).toBe(0);
  });
});

describe('wearColor', () => {
  it('緑→黄→赤、null は null', () => {
    expect(wearColor(0)).toBe('rgb(46, 160, 90)');
    expect(wearColor(0.5)).toBe('rgb(230, 190, 40)');
    expect(wearColor(1)).toBe('rgb(210, 60, 50)');
    expect(wearColor(null)).toBeNull();
  });
});
