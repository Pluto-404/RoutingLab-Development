/* UTS prototype evaluation: formative, no server-side validation yet. */
initCommon("siswa");

const questions = [
  {
    q: "Perintah untuk melihat tabel routing pada Cisco IOS adalah...",
    options: [
      "show vlan",
      "show ip route",
      "show interfaces trunk",
      "show mac address-table",
    ],
    a: 1,
    reason:
      "show ip route menampilkan entri routing yang diketahui router, termasuk connected dan static route.",
  },
  {
    q: "R1 ingin mencapai jaringan 192.168.2.0/24 melalui next hop R2 10.10.10.2. Static route yang benar adalah...",
    options: [
      "ip route 192.168.2.0 255.255.255.0 10.10.10.2",
      "ip route 10.10.10.2 255.255.255.0 192.168.2.0",
      "route add 192.168.2.0 via 10.10.10.2",
      "ip default-gateway 10.10.10.2",
    ],
    a: 0,
    reason:
      "Formatnya ip route <destination-network> <subnet-mask> <next-hop>. Next hop harus terjangkau dari router.",
  },
  {
    q: "PC dapat ping gateway lokal tetapi gagal ping host pada LAN lain. Pemeriksaan paling logis berikutnya adalah...",
    options: [
      "Mengganti nama PC",
      "Memeriksa tabel routing dan route balik",
      "Menghapus subnet mask",
      "Mengganti kabel PC ke console",
    ],
    a: 1,
    reason:
      "Ping gateway lokal menunjukkan koneksi lokal mungkin berfungsi. Jalur ke LAN jauh dan jalur balik perlu diperiksa, bersama konfigurasi host tujuan.",
  },
  {
    q: "Kelebihan utama static routing pada jaringan kecil dan stabil adalah...",
    options: [
      "Rute berubah otomatis",
      "Konfigurasi selalu tanpa administrator",
      "Sederhana dan overhead protokol rendah",
      "Tidak membutuhkan IP address",
    ],
    a: 2,
    reason:
      "Static routing diatur manual sehingga cocok untuk topologi kecil/stabil dengan overhead routing protocol rendah; perubahan rute tidak otomatis.",
  },
  {
    q: "Jika interface router masih administratively down, tindakan konfigurasi yang tepat adalah...",
    options: ["reload", "no shutdown", "erase startup-config", "show vlan"],
    a: 1,
    reason:
      "Perintah no shutdown pada mode konfigurasi interface mengaktifkan interface secara administratif. Status up/up tetap bergantung pada kondisi koneksi.",
  },
];

const form = document.getElementById("quizForm");
const submitButton = document.getElementById("submitQuiz");
const result = document.getElementById("quizResult");

if (!form || !submitButton || !result) {
  console.error(
    "Elemen kuis tidak ditemukan. Diperlukan #quizForm, #submitQuiz, dan #quizResult.",
  );
} else {
  questions.forEach((item, idx) => {
    const wrap = document.createElement("fieldset");
    wrap.className = "card";
    wrap.style.border = "1px solid #d7e2ef";
    wrap.style.marginBottom = "1rem";
    const legend = document.createElement("legend");
    legend.style.fontWeight = "600";
    legend.style.padding = "0 0.4rem";
    legend.textContent = `${idx + 1}. ${item.q}`;
    wrap.appendChild(legend);
    item.options.forEach((option, optionIndex) => {
      const label = document.createElement("label");
      label.className = "quiz-option";
      const radio = document.createElement("input");
      radio.type = "radio";
      radio.name = `q${idx}`;
      radio.value = String(optionIndex);
      label.append(radio, document.createTextNode(` ${option}`));
      wrap.appendChild(label);
    });
    form.appendChild(wrap);
  });

  result.setAttribute("aria-live", "polite");
  submitButton.addEventListener("click", () => {
    const choices = questions.map((_, idx) =>
      document.querySelector(`input[name="q${idx}"]:checked`),
    );
    const unanswered = choices.findIndex((choice) => !choice);
    if (unanswered !== -1) {
      result.className = "alert warning";
      result.textContent = `Jawab semua soal terlebih dahulu. Nomor ${unanswered + 1} belum dijawab.`;
      const first = form.querySelector(`input[name="q${unanswered}"]`);
      if (first && first.focus) first.focus();
      return;
    }

    const correct = choices.reduce(
      (total, choice, index) =>
        total + (Number(choice.value) === questions[index].a ? 1 : 0),
      0,
    );
    const score = Math.round((correct / questions.length) * 100);
    const passed = score >= 80;
    const p = loadProgress();
    p.evaluationAttempts = (p.evaluationAttempts || 0) + 1;
    p.lastQuizScore = score;
    p.bestScore = Math.max(p.bestScore || 0, score);
    // 50% = attempted all questions but not yet mastered; 100% = reached threshold.
    p.evaluasi = passed || p.evaluationMastered ? 100 : 50;
    p.evaluationMastered = p.evaluasi === 100;
    const saved = saveProgress(p);

    result.className = passed ? "alert success" : "alert warning";
    result.replaceChildren();
    const heading = document.createElement("h3");
    heading.textContent = `Skor: ${score}/100 (${correct}/${questions.length} benar)`;
    const note = document.createElement("p");
    note.textContent = passed
      ? "Target evaluasi 80 tercapai. Kamu boleh mengulang untuk meningkatkan pemahaman."
      : "Target evaluasi 80 belum tercapai. Pelajari pembahasan, lalu coba lagi.";
    const persistNote = document.createElement("p");
    persistNote.textContent = saved
      ? `Percobaan ke-${p.evaluationAttempts}. Skor terbaik: ${p.bestScore}/100. Progres tersimpan di browser.`
      : "Progres gagal disimpan. Periksa pengaturan penyimpanan browser.";
    const review = document.createElement("ol");
    questions.forEach((q, idx) => {
      const item = document.createElement("li");
      item.style.marginBottom = "0.8rem";
      const isCorrect = Number(choices[idx].value) === q.a;
      const heading = document.createElement("strong");
      heading.textContent = `Soal ${idx + 1}: ${isCorrect ? "Benar" : "Perlu diperbaiki"}. `;
      const detail = document.createElement("span");
      detail.textContent = `Jawaban tepat: ${q.options[q.a]}. ${q.reason}`;
      item.append(heading, detail);
      review.appendChild(item);
    });
    result.append(heading, note, persistNote, review);
  });
}
