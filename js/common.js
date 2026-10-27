/* RoutingLab Sprint 6: progress cache per Supabase user; percentages synchronize to PostgreSQL. */
const ROUTINGLAB_PROGRESS_VERSION = 2;
const ROUTINGLAB_PROGRESS_FIELDS = [
  "materi",
  "visualisasi",
  "miniLab",
  "troubleshooting",
  "evaluasi",
];

function initCommon(expectedRole) {
  const session = RoutingAuth.requireRole(expectedRole);
  if (!session) return null;
  document.querySelectorAll("[data-user-name]").forEach((el) => {
    el.textContent = session.name || "Pengguna";
  });
  document.querySelectorAll("[data-user-role]").forEach((el) => {
    el.textContent = session.role === "guru" ? "Guru/Admin" : "Siswa";
  });
  document.querySelectorAll("[data-class-code]").forEach((el) => {
    el.textContent = session.classCode || "-";
  });
  document
    .querySelectorAll("[data-logout]")
    .forEach((btn) => btn.addEventListener("click", RoutingAuth.logout));
  const page = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav a").forEach((a) => {
    if (a.getAttribute("href") === page) a.classList.add("active");
  });
  return session;
}

function getProgressStorageKey() {
  const session = RoutingAuth.getSession();
  // Separate demo accounts in one browser; DO NOT treat username as a security boundary.
  const username =
    session && typeof session.id === "string" && session.id
      ? session.id
      : session && typeof session.username === "string" && session.username
      ? session.username : "anonymous";
  return `routinglab_progress_v${ROUTINGLAB_PROGRESS_VERSION}:${encodeURIComponent(username)}`;
}

function createEmptyProgress() {
  return {
    materi: 0,
    visualisasi: 0,
    miniLab: 0,
    troubleshooting: 0,
    evaluasi: 0,
    cliLab: 0,
    bestScore: 0,
    evaluationAttempts: 0,
    lastQuizScore: null,
    evaluationMastered: false,
    updatedAt: null,
  };
}

function normalizeProgress(value) {
  const output = createEmptyProgress();
  if (!value || typeof value !== "object" || Array.isArray(value))
    return output;
  for (const field of [...ROUTINGLAB_PROGRESS_FIELDS, "cliLab", "bestScore"]) {
    const n = Number(value[field]);
    output[field] = Number.isFinite(n)
      ? Math.min(100, Math.max(0, Math.round(n)))
      : 0;
  }
  const attempts = Number(value.evaluationAttempts);
  output.evaluationAttempts = Number.isInteger(attempts)
    ? Math.min(100000, Math.max(0, attempts))
    : 0;
  const last = Number(value.lastQuizScore);
  output.lastQuizScore =
    value.lastQuizScore == null || !Number.isFinite(last)
      ? null
      : Math.min(100, Math.max(0, Math.round(last)));
  output.evaluationMastered =
    Boolean(value.evaluationMastered) || output.bestScore >= 80;
  output.updatedAt =
    typeof value.updatedAt === "string" ? value.updatedAt : null;
  return output;
}

function loadProgress() {
  try {
    return normalizeProgress(
      JSON.parse(localStorage.getItem(getProgressStorageKey())),
    );
  } catch (err) {
    console.warn("Progres demo tidak terbaca; menggunakan nilai awal.", err);
    return createEmptyProgress();
  }
}

function saveProgress(next) {
  const clean = normalizeProgress(next);
  clean.updatedAt = new Date().toISOString();
  try {
    localStorage.setItem(getProgressStorageKey(), JSON.stringify(clean));
  } catch (err) {
    console.error("Progres demo gagal disimpan ke browser.", err);
    return false;
  }
  // Optimistic local cache; remote save status is reported separately, never a trusted grade.
  if (typeof RoutingProgress !== 'undefined') RoutingProgress.enqueue(clean);
  return true;
}

function totalProgress() {
  const p = loadProgress();
  return Math.round(
    ROUTINGLAB_PROGRESS_FIELDS.reduce((total, field) => total + p[field], 0) /
      ROUTINGLAB_PROGRESS_FIELDS.length,
  );
}


/* A single queued write at a time prevents stale requests overwriting recent progress. */
const RoutingProgress = (() => {
  const fields = [...ROUTINGLAB_PROGRESS_FIELDS, 'cliLab'];
  let api=null, userId=null, tail=Promise.resolve(), previous={},hydrated=false;
  function status(msg,bad=false){
    let el=document.getElementById('progressSyncStatus');
    if(!el){el=document.createElement('div');el.id='progressSyncStatus';el.className='sync-indicator';document.body.append(el);}
    el.textContent=msg;el.classList.toggle('sync-error',bad);
    window.dispatchEvent(new CustomEvent('routinglab:sync',{detail:{message:msg,error:bad}}));
  }
  async function hydrate(client,id){
    api=client;userId=id;
    const {data,error}=await api.from('user_progress').select('activity,percent').eq('user_id',id);
    if(error){status('Progres belum tersinkron: '+error.message,true);return;}
    const p=loadProgress();
    for(const f of fields) p[f]=0;
    for(const row of data||[]) if(fields.includes(row.activity)) p[row.activity]=row.percent;
    previous=Object.fromEntries(fields.map(k=>[k,p[k]]));
    try{localStorage.setItem(getProgressStorageKey(),JSON.stringify(p));}catch(e){console.warn(e);}
    hydrated=true;
    status('Progres dimuat dari Supabase');
  }
  function enqueue(snapshot){
    if(!api || !userId || !hydrated)return;
    const copy=structuredClone(snapshot);
    tail=tail.catch(()=>{}).then(async()=>{
      const changed=fields.filter(f=>copy[f]!==previous[f]);
      if(!changed.length)return;
      status('Menyinkronkan progres...');
      const rows=changed.map(activity=>({user_id:userId,activity,percent:copy[activity]}));
      const {error}=await api.from('user_progress').upsert(rows,{onConflict:'user_id,activity'});
      if(error){status('Gagal menyinkronkan progres: '+error.message,true);throw Error(error.message);}
      for(const f of changed) previous[f]=copy[f];
      status('Progres berhasil tersimpan di Supabase');
    });
  }
  return {hydrate,enqueue,whenSynced:()=>tail};
})();
