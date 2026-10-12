import { h } from './dom.js';

export const POINT_LABELS = ['つま先の先端', 'かかとの先端', '内側(親指側)の一番広い所', '外側(小指側)の一番広い所'];
export const POINT_COLORS = ['#d9480f', '#1c7ed6', '#2b8a3e', '#e8590c'];

// 写真の上を順番にタップして4点を打つ。打った点はドラッグで直せる。
export function createPointPicker(photoCanvas, { onChange } = {}) {
  const canvas = h('canvas', { class: 'picker', role: 'img', 'aria-label': '靴底の写真。4点をタップして指定' });
  canvas.width = photoCanvas.width;
  canvas.height = photoCanvas.height;
  const ctx = canvas.getContext('2d');
  const hint = h('p', { class: 'picker-hint' });
  const points = [];
  let drag = -1;

  const copy = () => (points.length === 4 ? points.map((p) => [...p]) : null);
  const emit = () => onChange?.(copy());
  const toImage = (e) => {
    const r = canvas.getBoundingClientRect();
    return [((e.clientX - r.left) * canvas.width) / r.width, ((e.clientY - r.top) * canvas.height) / r.height];
  };
  const hitRadius = () => (canvas.width / canvas.getBoundingClientRect().width) * 24;

  function draw() {
    ctx.drawImage(photoCanvas, 0, 0);
    const rad = Math.max(6, canvas.width / 70);
    if (points.length >= 2) {
      ctx.save();
      ctx.setLineDash([rad, rad]);
      ctx.lineWidth = rad / 3;
      ctx.strokeStyle = 'rgba(255,255,255,0.9)';
      ctx.beginPath();
      ctx.moveTo(...points[0]);
      ctx.lineTo(...points[1]);
      ctx.stroke();
      ctx.restore();
    }
    points.forEach((p, i) => {
      ctx.beginPath();
      ctx.arc(p[0], p[1], rad, 0, Math.PI * 2);
      ctx.fillStyle = POINT_COLORS[i];
      ctx.fill();
      ctx.lineWidth = rad / 3;
      ctx.strokeStyle = '#fff';
      ctx.stroke();
      ctx.fillStyle = '#fff';
      ctx.font = `bold ${rad * 1.2}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(i + 1), p[0], p[1]);
    });
    hint.replaceChildren(
      points.length < 4
        ? h('span', {}, h('b', { style: `color:${POINT_COLORS[points.length]}` }, `${points.length + 1}. ${POINT_LABELS[points.length]}`), ' をタップ')
        : '4点そろいました。ずれていたら点をドラッグして直せます',
    );
  }

  canvas.addEventListener('pointerdown', (e) => {
    const p = toImage(e);
    const near = points.findIndex((q) => Math.hypot(q[0] - p[0], q[1] - p[1]) < hitRadius());
    if (near >= 0) {
      drag = near;
      canvas.setPointerCapture(e.pointerId);
    } else if (points.length < 4) {
      points.push(p);
      draw();
      emit();
    }
  });
  canvas.addEventListener('pointermove', (e) => {
    if (drag < 0) return;
    const [x, y] = toImage(e);
    points[drag] = [Math.min(Math.max(x, 0), canvas.width), Math.min(Math.max(y, 0), canvas.height)];
    draw();
  });
  const endDrag = () => {
    if (drag < 0) return;
    drag = -1;
    emit();
  };
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);

  const reset = h('button', { class: 'ghost small', type: 'button', onClick: () => { points.length = 0; draw(); emit(); } }, '打ち直す');
  const legend = h('ol', { class: 'point-legend' },
    POINT_LABELS.map((l, i) => h('li', {}, h('i', { style: `background:${POINT_COLORS[i]}` }), l)));
  draw();
  return { el: h('div', { class: 'picker-wrap' }, hint, canvas, h('div', { class: 'picker-foot' }, legend, reset)), getPoints: copy };
}
