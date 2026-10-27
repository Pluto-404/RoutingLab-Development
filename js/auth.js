/* RoutingLab Sprint 6 — auth Supabase; never trust a browser-created role. */
const RoutingAuth = (() => {
  let client = null, current = null;
  const home = role => role === 'guru' ? 'dashboard-guru.html' : 'dashboard-siswa.html';
  function getClient() {
    if (client) return client;
    const cfg = window.ROUTINGLAB_SUPABASE;
    if (!cfg || !/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(cfg.url || '') || !cfg.publishableKey || cfg.publishableKey.includes('YOUR_'))
      throw Error('Konfigurasi Supabase belum tersedia. Periksa js/supabase-config.js dan README_SPRINT6.md.');
    if (!window.supabase?.createClient) throw Error('Library Supabase tidak termuat. Periksa koneksi internet.');
    client = window.supabase.createClient(cfg.url.replace(/\/$/, ''),cfg.publishableKey);
    return client;
  }
  async function verify() {
    const api = getClient();
    const { data: { user }, error: authError } = await api.auth.getUser();
    if (authError || !user) { current=null; return null; }
    const { data: profile, error } = await api.from('profiles').select('full_name,role').eq('id',user.id).single();
    if (error) throw Error('Gagal membaca profil: ' + error.message);
    if (!profile || !['siswa','guru'].includes(profile.role)) throw Error('Role akun tidak valid. Hubungi pengelola.');
    let classCode = '-';
    try {
      if (profile.role === 'guru') {
        const {data} = await api.from('classes').select('code').order('created_at',{ascending:false}).limit(1);
        classCode=data?.[0]?.code || '-';
      } else {
        const {data} = await api.from('class_memberships').select('classes(code)').limit(1);
        classCode = data?.[0]?.classes?.code || '-';
      }
    } catch (err) { console.warn('Kode kelas tidak termuat',err); }
    current = { id:user.id, username:user.id, role:profile.role, name:profile.full_name || 'Pengguna',classCode,email:user.email };
    return current;
  }
  async function signIn(email,password) {
    const { error } = await getClient().auth.signInWithPassword({email,password});
    if (error) throw Error(error.message);
    return await verify();
  }
  async function logout() {
    try { await getClient().auth.signOut(); } catch(e){console.warn(e);}
    current=null; location.replace('index.html');
  }
  function requireRole(role) {
    if (!current || (role && current.role !== role)) return null;
    return current;
  }
  return {getClient,verify,signIn,logout,requireRole,getSession:()=>current,home};
})();
