/* Sprint 7 smoke: activity logs, role separation, ownership and migration constraints. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.join(__dirname,'..');
const source=fs.readFileSync(path.join(root,'js/activity.js'),'utf8');
const calls=[];let role='siswa';
const client={from(t){assert.equal(t,'practice_events');return {
 insert(payload){calls.push(payload);return Promise.resolve({error:null});},
 select(){return this},eq(){return this},order(){return this},limit(){return Promise.resolve({data:[{activity:'cliLab',outcome:'passed'}],error:null});}
};}};
const win={dispatchEvent(){}};
const ctx=vm.createContext({console,window:win,CustomEvent:class CustomEvent {constructor(name,options){this.name=name;this.detail=options?.detail;}},RoutingAuth:{getSession(){return {id:'demo-user-id',role}},getClient(){return client}}});
vm.runInContext(source,ctx,{filename:'activity.js'});
(async()=>{
 assert.equal(await vm.runInContext("RoutingActivity.record('cliLab','passed',null,'Test')",ctx),true);
 assert.equal(calls.length,1);assert.equal(calls[0].user_id,'demo-user-id');
 assert.equal(calls[0].outcome,'passed');
 assert.equal(await vm.runInContext("RoutingActivity.record('evaluasi','passed',150)",ctx),false);
 assert.equal(await vm.runInContext("RoutingActivity.record('other','retry')",ctx),false);
 assert.equal(calls.length,1);
 assert.equal((await vm.runInContext('RoutingActivity.recent(15)',ctx)).data[0].activity,'cliLab');
 role='guru';assert.equal(await vm.runInContext("RoutingActivity.record('cliLab','retry')",ctx),false);
 assert.equal(calls.length,1,'teacher cannot submit student events from UI');
 const sql=fs.readFileSync(path.join(root,'supabase/migrations/20261027_sprint7.sql'),'utf8');
 for(const section of ['ENABLE ROW LEVEL SECURITY','practice_events_self_insert','auth.uid()','c.teacher_id=auth.uid()','SECURITY DEFINER SET search_path=\'\'','REVOKE ALL ON FUNCTION public.teacher_progress_report','REVOKE ALL ON FUNCTION public.teacher_recent_events','updated_at := now()'])assert.ok(sql.includes(section),`missing database security constraint: ${section}`);
 for(const file of ['dashboard-guru.html','progress.html'])assert.ok(fs.readFileSync(path.join(root,file),'utf8').includes('data-rl-css=') && fs.readFileSync(path.join(root,file),'utf8').includes('progress-layout'));
 const boot=fs.readFileSync(path.join(root,'js/bootstrap.js'),'utf8');assert.ok(boot.includes("await addScript('js/activity.js')"));
 const guru=fs.readFileSync(path.join(root,'js/guru.js'),'utf8');assert.ok(guru.includes("api.rpc('teacher_progress_report'"));assert.ok(guru.includes("api.rpc('teacher_recent_events'"));
 assert.ok(guru.includes('function csvValue'));
 console.log('PASS Sprint 7: owner-scoped event logs, no teacher submissions, constrained RPCs, migration and dashboard integration.');
})().catch(e=>{console.error(e);process.exitCode=1;});
