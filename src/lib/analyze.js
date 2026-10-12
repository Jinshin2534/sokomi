import { warpToSole } from './warp.js';
import { illuminationNormalize } from './normalize.js';
import { sobelMagnitude, cellTexture } from './texture.js';
import { cellMask, maskOutsideSole } from './mask.js';
import { cellWear } from './wear.js';
import { aggregate } from './regions.js';
import { compareQuality } from './quality.js';
import { checkPoints, pointsOrientation } from './homography.js';

// 新品時の写真と今の写真(＋それぞれの4点)から、マス・部位・全体のすり減り度を出す。
// 点が不正なら Error('degenerate')、内側と外側を新品時と逆に打っていたら Error('mirrored')。
export function analyze(baseImage, basePoints, nowImage, nowPoints) {
  checkPoints(basePoints);
  checkPoints(nowPoints);
  if (pointsOrientation(basePoints) !== pointsOrientation(nowPoints)) throw new Error('mirrored');
  const baseWarped = warpToSole(baseImage, basePoints);
  const nowWarped = warpToSole(nowImage, nowPoints);
  // 靴底の外(背景)は NaN にしてから正規化する: 背景を局所平均に混ぜず、縁の輪郭エッジも模様に数えない。
  // 信頼度(縁のくっきり具合を見る)と結果画面の下地には、マスクしない画像を使う。
  const texture = (g) => cellTexture(sobelMagnitude(illuminationNormalize(maskOutsideSole(g))));
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
