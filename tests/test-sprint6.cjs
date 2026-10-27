/* Sprint 6 smoke: async Auth + role, progress sync; no external calls. */
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.join(__dirname,'..');
const memory=new Map();let role='siswa',upserted=[],lastQuery='';
const from=table=>({
 select(){return this},eq(){return this},order(){return this},limit(){return Promise.resolve({data:[{code:'A1'}],error:null})},
 single(){return Promise.resolve({data:table==='profiles'?{full_name:'Siswa Uji',role}:null,error:null})},
 then(resolve){const data=table==='user_progress'?[{activity:'materi',percent:75}]:[];return Promise.resolve({data,error:null}).then(resolve)},
 upsert(rows){upserted.push(...rows);return Promise.resolve({error:null})}
});
const client={auth:{getUser:async()=>({data:{user:{id:'siswa-uuid',email:'uji@example.test'}},error:null}),signInWithPassword:async()=>({error:null}),signOut:async()=>({error:null})},from};
const document={getElementById(){return null},createElement(){return {classList:{toggle(){}}}},body:{append(){}} ,querySelectorAll(){return []}};
const ctx=vm.createContext({console,window:{ROUTINGLAB_SUPABASE:{url:'https://foo.supabase.co',publishableKey:'sb_publishable_unit'},supabase:{createClient(){return client}},dispatchEvent(){}},location:{pathname:'/materi.html',replace(){}},document,localStorage:{getItem(k){return memory.get(k)||null},setItem(k,v){memory.set(k,v)}},structuredClone,Date,CustomEvent:class CustomEvent{},setTimeout});
for(const f of ['auth.js','common.js']) vm.runInContext(fs.readFileSync(path.join(root,'js',f),'utf8'),ctx,{filename:f});
(async()=>{
 const student=await vm.runInContext('RoutingAuth.verify()',ctx);
 assert.equal(student.role,'siswa');assert.equal(student.id,'siswa-uuid');
 assert.equal(vm.runInContext('RoutingAuth.requireRole("guru")',ctx),null);
 await vm.runInContext('RoutingProgress.hydrate(RoutingAuth.getClient(),"siswa-uuid")',ctx);
 assert.equal(vm.runInContext('loadProgress().materi',ctx),75);
 vm.runInContext('saveProgress({...loadProgress(),materi:100,cliLab:100})',ctx);
 await vm.runInContext('RoutingProgress.whenSynced()',ctx);
 assert.equal(upserted.length,2);
 assert.ok(upserted.every(x=>x.user_id==='siswa-uuid'));
 assert.equal(upserted.find(x=>x.activity==='cliLab').percent,100);
 role='guru';const teacher=await vm.runInContext('RoutingAuth.verify()',ctx);
 assert.equal(teacher.role,'guru');assert.equal(vm.runInContext('RoutingAuth.requireRole("siswa")',ctx),null);
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
 assert.ok(!html.includes('siswa01') && !html.includes('guru01'));
 const portal=fs.readFileSync(path.join(root,'akun.html'),'utf8');
 assert.ok(portal.includes('registerForm'));
 const migration=fs.readFileSync(path.join(root,'supabase/migrations/20261027_sprint6.sql'),'utf8');
 assert.ok(migration.includes('c.teacher_id=auth.uid()'));
 console.log('PASS Sprint 6: Supabase role routing, user-scoped progress sync, non-demo login, scoped teacher RPC.');
})().catch(e=>{console.error(e);process.exitCode=1});
