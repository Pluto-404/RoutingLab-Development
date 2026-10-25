/* Membuka halaman != menyelesaikan materi. */
initCommon("siswa");

function setupMaterialCompletion() {
  const host = document.querySelector("main") || document.querySelector(".main-content") || document.querySelector(".content") || document.body;
  if (!host || document.getElementById("routinglab-material-completion")) return;

  const section = document.createElement("section");
  section.id = "routinglab-material-completion";
  section.className = "card";
  section.style.marginTop = "1.5rem";

  const heading = document.createElement("h2");
  heading.textContent = "Selesaikan materi";
  const info = document.createElement("p");
  info.textContent = "Setelah membaca materi dan memahami contoh, tandai materi selesai. Penguasaan konsep tetap diuji melalui kuis.";
  const status = document.createElement("p");
  status.setAttribute("aria-live", "polite");
  const button = document.createElement("button");
  button.type = "button";
  button.className = "btn";
  button.id = "markMaterialCompleted";

  function refresh() {
    const done = loadProgress().materi === 100;
    status.textContent = done ? "Status: materi ditandai selesai." : "Status: materi belum selesai.";
    button.textContent = done ? "Materi sudah ditandai selesai" : "Tandai materi selesai";
    button.disabled = done;
  }

  button.addEventListener("click", () => {
    const progress = loadProgress();
    progress.materi = 100;
    if (!saveProgress(progress)) {
      status.textContent = "Penyimpanan gagal. Pastikan browser mengizinkan penyimpanan lokal.";
      return;
    }
    refresh();
  });

  section.append(heading, info, status, button);
  host.appendChild(section);
  refresh();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", setupMaterialCompletion);
} else {
  setupMaterialCompletion();
}
