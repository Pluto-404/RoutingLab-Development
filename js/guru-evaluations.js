/* Sprint 11 — Teacher evaluation CRUD, assignments and reviewed results. */
(() => {
  'use strict';
  if (!RoutingAuth.requireRole('guru')) return;
  initCommon('guru');
  const $ = id => document.getElementById(id);
  const api = RoutingAuth.getClient();
  const status = $('teacherEvaluationStatus');
  if (!status) return;
  const say=(msg,bad=false)=>{status.textContent=msg;status.classList.toggle('rl11-error',bad);};
  const rpc=async(name,args={})=>{
    const {data,error}=await api.rpc(name,args);
    if(error)throw Error(error.message);
    return data;
  };
  const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!=null)n.textContent=String(text);if(cls)n.className=cls;return n;};
  const action=(text,handler,cls='btn btn-outline')=>{const n=el('button',text,cls);n.type='button';n.addEventListener('click',async()=>{n.disabled=true;try{await handler();}catch(e){say(e.message,true);}finally{n.disabled=false;}});return n;};
  let sets=[],classes=[],assignments=[],questions=[],chosen=null;
  const current=()=>sets.find(x=>x.id===chosen);
  const locked=()=>Number(current()?.assignment_count||0)>0;
  function setSelected(id){chosen=id||null;const s=current();$('evalPicker').value=chosen||'';
    $('evalTitle').value=s?.title||'';$('evalDescription').value=s?.description||'';
    $('evalDeleteBtn').disabled=!s||locked();$('evalQuestionSave').disabled=!s||locked();$('evalAssignBtn').disabled=!s;
    $('evalQuestionForm').hidden=!s;clearQuestion();
  }
  function clearQuestion(){
    $('evalQuestionId').value='';$('evalQuestionText').value='';$('evalCorrectIndex').value='0';$('evalExplanation').value='';
    for(let i=0;i<4;i++)$('evalOption'+i).value='';
    $('evalQuestionSave').textContent='Tambah soal';
  }
  function choices(){const picker=$('evalPicker');picker.replaceChildren();const newOpt=el('option','+ Evaluasi baru');newOpt.value='';picker.append(newOpt);
    for(const s of sets){const opt=el('option',`${s.title} (${s.question_count} soal)`);opt.value=s.id;picker.append(opt);}
    picker.value=chosen||'';
  }
  function renderQuestions(){const box=$('evalQuestionRows');box.replaceChildren();
    if(!chosen){box.append(el('p','Buat evaluasi untuk menambahkan soal.','rl11-muted'));return;}
    if(!questions.length){box.append(el('p','Belum ada soal. Tambahkan minimal satu soal.','rl11-muted'));return;}
    questions.forEach((q,i)=>{
      const row=el('div',null,'rl11-question-row');const info=el('div');info.append(el('strong',`${i+1}. ${q.question_text}`),el('p',`Kunci: ${String.fromCharCode(65+q.correct_index)} · ${q.options[q.correct_index]}`));
      const actions=el('div',null,'rl11-action-row');
      if(!locked()){
        actions.append(action('Edit',()=>{
          $('evalQuestionId').value=q.id;$('evalQuestionText').value=q.question_text;$('evalExplanation').value=q.explanation||'';
          $('evalCorrectIndex').value=String(q.correct_index);
          for(let k=0;k<4;k++)$('evalOption'+k).value=q.options[k];
          $('evalQuestionSave').textContent='Simpan perubahan soal';$('evalQuestionText').focus();
        }));
        actions.append(action('Hapus',async()=>{
          if(!confirm('Hapus soal ini?'))return;
          await rpc('teacher_delete_evaluation_question',{p_question_id:q.id});await reload();say('Soal dihapus.');
        }));
      }
      row.append(info,actions);box.append(row);
    });
    if(locked())box.append(el('p','Soal terkunci karena evaluasi pernah ditugaskan. Untuk revisi buat evaluasi baru.','rl11-muted'));
  }
  function renderAssignments(){const body=$('evalAssignmentRows');body.replaceChildren();
    if(!assignments.length){const tr=el('tr'),td=el('td','Belum ada evaluasi yang ditugaskan.');td.colSpan=5;tr.append(td);body.append(tr);return;}
    for(const a of assignments){const tr=el('tr');
      [a.title,a.class_name,a.is_active?'Aktif':'Nonaktif',String(a.attempts)].forEach(v=>tr.append(el('td',v)));
      const td=el('td');td.append(action(a.is_active?'Nonaktifkan':'Aktifkan',async()=>{
        await rpc('teacher_set_evaluation_assignment',{p_evaluation_id:a.evaluation_id,p_class_id:a.class_id,p_active:!a.is_active});
        await reload();say('Status penugasan diperbarui.');
      }));tr.append(td);body.append(tr);
    }
  }
  function renderResults(rows){const body=$('evalResultRows');body.replaceChildren();
    if(!rows.length){const tr=el('tr'),td=el('td','Belum ada hasil evaluasi siswa.');td.colSpan=5;tr.append(td);body.append(tr);return;}
    rows.forEach(r=>{const tr=el('tr');
      const date=r.submitted_at?new Date(r.submitted_at).toLocaleString('id-ID',{dateStyle:'medium',timeStyle:'short'}):'–';
      [r.student_name,r.class_name,r.title,`${r.score}/100 (${r.correct_count}/${r.question_count})`,date].forEach((t,i)=>{
        const td=el('td',t);if(i===3)td.className='rl11-score';tr.append(td);
      });body.append(tr);
    });
  }
  async function loadQuestionList(){questions=chosen?await rpc('teacher_evaluation_questions',{p_evaluation_id:chosen}):[];renderQuestions();}
  async function reload(){
    const [items,as,results]=await Promise.all([
      rpc('teacher_evaluations'),rpc('teacher_evaluation_assignments'),
      rpc('teacher_evaluation_results',{p_class_id:$('classFilter')?.value||null})
    ]);
    sets=items||[];assignments=as||[];
    if(!sets.some(x=>x.id===chosen))chosen=null;
    choices();setSelected(chosen);await loadQuestionList();renderAssignments();renderResults(results||[]);
  }
  async function init(){
    say('Memuat evaluasi…');
    const {data,error}=await api.from('classes').select('id,name,code').order('name');
    if(error)throw Error(error.message);
    classes=data||[];
    const pick=$('evalAssignClass');pick.replaceChildren();
    for(const c of classes){const opt=el('option',`${c.name} · ${c.code}`);opt.value=c.id;pick.append(opt);}
    $('evalAssignBtn').disabled=!classes.length;
    const filter=$('classFilter');
    if(filter){filter.replaceChildren();const all=el('option','Semua kelas');all.value='';filter.append(all);
      for(const c of classes){const opt=el('option',c.name);opt.value=c.id;filter.append(opt);}}
    await reload();say('Siap. Buat evaluasi dan tambahkan soal sebelum menugaskan.');
  }
  $('evalPicker').addEventListener('change',async e=>{
    setSelected(e.target.value||null);
    try{await loadQuestionList();}catch(err){say(err.message,true);}
  });
  $('evalSaveForm').addEventListener('submit',async e=>{
    e.preventDefault();const btn=$('evalSaveBtn');btn.disabled=true;
    try{
      chosen=await rpc('teacher_save_evaluation',{
        p_evaluation_id:chosen,p_title:$('evalTitle').value.trim(),p_description:$('evalDescription').value.trim()
      });
      await reload();say('Evaluasi berhasil disimpan.');
    }catch(err){say(err.message,true);}finally{btn.disabled=false;}
  });
  $('evalDeleteBtn').addEventListener('click',async()=>{
    if(!chosen||!confirm('Hapus evaluasi ini? Hanya draft yang belum ditugaskan dapat dihapus.'))return;
    try{await rpc('teacher_delete_evaluation',{p_evaluation_id:chosen});chosen=null;await reload();say('Draft evaluasi dihapus.');}
    catch(err){say(err.message,true);}
  });
  $('evalQuestionForm').addEventListener('submit',async e=>{
    e.preventDefault();if(!chosen||locked())return;
    const btn=$('evalQuestionSave');btn.disabled=true;
    try{
      await rpc('teacher_upsert_evaluation_question',{
        p_evaluation_id:chosen,p_question_id:$('evalQuestionId').value||null,
        p_question_text:$('evalQuestionText').value.trim(),
        p_options:[0,1,2,3].map(i=>$('evalOption'+i).value.trim()),
        p_correct_index:Number($('evalCorrectIndex').value),p_explanation:$('evalExplanation').value.trim()
      });await reload();say('Soal berhasil disimpan.');
    }catch(err){say(err.message,true);}finally{btn.disabled=locked();}
  });
  $('evalQuestionCancel').addEventListener('click',clearQuestion);
  $('evalAssignForm').addEventListener('submit',async e=>{
    e.preventDefault();if(!chosen||!$('evalAssignClass').value)return;
    const btn=$('evalAssignBtn');btn.disabled=true;
    try{
      await rpc('teacher_set_evaluation_assignment',{
        p_evaluation_id:chosen,p_class_id:$('evalAssignClass').value,p_active:true
      });await reload();say('Evaluasi berhasil ditugaskan ke kelas.');
    }catch(err){say(err.message,true);}finally{btn.disabled=!chosen||!classes.length;}
  });
  $('evalRefresh').addEventListener('click',()=>reload().then(()=>say('Data diperbarui.')).catch(e=>say(e.message,true)));
  $('classFilter')?.addEventListener('change',()=>{
    rpc('teacher_evaluation_results',{p_class_id:$('classFilter').value||null})
      .then(renderResults).catch(e=>say(e.message,true));
  });
  init().catch(e=>say('Evaluasi guru belum tersedia: '+e.message+'. Jalankan SQL Sprint 11 di Supabase.',true));
})();
