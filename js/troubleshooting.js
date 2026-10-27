initCommon("siswa");
const form = document.getElementById("tsForm"),
  feedback = document.getElementById("tsFeedback");
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const answer = document.querySelector('input[name="cause"]:checked');
  if (!answer) {
    feedback.className = "alert warning";
    feedback.textContent = "Pilih dugaan penyebab terlebih dahulu.";
    return;
  }
  if (typeof RoutingActivity !== 'undefined') RoutingActivity.record('troubleshooting', answer.value==='route-r2'?'passed':'retry', null, 'Identifikasi penyebab route balik');
  if (answer.value === "route-r2") {
    feedback.className = "alert success";
    feedback.innerHTML =
      "<strong>Tepat.</strong> R2 belum memiliki route kembali menuju 192.168.1.0/24. Tambahkan <span class='code-chip'>ip route 192.168.1.0 255.255.255.0 10.10.10.1</span>.";
    const p = loadProgress();
    p.troubleshooting = 100;
    saveProgress(p);
  } else {
    feedback.className = "alert error";
    feedback.textContent =
      "Belum tepat. Karena PC0 dapat ping gateway dan link antarrouter up, fokuskan pemeriksaan pada tabel routing kedua router dan kebutuhan route balik.";
  }
});
