/* Sprint 11 student class evaluation: questions without keys; server-side scored RPC. */
(() => {
  'use strict';
  if (!RoutingAuth.requireRole('siswa')) return;
  const $=id=>document.getElementById(id),api=RoutingAuth.getClient();
  const status=$('assignedEvaluationStatus'),list=$('assignedEvaluationList'),runner=$('assignedEvaluationRunner');
  if(!status||!list||!runner)return;
  const say=(t,bad=false)=>{status.textContent=t;status.classList.toggle('rl11-error',bad);};
  const rpc=async(name,args={})=>{const {data,error}=await api.rpc(name,args);if(error)throw Error(error.message);return data;};
  const el=(tag,txt,cls)=>{const n=document.createElement(tag);if(txt!=null)n.textContent=String(txt);if(cls)n.className=cls;return n;};
  let assignment=null,questions=[],busy=false;
  const close=()=>{assignment=null;questions=[];runner.hidden=true;$('assignedEvaluationForm').replaceChildren();};
  const resetResult=()=>{const r=$('assignedEvaluationResult');r.replaceChildren();r.hidden=true;};
  async function board(){
    const rows=await rpc('student_evaluation_board');list.replaceChildren();
    if(!rows.length){list.append(el('p','Belum ada evaluasi dari guru.','rl11-muted'));say('');return;}
    for(const item of rows){
      const row=el('div',null,'rl11-eval-item');const info=el('div');
      info.append(el('strong',item.title));
      info.append(el('p',`${item.class_name} · ${item.question_count} soal${item.attempt_count?' · '+item.attempt_count+' percobaan':''}${item.best_score!=null?' · Terbaik '+item.best_score+'/100':''}`));
      if(item.description)info.append(el('p',item.description));
      const btn=el('button','Kerjakan','btn btn-primary');btn.type='button';
      btn.addEventListener('click',async()=>{btn.disabled=true;try{await open(item);}catch(e){say(e.message,true);}finally{btn.disabled=false;}});
      row.append(info,btn);list.append(row);
    }
    say('');
  }
  async function open(item){
    const data=await rpc('student_evaluation_questions',{p_assignment_id:item.assignment_id});
    if(!data?.questions?.length)throw Error('Soal belum tersedia. Hubungi guru.');
    assignment=item.assignment_id;questions=data.questions;
    $('assignedEvaluationTitle').textContent=data.title;
    const form=$('assignedEvaluationForm');form.replaceChildren();resetResult();$('submitAssignedEvaluation').hidden=false;
    questions.forEach((q,i)=>{
      const box=el('section',null,'rl11-question');box.append(el('h4',`${i+1}. ${q.question_text}`));
      q.options.forEach((option,index)=>{
        const label=el('label',null,'rl11-option');const radio=el('input');radio.type='radio';radio.name='assigned_q'+i;radio.value=String(index);
        const span=el('span',`${String.fromCharCode(65+index)}. ${option}`);label.append(radio,span);box.append(label);
      });form.append(box);
    });
    runner.hidden=false;runner.scrollIntoView({behavior:'smooth',block:'start'});
  }
  $('cancelAssignedEvaluation').addEventListener('click',close);
  $('submitAssignedEvaluation').addEventListener('click',async()=>{
    if(busy||!assignment)return;
    const answers={};
    for(let i=0;i<questions.length;i++){
      const selected=$('assignedEvaluationForm').querySelector(`input[name="assigned_q${i}"]:checked`);
      if(!selected){say(`Jawab soal nomor ${i+1} terlebih dahulu.`,true);return;}
      answers[questions[i].id]=Number(selected.value);
    }
    busy=true;const btn=$('submitAssignedEvaluation');btn.disabled=true;say('Memeriksa jawaban di Supabase…');
    try{
      const res=await rpc('student_submit_evaluation',{p_assignment_id:assignment,p_answers:answers});
      const target=$('assignedEvaluationResult');target.replaceChildren();target.hidden=false;target.className='alert mt-2 success';
      target.append(el('h3',`Nilai: ${res.score}/100 (${res.correct_count}/${res.question_count} benar)`));
      target.append(el('p','Jawaban diperiksa oleh server. Hasil tersimpan dan dapat dilihat guru.'));
      for(const [i,r] of res.review.entries()){
        const block=el('p',`Soal ${i+1}: ${r.is_correct?'Benar':'Perlu diperbaiki'}. Jawaban tepat: ${r.correct_answer}. ${r.explanation||''}`);
        target.append(block);
      }
      $('assignedEvaluationForm').querySelectorAll('input').forEach(x=>x.disabled=true);
      btn.hidden=true;say('Nilai berhasil disimpan.');await board();
    }catch(e){say('Gagal menyimpan jawaban: '+e.message,true);}finally{busy=false;btn.disabled=false;}
  });
  board().catch(e=>say('Evaluasi kelas belum tersedia: '+e.message+'. Hubungi guru.',true));
})();
