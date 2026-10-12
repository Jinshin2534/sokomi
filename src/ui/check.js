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
    const fail = (text) => {
      msg.textContent = text;
      run.disabled = false;
      run.textContent = '新品時と比べる';
    };
    let result;
    try {
      result = analyze(base.image, shoe.basePoints, ready.photo.image, ready.points);
    } catch (e) {
      fail(e.message === 'degenerate' ? POINT_ERROR : '解析に失敗しました。写真を選び直してください。');
      return;
    }
    const check = { at: Date.now(), overall: result.overall, regions: result.regions, quality: result.quality };
    const updated = { ...shoe, checks: [...shoe.checks, check] };
    try {
      await putShoe(updated);
    } catch (e) {
      console.error(e);
      fail('結果を保存できませんでした。ブラウザの空き容量を確認してください。');
      return;
    }
    window.__app.lastResult = result;
    nav.result({ shoe: updated, result });
  });
  return h('main', { class: 'screen' },
    backButton('戻る', () => nav.detail(id)),
    h('h2', {}, `${shoe.name} をチェック`),
    h('figure', { class: 'ref' }, base.canvas, h('figcaption', {}, '新品時の写真。なるべく同じ向き・同じ明るさで撮ってください')),
    photoStep({ title: '今の靴底を撮る', onReady: (r) => { ready = r; msg.textContent = ''; run.disabled = !r; } }),
    msg,
    run);
}
