/* Sprint 8: signed-in student's class assignments; no example/mock progress. */
(() => {
  'use strict';
  const root = document.getElementById('studentMissionList');
  const status = document.getElementById('studentMissionStatus');
  const counter = document.getElementById('studentMissionCount');
  if (!root || !status || !RoutingAuth.requireRole('siswa')) return;
  const api = RoutingAuth.getClient();
  const msg = (v,bad=false) => {status.textContent=v;status.classList.toggle('rl8-error',bad);};
  const addText=(node,tag,text,cls='')=>{
    const el=document.createElement(tag);el.textContent=text;if(cls)el.className=cls;node.append(el);return el;
  };
  async function refresh(){
    msg('Memuat penugasan dari kelas…');
    const {data,error}=await api.rpc('student_mission_board');
    if(error){root.replaceChildren();counter.textContent='–';msg('Penugasan tidak dapat dimuat: '+error.message+' (cek migrasi Sprint 8).',true);return;}
    root.replaceChildren();counter.textContent=String((data||[]).length);
    if(!data?.length){msg('Belum ada misi yang ditugaskan. Bergabunglah ke kelas atau hubungi guru.');return;}
    msg('Misi di bawah berasal dari kelas yang kamu ikuti. Hasilnya adalah latihan formatif.');
    data.forEach(m=>{
      const card=document.createElement('article');card.className='rl8-mission-card';
      const top=document.createElement('div');top.className='rl8-card-top';
      addText(top,'span',m.class_name,'rl8-kicker');
      addText(top,'span',m.passed?'Selesai':m.attempt_count?'Perlu dilanjutkan':'Belum dimulai','rl8-pill '+(m.passed?'rl8-done':''));
      card.append(top);
      addText(card,'h4',m.mission_title);
      addText(card,'p',m.mission_description);
      const bottom=document.createElement('div');bottom.className='rl8-card-bottom';
      addText(bottom,'span',`${m.attempt_count||0} percobaan`,'rl8-small');
      const link=document.createElement('a');link.className='btn btn-primary rl8-small-button';
      link.href='cli-lab.html?assignment='+encodeURIComponent(m.assignment_id);
      link.textContent=m.passed?'Latihan lagi':m.attempt_count?'Lanjutkan':'Mulai misi';bottom.append(link);
      card.append(bottom);root.append(card);
    });
  }
  const refreshButton=document.getElementById('refreshStudentMissions');
  if(refreshButton)refreshButton.addEventListener('click',()=>refresh().catch(e=>msg(e.message,true)));
  refresh().catch(e=>msg(e.message,true));
})();
