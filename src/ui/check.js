import { h, backButton, POINT_ERROR } from './dom.js';
import { photoStep } from './photoStep.js';
import { blobToPhoto } from './image.js';
import { getShoe, putShoe } from '../lib/storage.js';
import { analyze } from '../lib/analyze.js';

export async function checkScreen(nav, id) {
  const shoe = await getShoe(id);
  if (!shoe) return h('main', { class: 'screen' }, backButton('一覧へ', () => nav.list()), h('p', {}, 'この靴は見つかりませんでした。'));
  const base = await blobToPhoto(shoe.basePhoto);
  base.canvas.className = 'ref-photo';
  let ready = null;
  const msg = h('p', { class: 'error' });
  const run = h('button', { class: 'primary', type: 'button', disabled: true }, '新品時と比べる');
  run.addEventListener('click', async () => {
    run.disabled = true;
    run.textContent = '解析中…';
    await new Promise((r) => setTimeout(r, 30)); // ボタンの表示を先に更新する
    try {
      const result = analyze(base.image, shoe.basePoints, ready.photo.image, ready.points);
      shoe.checks.push({ at: Date.now(), overall: result.overall, regions: result.regions, quality: result.quality });
      await putShoe(shoe);
      window.__app.lastResult = result;
      nav.result({ shoe, result });
    } catch (e) {
      msg.textContent = e.message === 'degenerate' ? POINT_ERROR : '解析に失敗しました。写真を選び直してください。';
      run.disabled = false;
      run.textContent = '新品時と比べる';
    }
  });
  return h('main', { class: 'screen' },
    backButton('戻る', () => nav.detail(id)),
    h('h2', {}, `${shoe.name} をチェック`),
    h('figure', { class: 'ref' }, base.canvas, h('figcaption', {}, '新品時の写真。なるべく同じ向き・同じ明るさで撮ってください')),
    photoStep({ title: '今の靴底を撮る', onReady: (r) => { ready = r; msg.textContent = ''; run.disabled = !r; } }),
    msg,
    run);
}
