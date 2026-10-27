(async () => {
  const $ = (id) => document.getElementById(id);
  const message = (s, bad = false) => { $('portalMessage').textContent = s; $('portalMessage').className = 'portal-message' + (bad ? ' bad' : ''); };
  const cfg = window.ROUTINGLAB_SUPABASE;
  if (!cfg || !/^https:\/\/[^\s]+\.supabase\.co$/.test(cfg.url) || !cfg.publishableKey || cfg.publishableKey.includes('YOUR_')) {
    message('Supabase belum diatur. Ikuti README_SPRINT5.md untuk membuat js/supabase-config.js.', true);
    document.querySelectorAll('button[type=submit]').forEach(b => b.disabled = true);
    return;
  }
  if (!window.supabase?.createClient) { message('Library Supabase gagal dimuat. Periksa internet.', true); return; }
  const client = window.supabase.createClient(cfg.url, cfg.publishableKey);
  let userId = null;
  function showAuthenticated(profile) {
    $('authArea').hidden = true;
    $('workspace').hidden = false;
    $('who').textContent = `${profile?.full_name || 'Pengguna'} · ${profile?.role === 'guru' ? 'Guru' : 'Siswa'}`;
    $('teacherArea').hidden = profile?.role !== 'guru';
    $('studentArea').hidden = profile?.role !== 'siswa';
    $('teacherNote').hidden = profile?.role === 'guru';
  }
  async function refresh() {
    const { data: { user }, error: authError } = await client.auth.getUser();
    if (authError || !user) { userId = null; $('authArea').hidden = false; $('workspace').hidden = true; return; }
    userId = user.id;
    const { data: profile, error } = await client.from('profiles').select('full_name,role').eq('id', user.id).single();
    if (error) { message('Profil belum tersedia: ' + error.message, true); return; }
    showAuthenticated(profile);
    await loadClasses(profile.role);
    if (profile.role === 'siswa') await loadProgress();
  }
  async function loadClasses(role) {
    if (role === 'guru') {
      const { data, error } = await client.from('classes').select('id,name,code').order('created_at', {ascending:false});
      $('classList').textContent = error ? error.message : data?.length ? data.map(c => `${c.name} — kode: ${c.code}`).join(' | ') : 'Belum ada kelas';
    } else {
      const { data, error } = await client.from('class_memberships').select('class_id,classes(name,code)');
      $('myClasses').textContent = error ? error.message : data?.length ? data.map(c => `${c.classes?.name} (${c.classes?.code})`).join(' | ') : 'Belum bergabung kelas';
    }
  }
  $('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email=$('regEmail').value.trim(), password=$('regPassword').value, fullName=$('regName').value.trim();
    if (password.length < 8 || !fullName) { message('Isi nama dan password minimal 8 karakter.',true); return; }
    message('Mendaftarkan siswa...');
    const {data,error}=await client.auth.signUp({email,password,options:{data:{full_name:fullName}}});
    if(error) return message(error.message,true);
    message(data.session ? 'Akun dibuat, membuka dashboard...' : 'Pendaftaran dikirim. Cek email untuk konfirmasi sebelum login.');
    if(data.session) await refresh();
  });
  $('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();message('Memeriksa login...');
    const {error}=await client.auth.signInWithPassword({email:$('loginEmail').value.trim(),password:$('loginPassword').value});
    if(error) return message(error.message,true);
    message('Login berhasil.');await refresh();
  });
  $('logoutBtn').addEventListener('click', async()=> { const {error}=await client.auth.signOut(); if(error) return message(error.message,true); location.reload(); });
  $('createClassForm').addEventListener('submit',async e=> {
    e.preventDefault();
    const {data,error}=await client.rpc('create_class',{p_name:$('className').value.trim()});
    message(error ? error.message : `Kelas dibuat. Kode: ${data}`,!!error);
    if(!error) await loadClasses('guru');
  });
  $('joinClassForm').addEventListener('submit',async e=> {
    e.preventDefault();
    const {error}=await client.rpc('join_class',{p_code:$('classCode').value.trim().toUpperCase()});
    message(error ? error.message : 'Berhasil bergabung kelas!',!!error);
    if(!error) await loadClasses('siswa');
  });
  async function loadProgress() {
    const {data,error}=await client.from('user_progress').select('activity,percent').eq('user_id',userId);
    if(error) return message(error.message,true);
    $('savedProgress').textContent = data?.length ? data.map(x=>`${x.activity}: ${x.percent}%`).join(' | ') : 'Belum ada progres di database.';
  }
  $('saveProgressForm').addEventListener('submit',async e=> {
    e.preventDefault();
    const activity=$('activity').value, percent=Number($('percent').value);
    const {error}=await client.from('user_progress').upsert({user_id:userId,activity,percent},{onConflict:'user_id,activity'});
    message(error ? error.message : 'Progres berhasil disimpan ke Supabase.',!!error);
    if(!error) await loadProgress();
  });
  await refresh();
})();
