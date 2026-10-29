/* Sprint 8 teacher-only class mission assignment and formative monitoring. */
(() => {
  'use strict';
  if (!RoutingAuth.requireRole('guru')) return;
  const $ = id=>document.getElementById(id);
  const api=RoutingAuth.getClient();
  const status=$('teacherMissionStatus'),form=$('assignMissionForm'),cls=$('missionClassSelect'),mission=$('missionSelect');
  const body=$('teacherMissionRows'),history=$('teacherMissionAttempts');
  if(!status||!form||!cls||!mission||!body||!history)return;
  let classes=[],catalog=[],request=0;
  const setStatus=(message,bad=false)=>{status.textContent=message;status.classList.toggle('rl8-error',bad);};
  const cell=(tr,txt)=>{const td=document.createElement('td');td.textContent=String(txt);tr.append(td);return td;};
  const blank=(target,count,txt)=>{target.replaceChildren();const tr=document.createElement('tr'),td=cell(tr,txt);td.colSpan=count;target.append(tr);};
  const date=v=>v?new Date(v).toLocaleString('id-ID',{dateStyle:'medium',timeStyle:'short'}):'–';
  function loadOptions(){
    cls.replaceChildren();mission.replaceChildren();
    for(const c of classes){const opt=document.createElement('option');opt.value=c.id;opt.textContent=c.name+' · '+c.code;cls.append(opt);}
    for(const m of catalog){const opt=document.createElement('option');opt.value=m.code;opt.textContent=m.title;mission.append(opt);}
    $('assignMissionBtn').disabled=!classes.length||!catalog.length;
    if(!classes.length)setStatus('Buat kelas terlebih dahulu melalui Akun & Kelas.');
  }
  function displayAssignments(rows){
    body.replaceChildren();
    if(!rows.length){blank(body,7,'Belum ada penugasan pada kelas ini.');return;}
    for(const a of rows){
      const tr=document.createElement('tr');
      cell(tr,a.mission_title);cell(tr,a.class_name);
      cell(tr,a.is_active?'Aktif':'Dinonaktifkan');
      cell(tr,`${a.completed_students}/${a.total_students}`);
      cell(tr,`${a.started_students}/${a.total_students}`);
      cell(tr,a.attempts_count);
      const td=document.createElement('td');
      const btn=document.createElement('button');btn.type='button';btn.className='btn btn-outline rl8-table-button';
      btn.textContent=a.is_active?'Nonaktifkan':'Aktifkan';
      btn.addEventListener('click',async()=>{
        if(a.is_active&&!confirm(`Nonaktifkan misi "${a.mission_title}" untuk kelas ${a.class_name}? Riwayat tetap disimpan.`))return;
        btn.disabled=true;
        const response=a.is_active?await api.rpc('teacher_unassign_mission',{p_assignment_id:a.assignment_id}):await api.rpc('teacher_assign_mission',{p_class_id:a.class_id,p_mission_code:a.mission_code});
        if(response.error){setStatus(response.error.message,true);btn.disabled=false;return;}
        setStatus(a.is_active?'Misi dinonaktifkan. Riwayat tetap tersimpan.':'Misi kembali aktif.');
        await refreshReport();
      });td.append(btn);tr.append(td);body.append(tr);
    }
  }
  function displayHistory(rows){
    history.replaceChildren();
    if(!rows.length){blank(history,5,'Belum ada percobaan misi dari siswa.');return;}
    for(const row of rows){const tr=document.createElement('tr');
      cell(tr,date(row.created_at));cell(tr,row.student_name);cell(tr,row.mission_title);
      cell(tr,row.outcome==='passed'?'Berhasil':'Perlu mencoba lagi');
      cell(tr,row.duration_seconds==null?'–':`${Math.floor(row.duration_seconds/60)} m ${row.duration_seconds%60} d`);
      history.append(tr);
    }
  }
  async function refreshReport(){
    const seq=++request,selected=$('classFilter')?.value||null;
    const [a,b]=await Promise.all([
      api.rpc('teacher_mission_report',{p_class_id:selected}),
      api.rpc('teacher_mission_attempts',{p_class_id:selected,p_limit:30})
    ]);
    if(seq!==request)return;
    if(a.error||b.error){setStatus('Gagal memuat penugasan: '+(a.error||b.error).message,true);return;}
    displayAssignments(a.data||[]);displayHistory(b.data||[]);
    $('missionAssignmentCount').textContent=(a.data||[]).filter(x=>x.is_active).length;
    setStatus('Monitoring misi diperbarui. Status berasal dari percobaan yang dilaporkan browser siswa.');
  }
  async function initialize(){
    setStatus('Mengambil daftar misi dan kelas…');
    const [a,b]=await Promise.all([
      api.from('classes').select('id,name,code').order('name'),api.rpc('list_missions')
    ]);
    if(a.error||b.error)throw Error((a.error||b.error).message);
    classes=a.data||[];catalog=b.data||[];loadOptions();await refreshReport();
  }
  form.addEventListener('submit',async e=>{
    e.preventDefault();if(!cls.value||!mission.value)return;
    const btn=$('assignMissionBtn');btn.disabled=true;setStatus('Menyimpan penugasan…');
    try{
      const {error}=await api.rpc('teacher_assign_mission',{p_class_id:cls.value,p_mission_code:mission.value});
      if(error)throw Error(error.message);
      await refreshReport();setStatus('Misi berhasil ditugaskan ke kelas.');
    }catch(err){setStatus('Penugasan gagal: '+err.message,true);}finally{btn.disabled=false;}
  });
  const classFilter=$('classFilter');
  if(classFilter)classFilter.addEventListener('change',()=>refreshReport().catch(e=>setStatus(e.message,true)));
  $('refreshTeacherMissions').addEventListener('click',()=>refreshReport().catch(e=>setStatus(e.message,true)));
  initialize().catch(e=>{setStatus('Gagal memuat fitur Sprint 8: '+e.message+'. Pastikan SQL Sprint 8 sudah dijalankan.',true);blank(body,7,'Belum dapat memuat penugasan.');});
})();
