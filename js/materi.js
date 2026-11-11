/* Membuka halaman != menyelesaikan materi. */
initCommon("siswa");

function setupMaterialCompletion() {
  const host =
    document.querySelector("main") ||
    document.querySelector(".main-content") ||
    document.querySelector(".content") ||
    document.body;
  if (!host || document.getElementById("routinglab-material-completion"))
    return;

  const section = document.createElement("section");
  section.id = "routinglab-material-completion";
  section.className = "card";
  section.style.marginTop = "1.5rem";

  const heading = document.createElement("h2");
  heading.textContent = "Selesaikan materi";
  const info = document.createElement("p");
  info.textContent =
    "Setelah membaca materi dan memahami contoh, tandai materi selesai. Penguasaan konsep tetap diuji melalui kuis.";
  const status = document.createElement("p");
  status.setAttribute("aria-live", "polite");
  const button = document.createElement("button");
  button.type = "button";
  button.className = "btn";
  button.id = "markMaterialCompleted";

  function refresh() {
    const done = loadProgress().materi === 100;
    status.textContent = done
      ? "Status: materi ditandai selesai."
      : "Status: materi belum selesai.";
    button.textContent = done
      ? "Materi sudah ditandai selesai"
      : "Tandai materi selesai";
    button.disabled = done;
  }

  button.addEventListener("click", () => {
    const progress = loadProgress();
    progress.materi = 100;
    if (!saveProgress(progress)) {
      status.textContent =
        "Penyimpanan gagal. Pastikan browser mengizinkan penyimpanan browser.";
      return;
    }
    if (typeof RoutingActivity !== 'undefined') RoutingActivity.record('materi','completed',null,'Materi ditandai selesai oleh siswa');
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


/* Sprint v4: command explanations are read-only; no CLI or Supabase changes. */
function setupRoutingCommandGuide() {
  const code = document.getElementById('routingCommandText');
  if (!code) return;
  const description = document.getElementById('routingCommandExplanation');
  const feedback = document.getElementById('routingCommandFeedback');
  const examples = {
    enable: {command:'enable', explanation:'Masuk ke privileged EXEC mode (R1#), sebelum mengatur konfigurasi.'},
    config: {command:'configure terminal', explanation:'Masuk ke global configuration mode (R1(config)#) agar perintah konfigurasi dapat dimasukkan.'},
    route: {command:'ip route 192.168.2.0 255.255.255.0 10.10.10.2', explanation:'192.168.2.0 adalah jaringan tujuan, 255.255.255.0 subnet mask, dan 10.10.10.2 alamat next hop di router R2.'},
    verify: {command:'show ip route', explanation:'Menampilkan tabel routing. Pastikan ada rute statis (S) menuju LAN 2, lalu uji koneksi memakai ping 192.168.2.10.'},
  };
  const choices = [...document.querySelectorAll('[data-example]')];
  choices.forEach(button => button.addEventListener('click', () => {
    const selected = examples[button.dataset.example];
    if (!selected) return;
    code.textContent = selected.command;
    description.textContent = selected.explanation;
    feedback.textContent = '';
    choices.forEach(choice => {
      const active = choice === button;
      choice.classList.toggle('is-current',active);
      choice.setAttribute('aria-pressed',String(active));
    });
  }));
  document.getElementById('copyRoutingCommand')?.addEventListener('click', async () => {
    const value = code.textContent;
    try {
      await navigator.clipboard.writeText(value);
      feedback.textContent = 'Perintah berhasil disalin.';
    } catch {
      feedback.textContent = 'Salin manual teks perintah di atas (akses clipboard tidak tersedia).';
    }
  });
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupRoutingCommandGuide);
} else {
  setupRoutingCommandGuide();
}
