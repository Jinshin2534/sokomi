import { h } from './dom.js';
import { fileToPhoto } from './image.js';
import { createPointPicker } from './pointPicker.js';

const TIPS = ['真上から撮る', '靴底と色の違う、無地の背景に置く', '新品時と同じ場所・同じ照明で撮る', '靴底全体を画面に入れる'];

// 写真を選んで4点を打つまで。そろったら onReady({photo, points})、崩れたら onReady(null)。
export function photoStep({ title, onReady }) {
  const input = h('input', { type: 'file', accept: 'image/*', class: 'file' });
  const slot = h('div', { class: 'picker-slot' });
  input.addEventListener('change', async () => {
    const file = input.files?.[0];
    if (!file) return;
    onReady(null);
    try {
      const photo = await fileToPhoto(file);
      const picker = createPointPicker(photo.canvas, { onChange: (points) => onReady(points ? { photo, points } : null) });
      slot.replaceChildren(picker.el);
    } catch {
      slot.replaceChildren(h('p', { class: 'error' }, '写真を読み込めませんでした。別の写真を選んでください。'));
    }
  });
  return h('section', { class: 'step' },
    h('h3', {}, title),
    h('ul', { class: 'tips' }, TIPS.map((t) => h('li', {}, t))),
    h('label', { class: 'file-label' }, '写真を撮る / 選ぶ', input),
    slot);
}
