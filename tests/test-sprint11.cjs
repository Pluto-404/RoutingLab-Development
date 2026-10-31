/* Sprint 11 static security/regression checks, no Supabase credentials needed. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const get=p=>fs.readFileSync(path.join(root,p),'utf8');
const sql=get('supabase/migrations/20261031_sprint11.sql');
for (const table of ['evaluation_sets','evaluation_questions','evaluation_assignments','evaluation_attempts']) {
  assert.ok(sql.includes('CREATE TABLE IF NOT EXISTS public.'+table),table);
  assert.ok(sql.includes('ALTER TABLE public.'+table+' ENABLE ROW LEVEL SECURITY'),table);
}
assert.match(sql,/REVOKE ALL ON public\.evaluation_sets,public\.evaluation_questions,public\.evaluation_assignments,public\.evaluation_attempts FROM PUBLIC,anon,authenticated/);
for(const func of [
 'teacher_evaluations','teacher_save_evaluation','teacher_evaluation_questions',
 'teacher_upsert_evaluation_question','teacher_delete_evaluation_question','teacher_delete_evaluation',
 'teacher_set_evaluation_assignment','teacher_evaluation_assignments','teacher_evaluation_results',
 'student_evaluation_board','student_evaluation_questions','student_submit_evaluation']) {
 assert.ok(sql.includes('CREATE OR REPLACE FUNCTION public.'+func),func);
}
assert.match(sql,/SECURITY DEFINER SET search_path=''/);
assert.match(sql,/a\.is_active=true AND cm\.user_id=uid/);
assert.match(sql,/cm\.user_id=auth\.uid\(\)/);
assert.match(sql,/e\.teacher_id=auth\.uid\(\)/);
assert.match(sql,/result_score:=round\(\(correct::numeric\/total\)\*100\)/);
assert.match(sql,/INSERT INTO public\.evaluation_attempts/);
const leakCheck=sql.match(/CREATE OR REPLACE FUNCTION public\.student_evaluation_questions[\s\S]*?END \$\$;/);
assert.ok(leakCheck,'student questions rpc present');
assert.doesNotMatch(leakCheck[0],/'correct_index'|q\.correct_index|q\.explanation/,'question payload must not include answer key');
assert.match(sql,/NOT EXISTS\(SELECT 1 FROM public\.evaluation_assignments a WHERE a\.evaluation_id=/);
for(const page of ['materi.html','mini-lab.html','troubleshooting.html']){
  const html=get(page);
  assert.match(html,/<pre class="terminal terminal-code/);
  assert.doesNotMatch(html,/<div class="terminal(?: mt-2)?">/);
}
const top=get('materi.html');
assert.match(top,/class="topology-viewport"/);
assert.match(top,/class="link"/);
assert.match(get('css/style.css'),/\.terminal-code code[\s\S]*?white-space: inherit/);
assert.match(get('css/style.css'),/\.topology-viewport \.link \{ display: block/);
const account=get('akun.html'),portal=get('js/supabase-portal.js');
assert.doesNotMatch(account,/Uji progres latihan|id="saveProgressForm"/);
assert.doesNotMatch(portal,/saveProgressForm|upsert\(\{user_id:userId,activity/);
assert.match(get('evaluasi-guru.html'),/data-required-role="guru"/);
assert.match(get('evaluasi-guru.html'),/id="evalQuestionForm"/);
assert.match(get('evaluasi-guru.html'),/id="evalResultRows"/);
assert.match(get('evaluasi.html'),/id="assignedEvaluationForm"/);
assert.match(get('js/student-evaluations.js'),/student_submit_evaluation/);
assert.match(get('js/guru-evaluations.js'),/teacher_upsert_evaluation_question/);
assert.match(get('js/bootstrap.js'),/if\(page==='evaluasi' && role==='siswa'\) await addScript\('js\/student-evaluations\.js'\)/);
assert.ok(!fs.existsSync(path.join(root,'js','supabase-config.js')),'secrets excluded from archive baseline');
console.log('Sprint 11: evaluation RPC security checks, teacher/student integration, terminal examples, mobile topology & progress UI OK');
