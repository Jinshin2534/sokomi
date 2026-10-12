import './style.css';
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

const nav = {
  list: async () => show(await listScreen(nav)),
  register: () => show(registerScreen(nav)),
  detail: async (id) => show(await detailScreen(nav, id)),
  check: async (id) => show(await checkScreen(nav, id)),
  result: (ctx) => show(resultScreen(nav, ctx)),
  // 保存はしない。合成した「かかと外側がすり減った靴」で結果画面を見せる。
  demo: () => {
    const result = analyze(makeSoleImage(), DEMO_POINTS, makeSoleImage({ amp: DEMO_WEAR }), DEMO_POINTS);
    window.__app.lastResult = result;
    show(resultScreen(nav, { shoe: { name: 'サンプル（かかと外側がすり減った靴）' }, result }));
  },
};

// ヘッドレス検証用
window.__app = { analyze, makeSoleImage, DEMO_POINTS, DEMO_WEAR, nav, storage, lastResult: null };

nav.list();
