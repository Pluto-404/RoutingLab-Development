/* Smoke test material completion using fake DOM: node tests/test-materi.cjs */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const storage = new Map();
let selected = {username: 'siswa01', role:'siswa'};
class MockElement {
  constructor(tag) { this.tag = tag; this.children = []; this.handlers = {}; this.style = {}; this.textContent = ''; }
  append(...nodes) { this.children.push(...nodes); }
  appendChild(n) { this.children.push(n); }
  addEventListener(type, cb) { this.handlers[type] = cb; }
  setAttribute() {}
}
const body = new MockElement('body');
const document = {
  readyState: 'complete', body,
  querySelectorAll() { return []; },
  querySelector() { return null; },
  getElementById() { return null; },
  createElement(tag) { return new MockElement(tag); }
};
const context = vm.createContext({
  document, console, Date, location:{pathname:'/materi.html'},
  localStorage: {
    getItem(k) { return storage.get(k) || null; },
    setItem(k,v) { storage.set(k,v); },
    removeItem(k) { storage.delete(k); }
  },
  RoutingAuth: {
    getSession() { return selected; },
    requireRole() { return selected; }, logout() {}
  }
});
for (const file of ['common.js','materi.js']) {
  vm.runInContext(fs.readFileSync(path.join(__dirname,'..','js',file),'utf8'), context, {filename:file});
}
assert.equal(vm.runInContext('loadProgress().materi', context), 0);
assert.equal(body.children.length, 1, 'Button section dynamically added');
const section = body.children[0];
const button = section.children[3];
assert.equal(button.textContent, 'Tandai materi selesai');
button.handlers.click();
assert.equal(vm.runInContext('loadProgress().materi', context), 100);
assert.equal(button.disabled, true);
selected={username:'siswa02', role:'siswa'};
assert.equal(vm.runInContext('loadProgress().materi', context), 0, 'No cross-user carryover');
console.log('PASS: Material completion only on explicit button click.');
