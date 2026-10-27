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
        "Setel progres latihan akun ini menjadi 0% di Supabase? Tindakan ini tidak menghapus akun atau kelas.",
      )
    )
      return;
    const empty=createEmptyProgress();
    if(!saveProgress(empty)){alert('Gagal memperbarui progres lokal.');return;}
    RoutingProgress.whenSynced().then(()=>location.reload()).catch(()=>alert('Sinkronisasi belum berhasil. Periksa koneksi kemudian coba lagi.'));
  });
}
