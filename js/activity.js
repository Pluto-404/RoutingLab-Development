/* Sprint 7 — student-reported practice history (never an official grade). */
const RoutingActivity = (() => {
  const activities = new Set(['materi','visualisasi','miniLab','troubleshooting','evaluasi','cliLab']);
  const outcomes = new Set(['completed','passed','retry']);
  let queue = Promise.resolve();
  async function save(activity,outcome,score=null,note='') {
    const session = RoutingAuth.getSession();
    if (!session || session.role !== 'siswa') return false;
    if (!activities.has(activity) || !outcomes.has(outcome)) return false;
    if (score != null && (!Number.isInteger(score) || score < 0 || score > 100)) return false;
    const payload = {
      user_id: session.id, activity, outcome,
      score: score == null ? null : score,
      note: String(note || '').slice(0,160)
    };
    const {error} = await RoutingAuth.getClient().from('practice_events').insert(payload);
    if (error) { console.warn('Riwayat latihan gagal disimpan:',error.message); return false; }
    window.dispatchEvent(new CustomEvent('routinglab:activity-recorded',{detail:{activity,outcome}}));
    return true;
  }
  function record(activity,outcome,score=null,note='') {
    // Queue events in order; errors must never prevent the core exercise from working.
    queue=queue.catch(()=>false).then(()=>save(activity,outcome,score,note)).catch(err=>{
      console.warn('Riwayat latihan belum tersinkron:',err);return false;
    });
    return queue;
  }
  async function recent(limit=15) {
    const session=RoutingAuth.getSession();if(!session || session.role!=='siswa')return {data:[],error:null};
    return await RoutingAuth.getClient().from('practice_events')
      .select('activity,outcome,score,note,created_at')
      .eq('user_id',session.id).order('created_at',{ascending:false}).limit(Math.min(Math.max(limit,1),50));
  }
  return {record,recent,whenSaved:()=>queue};
})();
