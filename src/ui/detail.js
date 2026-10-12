import { h, pct, fmtDate, backButton } from './dom.js';
import { getShoe, deleteShoe } from '../lib/storage.js';

export async function detailScreen(nav, id) {
  const shoe = await getShoe(id);
  if (!shoe) {
    return h('main', { class: 'screen' }, backButton('一覧へ', () => nav.list()), h('p', {}, 'この靴は見つかりませんでした。'));
  }
  const history = shoe.checks.slice().reverse();
  return h('main', { class: 'screen' },
    backButton('一覧へ', () => nav.list()),
    h('h2', {}, shoe.name),
    h('img', { class: 'base-photo', src: URL.createObjectURL(shoe.basePhoto), alt: '新品時の靴底' }),
    h('p', { class: 'muted' }, `新品時の写真: ${fmtDate(shoe.createdAt)} に登録`),
    h('button', { class: 'primary', type: 'button', onClick: () => nav.check(id) }, '今の靴底をチェック'),
    h('h3', {}, 'これまでのチェック'),
    history.length
      ? h('ul', { class: 'history' }, history.map((c) =>
        h('li', {}, h('span', {}, fmtDate(c.at)), h('span', { class: 'num' }, pct(c.overall)), h('span', { class: 'muted' }, `信頼度 ${c.quality.level}`))))
      : h('p', { class: 'muted' }, 'まだありません'),
    h('button', {
      class: 'danger', type: 'button',
      onClick: async () => {
        if (!confirm(`「${shoe.name}」を削除しますか？ 新品時の写真も消えます。`)) return;
        await deleteShoe(id);
        nav.list();
      },
    }, 'この靴を削除'));
}
