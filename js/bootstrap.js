/* Auth gate: page scripts are loaded only after Supabase verifies identity and role. */
(async () => {
  const role=document.body.dataset.requiredRole || 'siswa';
  const showError = (text) => {
    document.documentElement.classList.remove('auth-pending');
    document.body.replaceChildren();
    const main=document.createElement('main');main.className='boot-error';
    const h=document.createElement('h1');h.textContent='RoutingLab tidak dapat dibuka';
    const p=document.createElement('p');p.textContent=text;
    const a=document.createElement('a');a.href='index.html';a.textContent='Kembali ke login';
    main.append(h,p,a);document.body.append(main);
  };
  const addScript=(src)=>new Promise((resolve,reject)=>{
    const s=document.createElement('script');s.src=src;
    s.onload=resolve;s.onerror=()=>reject(Error('Gagal memuat '+src));
    document.body.append(s);
  });
  try {
    const session=await RoutingAuth.verify();
    if(!session){ location.replace('index.html');return; }
    if(role!==session.role){location.replace(RoutingAuth.home(session.role));return;}
    await addScript('js/common.js');
    // Read central data before rendering progress widgets; account scope comes from auth.uid().
    if(role==='siswa') await RoutingProgress.hydrate(RoutingAuth.getClient(), session.id);
    const page=document.body.dataset.pageScript;
    if(page==='cli-lab'){
      await addScript('js/cli-engine.js');await addScript('js/cli-lab.js');
    } else if(page && page!=='none') await addScript('js/'+page+'.js');
    else initCommon(role);
    if(page!=='cli-lab') await addScript('js/sprint4a.js');
    document.documentElement.classList.remove('auth-pending');
    document.documentElement.classList.add('routing-ready');
  } catch(e) {console.error('Bootstrap RoutingLab:',e);showError(e.message||'Kesalahan sesi.');}
})();
