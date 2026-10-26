initCommon("siswa");
const p = loadProgress();
const total = totalProgress();
document.getElementById("progressText").textContent = total + "%";
document.getElementById("progressBar").style.width = total + "%";
document.getElementById("bestScore").textContent = p.bestScore || 0;
document.getElementById("completedCount").textContent =
  [p.materi, p.visualisasi, p.miniLab, p.troubleshooting, p.evaluasi].filter(
    (v) => v >= 100,
  ).length + "/5";
