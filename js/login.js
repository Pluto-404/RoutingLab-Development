(() => {
  const form=document.getElementById('loginForm');
  const message=document.getElementById('loginMessage');
  const submit=form?.querySelector('[type="submit"]');
  const show=(text,bad=false)=>{message.textContent=text;message.className='alert '+(bad?'error':'success');};
  async function init(){
    try {
      const session=await RoutingAuth.verify();
      if(session){location.replace(RoutingAuth.home(session.role));return;}
      show('Gunakan email dan password akun Supabase untuk masuk.');
    } catch(e){show(e.message,true);if(submit) submit.disabled=true;}
  }
  form?.addEventListener('submit', async e=>{
    e.preventDefault(); submit.disabled=true;show('Memeriksa akun...');
    try {
      const user=await RoutingAuth.signIn(document.getElementById('username').value.trim(),document.getElementById('password').value);
      if(!user) throw Error('Gagal membaca akun. Silakan coba lagi.');
      show('Login berhasil. Mengalihkan ke dashboard...');
      location.replace(RoutingAuth.home(user.role));
    } catch(e){show(e.message,true);submit.disabled=false;}
  });
  init();
})();
