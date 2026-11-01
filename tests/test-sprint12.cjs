/* Sprint 12 regression checks: active nav, scoped analytics, CSS consolidation, deployment. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const sql=read('supabase/migrations/20261101_sprint12.sql');
for(const table of ['profiles','classes','class_memberships','user_progress','practice_events','mission_catalog','class_assignments','mission_attempts','evaluation_sets','evaluation_questions','evaluation_assignments','evaluation_attempts']){
  assert.ok(sql.includes(`ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY`),table);
}
for(const fn of ['teacher_evaluation_summary','teacher_activity_breakdown']){
  assert.ok(sql.includes(`CREATE OR REPLACE FUNCTION public.${fn}`),fn);
  assert.ok(sql.includes(`REVOKE ALL ON FUNCTION public.${fn}(uuid) FROM PUBLIC,anon`),fn);
  assert.ok(sql.includes(`GRANT EXECUTE ON FUNCTION public.${fn}(uuid) TO authenticated`),fn);
}
assert.match(sql,/WHERE c\.teacher_id=auth\.uid\(\) AND e\.teacher_id=auth\.uid\(\)/);
assert.match(sql,/WHERE c\.teacher_id=auth\.uid\(\) AND \(p_class_id IS NULL/);
assert.match(sql,/AND a\.is_active=true/);
assert.match(sql,/CREATE POLICY progress_self_update[\s\S]*?p\.role='siswa'/);
assert.match(sql,/SECURITY DEFINER SET search_path=''/);
assert.match(read('js/guru.js'),/api\.rpc\('teacher_evaluation_summary'/);
assert.match(read('js/guru.js'),/api\.rpc\('teacher_activity_breakdown'/);
for(const id of ['evalAverage','evalSubmitted','evalPending','teacherEvaluationSummary','teacherActivityBreakdown'])
  assert.ok(read('dashboard-guru.html').includes(`id="${id}"`),id);
assert.match(read('css/cli-lab.css'),/Sprint 12 — blue UI/);
assert.match(read('css/style.css'),/Sprint 12 — navigation state/);
assert.match(read('css/style.css'),/\.nav a\.active::before[\s\S]*?background: #52e1cb/);
assert.deepEqual(fs.readdirSync(path.join(root,'css')).filter(x=>x.endsWith('.css')).sort(),['cli-lab.css','style.css']);
assert.ok(!fs.existsSync(path.join(root,'js','supabase-config.js')),'local secret config must stay absent in GitHub archive');
const build=read('scripts/build-pages.cjs');
assert.match(build,/payload\.role === 'anon'/);
assert.match(build,/sb_publishable_/);
assert.match(build,/_headers/);
// Run real initCommon() under a minimal DOM and assert navigation based on URL.
function link(href){const classes=new Set();const attrs={href};return {
  getAttribute(k){return attrs[k]||null},setAttribute(k,v){attrs[k]=v},removeAttribute(k){delete attrs[k]},
  classList:{add(k){classes.add(k)},toggle(k,yes){if(yes)classes.add(k);else classes.delete(k)},contains(k){return classes.has(k)}}
};}
const links=['dashboard-siswa.html','materi.html','visualisasi.html','mini-lab.html','cli-lab.html','evaluasi.html'].map(link);
const session={role:'siswa',name:'Siswa Uji',classCode:'TEST'};
const ctx=vm.createContext({console,URL,location:{href:'https://routinglab.my.id/visualisasi.html?foo=1',pathname:'/visualisasi.html'},
  RoutingAuth:{requireRole(){return session}},document:{querySelectorAll(selector){return selector==='.sidebar .nav a[href]'?links:[]}},window:{dispatchEvent(){}}});
vm.runInContext(read('js/common.js'),ctx);
vm.runInContext('initCommon("siswa")',ctx);
assert.deepEqual(links.filter(l=>l.classList.contains('active')).map(l=>l.getAttribute('href')),['visualisasi.html']);
assert.equal(links.find(l=>l.getAttribute('href')==='visualisasi.html').getAttribute('aria-current'),'page');
assert.equal(links.find(l=>l.getAttribute('href')==='cli-lab.html').getAttribute('aria-current'),null);
console.log('PASS Sprint 12: restricted SQL RPCs, sidebar single active URL, retained indicator, analytics, blue CLI, 2 CSS, Cloudflare guard.');
