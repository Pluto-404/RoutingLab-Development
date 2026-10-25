/* Run: node tests/test-sprint1.cjs  — dependency-free smoke tests */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const ROOT = path.join(__dirname, '..');
const storage = new Map();
let current = { username: 'siswa01', role: 'siswa', name: 'Demo' };
const localStorage = {
  getItem(key) { return storage.has(key) ? storage.get(key) : null; },
  setItem(key, value) { storage.set(key, String(value)); },
  removeItem(key) { storage.delete(key); }
};
class Element {
  constructor(tag) {
    this.tagName = tag;
    this.children = [];
    this.style = {};
    this.attrs = {};
    this.listeners = {};
    this.textContent = '';
    this.className = '';
  }
  append(...children) { this.children.push(...children); }
  appendChild(child) { this.children.push(child); return child; }
  replaceChildren(...children) { this.children = [...children]; }
  setAttribute(name, value) { this.attrs[name] = value; }
  addEventListener(type, cb) { this.listeners[type] = cb; }
  querySelector() { return null; }
  focus() { this.focused = true; }
}
const quizForm = new Element('form');
const submitQuiz = new Element('button');
const quizResult = new Element('div');
const elements = { quizForm, submitQuiz, quizResult };
const choices = Array(5).fill(null);
const document = {
  readyState: 'complete',
  body: new Element('body'),
  querySelectorAll() { return []; },
  querySelector(selector) {
    const m = /^input\[name="q(\d+)"\]:checked$/.exec(selector);
    return m ? choices[Number(m[1])] : null;
  },
  getElementById(id) { return elements[id] || null; },
  createElement(tag) { return new Element(tag); },
  createTextNode(text) { return { textContent: text }; }
};
quizForm.querySelector = selector => {
  const match = /^input\[name="q(\d+)"\]$/.exec(selector);
  return match ? {focus() { quizForm.focusedQuestion = Number(match[1]); }} : null;
};
const ctx = vm.createContext({
  localStorage,
  document,
  console,
  location: { pathname: '/evaluasi.html' },
  RoutingAuth: {
    getSession() { return current; },
    requireRole() { return current; },
    logout() {}
  },
  Date,
  confirm: () => true
});
function exec(file) {
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'js', file), 'utf8'), ctx, {filename: file});
}
exec('common.js');
assert.equal(vm.runInContext('totalProgress()', ctx), 0, 'Fresh demo starts from zero');
vm.runInContext('saveProgress({...loadProgress(), materi:100, bestScore: 125})', ctx);
assert.equal(vm.runInContext('loadProgress().materi', ctx), 100);
assert.equal(vm.runInContext('loadProgress().bestScore', ctx), 100, 'Scores clamped');
current = {username:'siswa02', role:'siswa'};
assert.equal(vm.runInContext('loadProgress().materi', ctx), 0, 'User isolation');
assert.equal(vm.runInContext('totalProgress()', ctx), 0);
current = {username:'siswa03', role:'siswa'};
exec('evaluasi.js');
assert.equal(quizForm.children.length, 5, 'Five question fieldsets are rendered');
submitQuiz.listeners.click();
assert.equal(quizResult.textContent.includes('Jawab semua soal'), true, 'Incomplete quiz rejected');
assert.equal(vm.runInContext('loadProgress().evaluationAttempts', ctx), 0);
assert.equal(quizForm.focusedQuestion, 0);
// All wrong: low score, attempted but not mastered.
[0,1,2,3,4].forEach((_, i) => { choices[i] = {value:'3'}; });
submitQuiz.listeners.click();
assert.equal(vm.runInContext('loadProgress().evaluationAttempts', ctx), 1);
assert.equal(vm.runInContext('loadProgress().evaluasi', ctx), 50);
assert.equal(quizResult.children.length, 4, 'Review explanation rendered');
// Correct answers for all five questions.
[1,0,1,2,1].forEach((v, i) => { choices[i] = {value:String(v)}; });
submitQuiz.listeners.click();
assert.equal(vm.runInContext('loadProgress().bestScore', ctx), 100);
assert.equal(vm.runInContext('loadProgress().evaluasi', ctx), 100);
assert.equal(vm.runInContext('loadProgress().evaluationAttempts', ctx), 2);
// Retaking after mastery should not undo mastery.
[0,1,2,3,4].forEach((_, i) => { choices[i] = {value:'3'}; });
submitQuiz.listeners.click();
assert.equal(vm.runInContext('loadProgress().evaluationMastered', ctx), true);
assert.equal(vm.runInContext('loadProgress().evaluasi', ctx), 100);
console.log('PASS: 13 assertions / groups — progress isolation, clamping, quiz completion, pass threshold, best score.');
