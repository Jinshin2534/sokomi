import { warpToSole } from './warp.js';
import { illuminationNormalize } from './normalize.js';
import { sobelMagnitude, cellTexture } from './texture.js';
import { cellMask } from './mask.js';
import { cellWear } from './wear.js';
import { aggregate } from './regions.js';
import { compareQuality } from './quality.js';

// 新品時の写真と今の写真(＋それぞれの4点)から、マス・部位・全体のすり減り度を出す。
// 点が不正なら Error('degenerate')。
export function analyze(baseImage, basePoints, nowImage, nowPoints) {
  const baseWarped = warpToSole(baseImage, basePoints);
  const nowWarped = warpToSole(nowImage, nowPoints);
  const texture = (g) => cellTexture(sobelMagnitude(illuminationNormalize(g)));
  const bt = texture(baseWarped);
  const nt = texture(nowWarped);
  const inSole = cellMask(bt.cols, bt.rows);
  const cells = cellWear(bt.values, nt.values, inSole);
  const { regions, overall, overallCoverage } = aggregate(cells, inSole, bt.cols, bt.rows);
  return {
    cols: bt.cols,
    rows: bt.rows,
    cells,
    inSole,
    regions,
    overall,
    overallCoverage,
    quality: compareQuality(baseWarped, nowWarped),
    nowWarped,
  };
}
