/* Dashboard teacher smoke under a DOM/Supabase mock; no real user data. */
const assert=require('node:assert/strict'), fs=require('node:fs'), vm=require('node:vm'), path=require('node:path');
class El{
 constructor(name='div'){this.name=name;this.children=[];this.style={};this.listeners={};this.classList={toggle(){}};this.disabled=false;this.value='';this.textContent='';}
 append(...els){this.children.push(...els)}
 replaceChildren(...els){this.children=[...els]}
 addEventListener(k,fn){this.listeners[k]=fn}
 click(){this.clicked=true}
}
const elements=new Map(),events=[];
const el=(id)=>{if(!elements.has(id))elements.set(id,new El(id));return elements.get(id)};
const fakeRows=[{student_id:'student1',class_id:'c1',class_name:'X TJKT A',student_name:'=HYPERLINK("bad")',progress_percent:80,completed_count:4,cli_percent:100,activity_count:9,last_activity_at:'2026-10-27T10:00:00Z'}];
const api={from(t){assert.equal(t,'classes');return {
 select(){return this},order(){return Promise.resolve({data:[{id:'c1',name:'X TJKT A',code:'TEST'}],error:null})}
 }},rpc(name,args){events.push({name,args});return Promise.resolve({data:name==='teacher_progress_report'?fakeRows:name==='teacher_recent_events'?[{class_name:'X TJKT A',student_name:'Student',activity:'cliLab',outcome:'passed',score:null,created_at:'2026-10-27T10:00:00Z'}]:[],error:null})}};
let outputBlobText='';let exportedFile='';const Url={createObjectURL(){return 'blob:dummy'},revokeObjectURL(){}};
const ctx=vm.createContext({
 console,Date,Promise,RoutingAuth:{getClient(){return api}},initCommon(){},
 document:{getElementById:el,createElement(name){const a=new El(name);if(name==='a'){a.click=()=>{exportedFile=a.download;}}return a}},
 URL:Url,Blob:class Blob{constructor(parts){outputBlobText=parts.join('')}} ,setTimeout(fn){fn()}
});
vm.runInContext(fs.readFileSync(path.join(__dirname,'../js/guru.js'),'utf8'),ctx);
(async()=>{
 for(let i=0;i<30;i++) await Promise.resolve();
 assert.equal(el('studentCount').textContent,'1');
 assert.equal(el('avgProgress').textContent,'80%');
 assert.equal(el('totalAttempts').textContent,'9');
 assert.ok(el('studentRows').children.length===1);
 assert.ok(el('recentActivityRows').children.length===1);
 assert.ok(events.some(e=>e.name==='teacher_progress_report'));
 el('exportClassCsv').listeners.click();
 assert.ok(exportedFile.endsWith('.csv'));
 assert.ok(outputBlobText.includes("'=HYPERLINK"),'CSV must prevent formula injection');
 console.log('PASS Sprint 7 dashboard: classroom stats, recent activity, CSV formula-injection guard.');
})().catch(e=>{console.error(e);process.exitCode=1});
