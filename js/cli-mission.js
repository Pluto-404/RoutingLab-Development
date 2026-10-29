/* Sprint 8: attach an authorized classroom mission to the existing CLI simulator. */
(() => {
  'use strict';
  const label=document.getElementById('assignmentMissionLabel');
  const detail=document.getElementById('assignmentMissionInfo');
  const summary=document.querySelector('.mission-summary');
  if(!label||!detail||!summary||!window.RoutingCLILab)return;
  const params=new URLSearchParams(location.search),id=params.get('assignment');
  if(!id)return; // Free CLI practice works exactly as before.
  const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const notice=(text,bad=false)=>{detail.textContent=text;detail.classList.toggle('rl8-error',bad);};
  const checkButton=document.getElementById('checkMission');
  if(checkButton)checkButton.disabled=true;
  if(!uuid.test(id)){notice('ID penugasan tidak valid. Buka misi dari Dashboard Siswa.',true);return;}
  const api=RoutingAuth.getClient();let assignment=null,started=Date.now(),saving=false;
  const make=(tag,text,cls)=>{const e=document.createElement(tag);e.textContent=text;if(cls)e.className=cls;return e;};
  async function initialize(){
    notice('Memeriksa misi dan keanggotaan kelas…');
    const {data,error}=await api.rpc('student_mission_board');
    if(error)throw Error(error.message);
    assignment=(data||[]).find(item=>item.assignment_id===id)||null;
    if(!assignment){notice('Penugasan tidak tersedia, tidak aktif, atau bukan kelasmu. Buka kembali Dashboard Siswa.',true);return;}
    started=Date.now();
    summary.replaceChildren(
      make('span',assignment.class_name+' · MISI KELAS','mission-label'),
      make('strong',assignment.mission_title),
      make('p',assignment.mission_description)
    );
    label.textContent=assignment.mission_title;
    // The beginner mission keeps its guided steps; diagnosis missions hide the answer walkthrough.
    if(assignment.scenario!=='empty') {
      document.querySelector('.guide-panel')?.setAttribute('hidden','');
      document.querySelector('.terminal-help')?.setAttribute('hidden','');
    }
    // Classroom challenges should not switch to a different scenario while being recorded.
    const select=document.getElementById('scenarioSelect'),button=document.getElementById('loadScenario');
    select.value=assignment.scenario;select.disabled=true;button.disabled=true;
    window.RoutingCLILab.loadScenario(assignment.scenario);
    if(checkButton)checkButton.disabled=false;
    notice(`Kelas ${assignment.class_name} · ${assignment.attempt_count} percobaan sebelumnya · ${assignment.passed?'Pernah berhasil':'Belum berhasil'}. Mulai diagnosis dengan CLI.`);
  }
  window.RoutingCLIMission={
    async recordValidation(ok){
      if(!assignment||saving)return;
      saving=true;
      const sec=Math.min(21600,Math.max(0,Math.floor((Date.now()-started)/1000)));
      notice('Menyimpan percobaan ke kelas…');
      try{
        const {error}=await api.rpc('student_submit_mission_attempt',{
          p_assignment_id:assignment.assignment_id,p_outcome:ok?'passed':'retry',p_duration_seconds:sec
        });
        if(error)throw Error(error.message);
        assignment.attempt_count=Number(assignment.attempt_count||0)+1;
        if(ok)assignment.passed=true;
        notice(`${ok?'Berhasil!':'Perlu mencoba lagi.'} Percobaan #${assignment.attempt_count} tersimpan ke kelas ${assignment.class_name}. ${sec} detik sejak misi dimuat.`);
      }catch(e){notice('Hasil lab belum tersimpan ke kelas: '+e.message+'. Periksa koneksi atau penugasan.',true);}
      finally{saving=false;}
    }
  };
  initialize().catch(e=>notice('Gagal membuka penugasan: '+e.message+'. Pastikan migrasi Sprint 8 sudah dijalankan.',true));
})();
