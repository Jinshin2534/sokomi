import './style.css';
import { h } from './ui/dom.js';
import { analyze } from './lib/analyze.js';
import { makeSoleImage, DEMO_POINTS, DEMO_WEAR } from './lib/synth.js';
import * as storage from './lib/storage.js';
import { listScreen } from './ui/list.js';
import { registerScreen } from './ui/register.js';
import { detailScreen } from './ui/detail.js';
import { checkScreen } from './ui/check.js';
import { resultScreen } from './ui/result.js';

const root = document.getElementById('app');
function show(el) {
  root.replaceChildren(el);
  window.scrollTo(0, 0);
}

// 画面遷移が失敗したら(同期・非同期とも)、握りつぶさずエラー画面を出す。
const safe = (fn) => async (...args) => {
  try {
    await fn(...args);
  } catch (e) {
    console.error(e);
    show(h('main', { class: 'screen' },
      h('p', { class: 'error' }, '読み込みに失敗しました。このブラウザでは保存機能が使えない可能性があります。'),
      h('button', { class: 'primary', type: 'button', onClick: () => nav.list() }, '一覧へ戻る')));
  }
};

const nav = {
  list: safe(async () => show(await listScreen(nav))),
  register: () => show(registerScreen(nav)),
  detail: safe(async (id) => show(await detailScreen(nav, id))),
  check: safe(async (id) => show(await checkScreen(nav, id))),
  result: safe((ctx) => show(resultScreen(nav, ctx))),
  // 保存はしない。合成した「かかと外側がすり減った靴」で結果画面を見せる。
  demo: safe(() => {
    const result = analyze(makeSoleImage(), DEMO_POINTS, makeSoleImage({ amp: DEMO_WEAR }), DEMO_POINTS);
    window.__app.lastResult = result;
    show(resultScreen(nav, { shoe: { name: 'サンプル（かかと外側がすり減った靴）' }, result }));
  }),
};

// ヘッドレス検証用
window.__app = { analyze, makeSoleImage, DEMO_POINTS, DEMO_WEAR, nav, storage, lastResult: null };

nav.list();
