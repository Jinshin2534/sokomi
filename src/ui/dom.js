export function h(tag, props = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props ?? {})) {
    if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === 'class') el.className = v;
    else if (v === true) el.setAttribute(k, '');
    else if (v !== false && v != null) el.setAttribute(k, v);
  }
  for (const c of children.flat()) {
    if (c != null && c !== false) el.append(c instanceof Node ? c : String(c));
  }
  return el;
}

export const pct = (w) => (w == null ? '判定不能' : `${Math.round(w * 100)}%`);
export const fmtDate = (t) => new Date(t).toLocaleDateString('ja-JP');
export const backButton = (label, onClick) => h('button', { class: 'back', type: 'button', onClick }, `← ${label}`);

export const MIRRORED_ERROR =
  '内側と外側の点が新品時と逆になっています。親指側を3番、小指側を4番で打ち直してください。';

export const POINT_ERROR =
  '点の位置がおかしいようです。つま先とかかとを結ぶ線の両側に、内側と外側の点を打ってください。';
