import { h } from './dom.js';
import { wearColor } from '../lib/color.js';
import { soleHalfWidth } from '../lib/mask.js';

const SCALE = 2;

function solePath(ctx, W, H) {
  ctx.beginPath();
  for (let k = 0; k <= 100; k++) {
    const v = k / 100;
    ctx.lineTo((0.5 - soleHalfWidth(v)) * W, v * H);
  }
  for (let k = 100; k >= 0; k--) {
    const v = k / 100;
    ctx.lineTo((0.5 + soleHalfWidth(v)) * W, v * H);
  }
  ctx.closePath();
}

function hatch(ctx, x, y, w, hgt) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, hgt);
  ctx.clip();
  ctx.fillStyle = 'rgba(150,150,150,0.45)';
  ctx.fillRect(x, y, w, hgt);
  ctx.strokeStyle = 'rgba(90,90,90,0.6)';
  ctx.lineWidth = 1;
  for (let d = -hgt; d < w; d += 5) {
    ctx.beginPath();
    ctx.moveTo(x + d, y + hgt);
    ctx.lineTo(x + d + hgt, y);
    ctx.stroke();
  }
  ctx.restore();
}

// 今の写真を靴底座標にそろえたものを下地に、マスごとのすり減り度を重ねる。上=つま先、左=内側。
export function renderHeatmap(result) {
  const { nowWarped, cols, rows, cells, inSole } = result;
  const W = nowWarped.width * SCALE;
  const H = nowWarped.height * SCALE;
  const base = document.createElement('canvas');
  base.width = nowWarped.width;
  base.height = nowWarped.height;
  const bctx = base.getContext('2d');
  const img = bctx.createImageData(base.width, base.height);
  nowWarped.data.forEach((v, i) => {
    const g = Number.isNaN(v) ? 255 : v;
    img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = g;
    img.data[i * 4 + 3] = 255;
  });
  bctx.putImageData(img, 0, 0);

  const canvas = h('canvas', { class: 'heatmap', 'aria-label': 'すり減りマップ' });
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(base, 0, 0, W, H);

  const cw = W / cols;
  const ch = H / rows;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const i = r * cols + c;
      if (!inSole[i]) continue;
      if (cells[i] == null) hatch(ctx, c * cw, r * ch, cw, ch);
      else {
        ctx.globalAlpha = 0.6;
        ctx.fillStyle = wearColor(cells[i]);
        ctx.fillRect(c * cw, r * ch, cw, ch);
        ctx.globalAlpha = 1;
      }
    }
  }

  // 靴底の外を白く薄める
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, W, H);
  solePath(ctx, W, H);
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.fill('evenodd');
  solePath(ctx, W, H);
  ctx.strokeStyle = 'rgba(60,50,40,0.5)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();

  return h('figure', { class: 'heatmap-fig' },
    h('div', { class: 'heatmap-sides' }, h('span', {}, '内側'), h('span', {}, 'つま先 ↑'), h('span', {}, '外側')),
    canvas,
    h('div', { class: 'legend' },
      h('span', {}, '0%'), h('i', { class: 'legend-bar' }), h('span', {}, '100%'),
      h('i', { class: 'legend-hatch' }), h('span', {}, '判定不能')));
}
