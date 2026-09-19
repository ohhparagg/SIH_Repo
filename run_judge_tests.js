global.window = global;
global.document = {
  getElementById: (id) => null
};
try {
  if (!global.navigator) global.navigator = {};
} catch(e) {}
global.QRCode = { toCanvas: () => {} };

const _storage = new Map();
global.localStorage = {
  getItem: (k) => _storage.get(k) || null,
  setItem: (k, v) => _storage.set(k, String(v)),
  removeItem: (k) => _storage.delete(k),
  clear: () => _storage.clear()
};

import('./test_judge_scenarios.js');
