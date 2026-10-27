initCommon('guru');
(async()=>{
  const tbody=document.getElementById('studentRows'),count=document.getElementById('studentCount'),avg=document.getElementById('avgProgress');
  if(!tbody) return;
  tbody.replaceChildren();
  const client=RoutingAuth.getClient();
  const {data,error}=await client.rpc('teacher_dashboard');
  if(error){
    const tr=document.createElement('tr');const td=document.createElement('td');td.colSpan=5;
    td.textContent='Belum bisa memuat monitoring: '+error.message+'. Pastikan migrasi Sprint 6 sudah dijalankan.';
    tr.append(td);tbody.append(tr);count.textContent='–';avg.textContent='–';return;
  }
  const students=new Set((data||[]).map(r=>r.student_id));
  const rows=data||[];
  count.textContent=String(students.size);
  avg.textContent=(rows.length ? Math.round(rows.reduce((t,r)=>t+(Number(r.progress_percent)||0),0)/rows.length):0)+'%';
  if(!rows.length){const tr=document.createElement('tr');const td=document.createElement('td');td.colSpan=5;td.textContent='Belum ada siswa di kelasmu.';tr.append(td);tbody.append(tr);}
  for(const r of rows){
    const tr=document.createElement('tr');
    for(const value of [r.student_name||'Siswa',r.class_name||'-',(r.progress_percent??0)+'%','Progres latihan','Supabase']){
      const td=document.createElement('td');td.textContent=String(value);tr.append(td);
    }
    tbody.append(tr);
  }
})();
