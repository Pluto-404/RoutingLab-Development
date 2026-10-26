initCommon("guru");
const studentProgress = loadProgress(),
  demo = [
    {
      name: "Siswa Demo",
      cls: "X-TJKT-A",
      progress: totalProgress(),
      score: studentProgress.bestScore || 0,
      source: "Aktual prototype",
    },
    {
      name: "Demo Siswa 02",
      cls: "X-TJKT-A",
      progress: 76,
      score: 80,
      source: "Data contoh",
    },
    {
      name: "Demo Siswa 03",
      cls: "X-TJKT-A",
      progress: 54,
      score: 60,
      source: "Data contoh",
    },
    {
      name: "Demo Siswa 04",
      cls: "X-TJKT-A",
      progress: 92,
      score: 100,
      source: "Data contoh",
    },
  ];
const tbody = document.getElementById("studentRows");
demo.forEach((s) => {
  const tr = document.createElement("tr");
  tr.innerHTML = `<td>${s.name}</td><td>${s.cls}</td><td>${s.progress}%</td><td>${s.score}</td><td>${s.source}</td>`;
  tbody.appendChild(tr);
});
document.getElementById("avgProgress").textContent =
  Math.round(demo.reduce((a, b) => a + b.progress, 0) / demo.length) + "%";
document.getElementById("studentCount").textContent = demo.length;
