import { h, backButton, POINT_ERROR } from './dom.js';
import { photoStep } from './photoStep.js';
import { canvasToBlob } from './image.js';
import { checkPoints } from '../lib/homography.js';
import { putShoe } from '../lib/storage.js';

export function registerScreen(nav) {
  let ready = null;
  const name = h('input', { type: 'text', class: 'text', placeholder: '例: 通勤用スニーカー', maxlength: '40' });
  const msg = h('p', { class: 'error' });
  const save = h('button', { class: 'primary', type: 'button', disabled: true }, 'この写真を基準にして登録');
  const update = () => { save.disabled = !(ready && name.value.trim()); };
  name.addEventListener('input', update);
  save.addEventListener('click', async () => {
    try {
      checkPoints(ready.points);
    } catch {
      msg.textContent = POINT_ERROR;
      return;
    }
    save.disabled = true;
    msg.textContent = '';
    try {
      const basePhoto = await canvasToBlob(ready.photo.canvas);
      if (!basePhoto) throw new Error('blob');
      const shoe = {
        id: crypto.randomUUID(),
        name: name.value.trim(),
        createdAt: Date.now(),
        basePhoto,
        basePoints: ready.points,
        checks: [],
      };
      await putShoe(shoe);
      nav.detail(shoe.id);
    } catch (e) {
      console.error(e);
      msg.textContent = '保存できませんでした。ブラウザの空き容量やプライベートモードを確認してください。';
      update();
    }
  });
  return h('main', { class: 'screen' },
    backButton('一覧へ', () => nav.list()),
    h('h2', {}, '靴を登録'),
    h('label', { class: 'field' }, h('span', {}, '靴の名前'), name),
    photoStep({ title: '新品の靴底を撮る', onReady: (r) => { ready = r; msg.textContent = ''; update(); } }),
    msg,
    save);
}
