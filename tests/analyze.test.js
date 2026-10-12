import { describe, it, expect } from 'vitest';
import { analyze } from '../src/lib/analyze.js';
import { makeSoleImage, transformPoints, DEMO_POINTS } from '../src/lib/synth.js';

const worn = (u, v) => {
  if (v >= 0.68 && u >= 0.5) return 0; // かかと外: 模様が消えた
  if (v < 0.18) return 0.5;            // つま先: 半分
  return 1;
};
const byId = (res) => Object.fromEntries(res.regions.map((r) => [r.id, r.mean]));

function boxBlur(img, radius, times) {
  let { data } = img;
  const { width: W, height: H } = img;
  for (let t = 0; t < times; t++) {
    for (const horizontal of [true, false]) {
      const out = new Uint8ClampedArray(data.length);
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        let s = 0, n = 0;
        for (let d = -radius; d <= radius; d++) {
          const xx = horizontal ? x + d : x;
          const yy = horizontal ? y : y + d;
          if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue;
          s += data[(yy * W + xx) * 4];
          n++;
        }
        const k = (y * W + x) * 4;
        out[k] = out[k + 1] = out[k + 2] = s / n;
        out[k + 3] = 255;
      }
      data = out;
    }
  }
  return { width: W, height: H, data };
}

const base = makeSoleImage();

describe('analyze', () => {
  it('消した所は高く、半分の所は約半分、触っていない所は低い', () => {
    const res = analyze(base, DEMO_POINTS, makeSoleImage({ amp: worn }), DEMO_POINTS);
    const m = byId(res);
    expect(m.heelOut).toBeGreaterThan(0.8);
    expect(m.toe).toBeGreaterThan(0.35);
    expect(m.toe).toBeLessThan(0.65);
    expect(m.ball).toBeLessThan(0.1);
    expect(m.arch).toBeLessThan(0.1);
    expect(m.heelIn).toBeLessThan(0.15);
    expect(res.overall).toBeGreaterThan(0.1);
    expect(res.overall).toBeLessThan(0.4);
    expect(res.cols).toBe(12);
    expect(res.rows).toBe(30);
    expect(res.cells).toHaveLength(360);
  });

  it('同じ写真同士なら全部ほぼ 0、信頼度は高', () => {
    const res = analyze(base, DEMO_POINTS, base, DEMO_POINTS);
    expect(res.overall).toBeLessThan(0.02);
    expect(res.quality.level).toBe('高');
  });

  it('今の写真が暗くても (×0.6) すり減りは出ない', () => {
    const res = analyze(base, DEMO_POINTS, makeSoleImage({ gain: 0.6 }), DEMO_POINTS);
    for (const v of Object.values(byId(res))) expect(v).toBeLessThan(0.1);
  });

  it('回転・縮小して撮っても結果はほぼ同じ', () => {
    const pts = transformPoints(DEMO_POINTS, { angle: (20 * Math.PI) / 180, scale: 0.8, offset: [100, 50] });
    const straight = byId(analyze(base, DEMO_POINTS, makeSoleImage({ amp: worn }), DEMO_POINTS));
    const rotated = byId(analyze(base, DEMO_POINTS, makeSoleImage({ width: 600, height: 900, points: pts, amp: worn }), pts));
    for (const id of Object.keys(straight)) expect(Math.abs(rotated[id] - straight[id])).toBeLessThan(0.1);
  });

  it('新品時に模様が無い部位は判定不能', () => {
    const flatArch = (u, v) => (v >= 0.42 && v < 0.68 ? 0 : 1);
    const b = makeSoleImage({ amp: flatArch });
    const res = analyze(b, DEMO_POINTS, b, DEMO_POINTS);
    expect(byId(res).arch).toBeNull();
    expect(byId(res).toe).not.toBeNull();
  });

  it('新品時に模様がまったく無ければ全体も判定不能', () => {
    const b = makeSoleImage({ amp: () => 0 });
    const res = analyze(b, DEMO_POINTS, b, DEMO_POINTS);
    expect(res.overall).toBeNull();
    expect(res.cells.every((c) => c === null)).toBe(true);
  });

  it('暗すぎる写真は信頼度が低く、理由が返る', () => {
    const res = analyze(base, DEMO_POINTS, makeSoleImage({ gain: 0.35 }), DEMO_POINTS);
    expect(res.quality.level).toBe('低');
    expect(res.quality.reasons.join()).toContain('暗');
  });

  it('ぼけた写真は信頼度が下がり、ピントの理由が返る', () => {
    const res = analyze(base, DEMO_POINTS, boxBlur(base, 4, 3), DEMO_POINTS);
    expect(res.quality.level).not.toBe('高');
    expect(res.quality.reasons.join()).toContain('ピント');
  });

  it('点が不正なら degenerate', () => {
    const bad = [[200, 50], [200, 750], [60, 295], [100, 300]];
    expect(() => analyze(base, DEMO_POINTS, base, bad)).toThrow('degenerate');
  });
});
