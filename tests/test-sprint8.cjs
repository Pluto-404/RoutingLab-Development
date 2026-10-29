/* RoutingLab Sprint 8 regression/security smoke (offline; no Supabase credentials). */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.join(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const sql=read('supabase/migrations/20261029_sprint8.sql');
const boot=read('js/bootstrap.js');
const cli=read('js/cli-lab.js');
const student=read('js/student-missions.js');
const teacher=read('js/guru-missions.js');
const mission=read('js/cli-mission.js');
for(const table of ['mission_catalog','class_assignments','mission_attempts']){
  assert.match(sql,new RegExp('CREATE TABLE IF NOT EXISTS public\\.'+table));
  assert.match(sql,new RegExp('ALTER TABLE public\\.'+table+' ENABLE ROW LEVEL SECURITY'));
}
assert.ok(sql.includes('REVOKE ALL ON public.mission_catalog, public.class_assignments, public.mission_attempts FROM PUBLIC,anon,authenticated'));
for(const rpc of ['list_missions','teacher_assign_mission','teacher_unassign_mission','student_mission_board','student_submit_mission_attempt','teacher_mission_report','teacher_mission_attempts']){
  assert.ok(sql.includes('CREATE OR REPLACE FUNCTION public.'+rpc));
  assert.ok(sql.includes('GRANT EXECUTE ON FUNCTION public.'+rpc));
  assert.ok(sql.includes('REVOKE ALL ON FUNCTION public.'+rpc));
}
assert.match(sql,/c\.teacher_id=auth\.uid\(\)/);
assert.match(sql,/cm\.user_id=auth\.uid\(\)/);
assert.match(sql,/a\.is_active=true/);
assert.match(sql,/p_outcome NOT IN \('passed','retry'\)/);
assert.match(sql,/SECURITY DEFINER SET search_path=''/);
assert.match(sql,/UNIQUE \(class_id, mission_code\)/);
assert.match(sql,/ON CONFLICT \(class_id,mission_code\) DO UPDATE/);
for(const name of ['static-basic','missing-return','wan-down','wrong-next-hop'])assert.ok(sql.includes(`'${name}'`));
assert.match(boot,/await addScript\('js\/student-missions\.js'\)/);
assert.match(boot,/await addScript\('js\/guru-missions\.js'\)/);
assert.match(boot,/await addScript\('js\/cli-mission\.js'\)/);
assert.match(cli,/window\.RoutingCLIMission\?\.recordValidation/);
assert.match(cli,/window\.RoutingCLILab = Object\.freeze/);
assert.match(student,/api\.rpc\('student_mission_board'\)/);
assert.match(teacher,/api\.rpc\('teacher_mission_report'/);
assert.match(teacher,/api\.rpc\('teacher_assign_mission'/);
assert.match(teacher,/api\.rpc\('teacher_unassign_mission'/);
assert.match(mission,/api\.rpc\('student_submit_mission_attempt'/);
for(const page of ['dashboard-siswa.html','dashboard-guru.html','cli-lab.html']) assert.ok(read(page).includes('css/sprint8.css'));
assert.ok(read('dashboard-siswa.html').includes('studentMissionList'));
assert.ok(read('dashboard-guru.html').includes('assignMissionForm'));
assert.ok(read('cli-lab.html').includes('assignmentMissionInfo'));

// Unit-test assignment-context gate and save call without real Supabase / network.
const UUID='11111111-1111-4111-8111-111111111111';
const values={assignmentMissionLabel:'',assignmentMissionInfo:'',scenarioSelect:'',loadScenario:''};
function element(){return {textContent:'',className:'',disabled:false,hidden:false,children:[],classList:{toggle(){}},setAttribute(){},replaceChildren(...v){this.children=v},append(...v){this.children.push(...v)}};}
for(const k of Object.keys(values))values[k]=element();
const summary=element(),guide=element(),help=element();
const rpcCalls=[];let currentRole='siswa',board=[];
const client={rpc:async(name,args)=>{rpcCalls.push({name,args});if(name==='student_mission_board')return {data:board,error:null};if(name==='student_submit_mission_attempt')return {data:'saved',error:null};return {error:{message:'Unexpected RPC'}};}};
const ctx={console,window:{RoutingCLILab:{loadScenario(code){ctx.loaded=code}}},location:{search:'?assignment='+UUID},URLSearchParams,Date,
 document:{getElementById(id){return values[id]},querySelector(selector){return selector==='.mission-summary'?summary:selector==='.guide-panel'?guide:help},createElement(){return element()}},
 RoutingAuth:{getClient(){return client},getSession(){return {role:currentRole}}}};
vm.createContext(ctx);
const tick=()=>new Promise(resolve=>setImmediate(resolve));
(async()=>{
  vm.runInContext(mission,ctx,{filename:'cli-mission.js'});
  await tick();
  assert.match(values.assignmentMissionInfo.textContent,/bukan kelasmu/);
  assert.equal(ctx.loaded,undefined,'unauthorized assignment must not autoload a scenario');
  assert.ok(!rpcCalls.some(x=>x.name==='student_submit_mission_attempt'));
  // Re-run with allowed assignment: only it can be saved after a CLI check.
  board=[{assignment_id:UUID,class_name:'X TJKT',mission_title:'WAN Shutdown',mission_description:'Perbaiki WAN',scenario:'wan-down',attempt_count:0,passed:false}];
  vm.runInContext(mission,ctx,{filename:'cli-mission.js'});
  await tick();
  assert.equal(ctx.loaded,'wan-down');
  assert.equal(values.scenarioSelect.disabled,true);
  assert.equal(values.loadScenario.disabled,true);
  await ctx.window.RoutingCLIMission.recordValidation(false);
  await ctx.window.RoutingCLIMission.recordValidation(true);
  const saves=rpcCalls.filter(x=>x.name==='student_submit_mission_attempt');
  assert.equal(saves.length,2);
  assert.equal(saves[0].args.p_assignment_id,UUID);
  assert.equal(saves[0].args.p_outcome,'retry');
  assert.equal(saves[1].args.p_outcome,'passed');
  assert.match(values.assignmentMissionInfo.textContent,/Percobaan #2/);
  console.log('PASS Sprint 8: scoped RPCs, RLS, mission catalog, UI integration, unauthorized assignment guard and CLI attempt logging.');
})().catch(err=>{console.error(err);process.exitCode=1;});
