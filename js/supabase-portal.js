(() => {
  const $ = id=>document.getElementById(id);
  const message=(text,bad=false)=>{$('portalMessage').textContent=text;$('portalMessage').className='portal-message'+(bad?' bad':'');};
  let api,userId=null;
  try { api=RoutingAuth.getClient(); }
  catch(e){message(e.message,true);document.querySelectorAll('button[type=submit]').forEach(b=>b.disabled=true);return;}
  const showGuest=()=>{$('authArea').hidden=false;$('workspace').hidden=true;};
  async function refresh(){
    try {
      const profile=await RoutingAuth.verify();
      if(!profile){userId=null;showGuest();return;}
      userId=profile.id;
      $('authArea').hidden=true;$('workspace').hidden=false;
      $('who').textContent=profile.name+' · '+(profile.role==='guru'?'Guru':'Siswa');
      $('teacherArea').hidden=profile.role!=='guru';$('studentArea').hidden=profile.role!=='siswa';
      $('teacherNote').hidden=profile.role==='guru';
      $('dashboardLink').href=RoutingAuth.home(profile.role);
      await loadClasses(profile.role);
    }catch(e){message(e.message,true);}
  }
  async function loadClasses(role){
    if(role==='guru'){
      const {data,error}=await api.from('classes').select('id,name,code').order('created_at',{ascending:false});
      $('classList').textContent=error?error.message:data?.length?data.map(c=>`${c.name} — Kode: ${c.code}`).join(' · '):'Belum ada kelas.';
    }else{
      const {data,error}=await api.from('class_memberships').select('class_id,classes(name,code)');
      $('myClasses').textContent=error?error.message:data?.length?data.map(c=>`${c.classes?.name||'Kelas'} (${c.classes?.code||'-'})`).join(' · '):'Belum bergabung kelas.';
    }
  }
  $('registerForm').addEventListener('submit',async e=>{
    e.preventDefault();const name=$('regName').value.trim(),email=$('regEmail').value.trim(),password=$('regPassword').value;
    if(name.length<2||password.length<8){message('Nama minimal 2 karakter, password minimal 8 karakter.',true);return;}
    message('Memproses pendaftaran...');
    const {data,error}=await api.auth.signUp({email,password,options:{data:{full_name:name},emailRedirectTo:location.origin+location.pathname}});
    if(error)return message(error.message,true);
    message(data.session?'Akun dibuat, membuka halaman akun...':'Periksa email konfirmasi. Buka tautan pada browser laptop yang menjalankan Live Server.');
    if(data.session) await refresh();
  });
  $('loginForm').addEventListener('submit',async e=>{
    e.preventDefault();message('Memeriksa login...');
    try {await RoutingAuth.signIn($('loginEmail').value.trim(),$('loginPassword').value);message('Login berhasil.');await refresh();}
    catch(e){message(e.message,true);}
  });
  $('logoutBtn').addEventListener('click',()=>RoutingAuth.logout());
  $('createClassForm').addEventListener('submit',async e=>{
    e.preventDefault();const {data,error}=await api.rpc('create_class',{p_name:$('className').value.trim()});
    message(error?error.message:`Kelas dibuat. Kode: ${data}`,!!error);if(!error)await loadClasses('guru');
  });
  $('joinClassForm').addEventListener('submit',async e=>{
    e.preventDefault();const {error}=await api.rpc('join_class',{p_code:$('classCode').value.trim().toUpperCase()});
    message(error?error.message:'Berhasil bergabung dengan kelas.',!!error);if(!error)await loadClasses('siswa');
  });
  refresh();
})();
