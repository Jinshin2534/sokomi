// IndexedDB の薄いラッパ。靴1足 = 1レコード（写真は Blob のまま入る）。
const DB_NAME = 'sokomi';
const STORE = 'shoes';

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: 'id' });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function run(mode, fn) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const req = fn(tx.objectStore(STORE));
    tx.oncomplete = () => resolve(req?.result);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error ?? new Error('aborted'));
  });
}

export async function listShoes() {
  const shoes = (await run('readonly', (s) => s.getAll())) ?? [];
  return shoes.sort((a, b) => b.createdAt - a.createdAt);
}
export const getShoe = (id) => run('readonly', (s) => s.get(id));
export const putShoe = (shoe) => run('readwrite', (s) => s.put(shoe));
export const deleteShoe = (id) => run('readwrite', (s) => s.delete(id));
