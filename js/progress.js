initCommon("siswa");
const p = loadProgress();
const items = [
  ["Materi", p.materi],
  ["Visualisasi", p.visualisasi],
  ["Mini Lab", p.miniLab],
  ["Troubleshooting", p.troubleshooting],
  ["Evaluasi", p.evaluasi],
  ["CLI Lab", p.cliLab],
];

const totalEl = document.getElementById("totalProgress");
const bestEl = document.getElementById("bestScore");
if (totalEl) totalEl.textContent = totalProgress() + "%";
if (bestEl) bestEl.textContent = p.bestScore + "/100";

const tbody = document.getElementById("progressRows");
if (tbody) {
  items.forEach(([name, value]) => {
    const tr = document.createElement("tr");
    const nameCell = document.createElement("td");
    nameCell.textContent = name;
    const percentage = document.createElement("td");
    percentage.textContent = `${value}%`;
    const barCell = document.createElement("td");
    const bar = document.createElement("div");
    bar.className = "progress";
    const fill = document.createElement("span");
    fill.style.width = `${value}%`;
    bar.appendChild(fill);
    barCell.appendChild(bar);
    const statusCell = document.createElement("td");
    const status = document.createElement("span");
    status.className = value === 100 ? "badge success" : "badge warning";
    status.textContent =
      value === 100 ? "Selesai" : value > 0 ? "Berlangsung" : "Belum";
    statusCell.appendChild(status);
    tr.append(nameCell, percentage, barCell, statusCell);
    tbody.appendChild(tr);
  });
}

const resetBtn = document.getElementById("resetProgress");
if (resetBtn) {
  resetBtn.addEventListener("click", () => {
    if (
      !confirm(
        "Setel persentase progres akun ini menjadi 0%? Riwayat latihan sebelumnya tetap tersimpan di Supabase. Tindakan ini tidak menghapus akun atau kelas.",
      )
    )
      return;
    const empty=createEmptyProgress();
    if(!saveProgress(empty)){alert('Gagal memperbarui progres lokal.');return;}
    RoutingProgress.whenSynced().then(()=>location.reload()).catch(()=>alert('Sinkronisasi belum berhasil. Periksa koneksi kemudian coba lagi.'));
  });
}

// Sprint 7: display recent student-reported practice events; teacher data is never loaded here.
(async function renderMyPracticeHistory(){
  const tbody=document.getElementById('myPracticeRows');
  if(!tbody || typeof RoutingActivity==='undefined')return;
  const labels={materi:'Materi',visualisasi:'Visualisasi',miniLab:'Mini Lab',troubleshooting:'Troubleshooting',evaluasi:'Evaluasi',cliLab:'CLI Lab'};
  const show=(value)=>{const tr=document.createElement('tr'),td=document.createElement('td');td.colSpan=4;td.className='rl7-empty';td.textContent=value;tr.append(td);tbody.replaceChildren(tr);};
  try {
    const {data,error}=await RoutingActivity.recent(20);
    if(error){show('Riwayat belum bisa dimuat: '+error.message+'. Pastikan migrasi Sprint 7 sudah dijalankan.');return;}
    if(!data?.length){show('Belum ada riwayat. Coba kerjakan latihan atau validasi CLI Lab.');return;}
    tbody.replaceChildren();
    for(const e of data){
      const tr=document.createElement('tr'),date=new Date(e.created_at);
      const cells=[Number.isNaN(date.getTime())?'–':date.toLocaleString('id-ID',{dateStyle:'medium',timeStyle:'short'}),labels[e.activity]||e.activity,e.outcome==='passed'?'Berhasil':e.outcome==='completed'?'Selesai':'Perlu coba lagi',e.score==null?'–':e.score+'/100'];
      cells.forEach(v=>{const td=document.createElement('td');td.textContent=v;tr.append(td);});tbody.append(tr);
    }
  }catch(err){show('Riwayat gagal dimuat: '+err.message);}
})();
