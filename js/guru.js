/* Sprint 7 — dashboard reads only teacher-owned class data through scoped RPCs. */
initCommon('guru');
(() => {
  'use strict';
  const api=RoutingAuth.getClient();
  const $=id=>document.getElementById(id);
  const tbody=$('studentRows'),recentBody=$('recentActivityRows'),filter=$('classFilter');
  const locale='id-ID';
  const activityNames={materi:'Materi',visualisasi:'Visualisasi',miniLab:'Mini Lab',troubleshooting:'Troubleshooting',evaluasi:'Evaluasi',cliLab:'CLI Lab'};
  let report=[],requestId=0;
  function text(id,value){if($(id))$(id).textContent=String(value);}
  function formatDate(value){if(!value)return 'Belum ada';const d=new Date(value);return Number.isNaN(d.valueOf())?'-':d.toLocaleString(locale,{dateStyle:'medium',timeStyle:'short'});}
  function messageRow(body,colSpan,value){body.replaceChildren();const tr=document.createElement('tr'),td=document.createElement('td');td.colSpan=colSpan;td.textContent=value;td.className='rl7-empty';tr.append(td);body.append(tr);}
  function setStatus(value,error=false){const el=$('teacherReportStatus');if(el){el.textContent=value;el.classList.toggle('rl7-error',error);}}
  function renderProgress(rows){
    tbody.replaceChildren();
    if(!rows.length){messageRow(tbody,7,'Belum ada siswa pada kelas yang dipilih.');return;}
    for(const r of rows){
      const tr=document.createElement('tr');
      const values=[r.student_name||'Siswa',r.class_name||'-',`${r.progress_percent||0}%`,`${r.completed_count||0}/5`,`${r.cli_percent||0}%`,String(r.activity_count||0),formatDate(r.last_activity_at)];
      values.forEach((value,i)=>{
        const td=document.createElement('td');
        if(i===2){const outer=document.createElement('div');outer.className='rl7-meter';
          const fill=document.createElement('span');fill.style.width=`${Math.max(0,Math.min(100,Number(r.progress_percent)||0))}%`;outer.append(fill);
          const span=document.createElement('strong');span.textContent=value;td.append(span,outer);
        }else td.textContent=value;
        tr.append(td);
      });tbody.append(tr);
    }
  }
  function renderRecent(rows){
    recentBody.replaceChildren();
    if(!rows.length){messageRow(recentBody,5,'Belum ada aktivitas latihan yang tercatat.');return;}
    rows.forEach(r=>{
      const tr=document.createElement('tr');
      const values=[formatDate(r.created_at),r.student_name||'Siswa',activityNames[r.activity]||r.activity,r.outcome==='passed'?'Berhasil':r.outcome==='completed'?'Diselesaikan':'Perlu mencoba lagi',r.score==null?'–':`${r.score}/100`];
      for(const value of values){const td=document.createElement('td');td.textContent=value;tr.append(td);}recentBody.append(tr);
    });
  }
  async function loadClasses(){
    const {data,error}=await api.from('classes').select('id,name,code').order('name');
    if(error)throw Error(error.message);
    filter.replaceChildren();const all=document.createElement('option');all.value='';all.textContent='Semua kelas saya';filter.append(all);
    (data||[]).forEach(c=>{const option=document.createElement('option');option.value=c.id;option.textContent=`${c.name} · ${c.code}`;filter.append(option);});
    text('classCount',String((data||[]).length));
  }
  async function loadReport(){
    const seq=++requestId,id=filter.value||null;
    setStatus('Memuat data latihan dari Supabase…');
    $('exportClassCsv').disabled=true;
    const params={p_class_id:id};
    const [a,b]=await Promise.all([api.rpc('teacher_progress_report',params),api.rpc('teacher_recent_events',{p_class_id:id,p_limit:20})]);
    if(seq!==requestId)return;
    if(a.error||b.error){
      const error=a.error||b.error;
      report=[];messageRow(tbody,7,'Belum dapat memuat laporan. Jalankan migrasi Sprint 7 terlebih dahulu.');
      messageRow(recentBody,5,'Riwayat tidak dapat dimuat.');
      text('studentCount','–');text('avgProgress','–');text('totalAttempts','–');
      setStatus('Gagal membaca data: '+error.message,true);return;
    }
    report=a.data||[];
    const unique=new Set(report.map(r=>r.student_id));
    text('studentCount',unique.size);
    text('avgProgress',(report.length?Math.round(report.reduce((total,r)=>total+(Number(r.progress_percent)||0),0)/report.length):0)+'%');
    text('totalAttempts',report.reduce((sum,r)=>sum+(Number(r.activity_count)||0),0));
    renderProgress(report);renderRecent(b.data||[]);
    $('exportClassCsv').disabled=!report.length;
    setStatus(`Diperbarui ${formatDate(new Date().toISOString())} · Persentase dan skor latihan berasal dari aktivitas siswa, belum diverifikasi sebagai nilai resmi.`);
  }
  function csvValue(value){
    let s=String(value??'').replace(/\r|\n/g,' ');
    // Protect spreadsheet programs from formula injection in untrusted student names.
    if(/^[\s]*[=+\-@]/.test(s))s="'"+s;
    return '"'+s.replace(/"/g,'""')+'"';
  }
  function exportCsv(){
    if(!report.length)return;
    const head=['Nama siswa','Kelas','Progres utama (%)','Aktivitas selesai (/5)','CLI Lab (%)','Aktivitas tercatat','Terakhir aktif'];
    const rows=report.map(r=>[r.student_name,r.class_name,r.progress_percent,r.completed_count,r.cli_percent,r.activity_count,formatDate(r.last_activity_at)]);
    const csv='\uFEFF'+[head,...rows].map(values=>values.map(csvValue).join(',')).join('\r\n');
    const blob=new Blob([csv],{type:'text/csv;charset=utf-8;'}),url=URL.createObjectURL(blob),link=document.createElement('a');
    link.href=url;link.download=`RoutingLab_Laporan_Latihan_${new Date().toISOString().slice(0,10)}.csv`;
    link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  filter.addEventListener('change',()=>loadReport().catch(e=>setStatus(e.message,true)));
  $('refreshClassReport').addEventListener('click',()=>loadReport().catch(e=>setStatus(e.message,true)));
  $('exportClassCsv').addEventListener('click',exportCsv);
  loadClasses().then(loadReport).catch(e=>{
    setStatus('Gagal memuat kelas: '+e.message,true);
    messageRow(tbody,7,'Gagal memuat data. Periksa koneksi Supabase.');
  });
})();
