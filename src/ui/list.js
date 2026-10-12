import { h, pct } from './dom.js';
import { listShoes } from '../lib/storage.js';

function shoeCard(shoe, nav) {
  const last = shoe.checks.at(-1);
  return h('li', {},
    h('button', { class: 'shoe-card', type: 'button', onClick: () => nav.detail(shoe.id) },
      h('img', { src: URL.createObjectURL(shoe.basePhoto), alt: '', onLoad: (e) => URL.revokeObjectURL(e.target.src), onError: (e) => URL.revokeObjectURL(e.target.src) }),
      h('span', { class: 'shoe-name' }, shoe.name),
      h('span', { class: 'shoe-wear' }, last ? `すり減り ${pct(last.overall)}` : 'まだチェックしていません')));
}

export async function listScreen(nav) {
  const shoes = await listShoes();
  return h('main', { class: 'screen' },
    h('header', { class: 'app-header' },
      h('h1', {}, '底見'),
      h('p', {}, '靴底のすり減りを、新品のときの写真と比べて推定します')),
    shoes.length
      ? h('ul', { class: 'shoe-list' }, shoes.map((s) => shoeCard(s, nav)))
      : h('p', { class: 'empty' }, 'まだ靴が登録されていません。新品のうちに靴底を撮っておきましょう。'),
    h('div', { class: 'actions' },
      h('button', { class: 'primary', type: 'button', onClick: () => nav.register() }, '＋ 靴を登録'),
      h('button', { class: 'ghost', type: 'button', onClick: () => nav.demo() }, 'サンプルで試す')));
}
