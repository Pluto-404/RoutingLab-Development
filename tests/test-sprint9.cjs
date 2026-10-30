"use strict";
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..');
const pages=fs.readdirSync(root).filter(x=>x.endsWith('.html'));
const css=fs.readdirSync(path.join(root,'css')).filter(x=>x.endsWith('.css')).sort();
assert.deepEqual(css,['cli-lab.css','style.css']);
let sidebars=0;
for(const page of pages){
  const html=fs.readFileSync(path.join(root,page),'utf8');
  const links=[...html.matchAll(/<link[^>]+href=["'](css\/[^"']+\.css)["']/g)].map(x=>x[1]);
  assert.equal(links.length,1,page+' should load exactly one css');
  const expected=page==='cli-lab.html'?'css/cli-lab.css':'css/style.css';
  assert.equal(links[0],expected,page);
  if(html.includes('class="brand-mark"')){
    sidebars++;
    assert.ok(html.includes('assets/logoo.png'),page+' logo');
    assert.ok(!html.includes('class="brand-mark">RL<'),page+' stale RL');
  }
}
assert.equal(sidebars,10);
assert.ok(fs.statSync(path.join(root,'assets/logoo.png')).size>500);
const cli=fs.readFileSync(path.join(root,'css/cli-lab.css'),'utf8');
assert.match(cli,/\.terminal \.output[\s\S]*?overflow-y:\s*auto/);
assert.match(cli,/:has\(\.guide-panel\[open\]/);
assert.match(cli,/\.ip-panel\[open\]/);
console.log('Sprint 9 CSS, logo & terminal structure: OK');
