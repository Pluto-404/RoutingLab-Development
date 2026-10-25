initCommon("siswa");
const btn = document.getElementById("sendPacket"),
  packet = document.getElementById("packet"),
  status = document.getElementById("packetStatus");
btn.addEventListener("click", () => {
  packet.classList.remove("run");
  void packet.offsetWidth;
  packet.classList.add("run");
  status.className = "alert";
  status.textContent = "Paket dikirim: PC0 → Switch0 → R1 → R2 → Switch1 → PC1";
  setTimeout(() => {
    status.className = "alert success";
    status.textContent =
      "Berhasil. R1 dan R2 memiliki rute menuju jaringan tujuan.";
    const p = loadProgress();
    p.visualisasi = 100;
    saveProgress(p);
  }, 4100);
});
