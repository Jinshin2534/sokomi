import { h, pct, backButton } from './dom.js';
import { renderHeatmap } from './heatmap.js';
import { wearColor } from '../lib/color.js';

const bar = (w) => h('span', { class: 'bar' },
  w == null ? h('i', { class: 'bar-none' }) : h('i', { style: `width:${Math.round(w * 100)}%;background:${wearColor(w)}` }));

function qualityBox({ level, reasons }) {
  return h('div', { class: `quality q-${level}` },
    h('b', {}, `信頼度: ${level}`),
    reasons.length
      ? h('ul', {}, reasons.map((r) => h('li', {}, r)), level === '低' ? h('li', {}, '撮り直すと結果が安定します') : null)
      : h('span', {}, ' 撮影条件は新品時とよくそろっています'));
}

export function resultScreen(nav, { shoe, result }) {
  const { overall, regions, quality } = result;
  return h('main', { class: 'screen' },
    backButton('戻る', () => (shoe.id ? nav.detail(shoe.id) : nav.list())),
    h('h2', {}, `${shoe.name} の結果`),
    h('div', { class: 'overall' },
      h('span', { class: 'overall-label' }, '全体のすり減り'),
      h('span', { class: 'overall-num' }, pct(overall)),
      bar(overall)),
    qualityBox(quality),
    renderHeatmap(result),
    h('ul', { class: 'regions' }, regions.map((r) =>
      h('li', { class: 'region' }, h('span', { class: 'region-name' }, r.label), h('span', { class: 'region-num' }, pct(r.mean)), bar(r.mean)))),
    h('p', { class: 'note' },
      '模様のくっきり具合の減り方から推定した値で、溝の深さを測ったものではありません。',
      'グレーの斜線は、新品時に模様がなく比べられない場所です。'));
}
