export const REGIONS = [
  { id: 'toe', label: 'つま先', test: (u, v) => v < 0.18 },
  { id: 'ball', label: '母趾球', test: (u, v) => v >= 0.18 && v < 0.42 && u < 0.5 },
  { id: 'outerBall', label: '小趾側', test: (u, v) => v >= 0.18 && v < 0.42 && u >= 0.5 },
  { id: 'arch', label: '土踏まず', test: (u, v) => v >= 0.42 && v < 0.68 },
  { id: 'heelIn', label: 'かかと内', test: (u, v) => v >= 0.68 && u < 0.5 },
  { id: 'heelOut', label: 'かかと外', test: (u, v) => v >= 0.68 && u >= 0.5 },
];

export const MIN_REGION_COVERAGE = 0.3;
export const MIN_OVERALL_COVERAGE = 0.25;

const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;

// マスはすべて同じ面積なので、全体 = 判定可能マスの単純平均。
export function aggregate(wear, inSole, cols, rows) {
  const buckets = REGIONS.map(() => ({ inside: 0, values: [] }));
  const all = [];
  let insideTotal = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const i = r * cols + c;
      if (!inSole[i]) continue;
      const u = (c + 0.5) / cols;
      const v = (r + 0.5) / rows;
      const b = buckets[REGIONS.findIndex((reg) => reg.test(u, v))];
      b.inside++;
      insideTotal++;
      if (wear[i] != null) {
        b.values.push(wear[i]);
        all.push(wear[i]);
      }
    }
  }
  const regions = REGIONS.map((reg, k) => {
    const { inside, values } = buckets[k];
    const coverage = inside ? values.length / inside : 0;
    return { id: reg.id, label: reg.label, mean: coverage >= MIN_REGION_COVERAGE ? mean(values) : null, coverage };
  });
  const overallCoverage = insideTotal ? all.length / insideTotal : 0;
  return { regions, overall: overallCoverage >= MIN_OVERALL_COVERAGE ? mean(all) : null, overallCoverage };
}
