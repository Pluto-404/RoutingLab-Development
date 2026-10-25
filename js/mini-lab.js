initCommon("siswa");
const form = document.getElementById("miniLabForm"),
  feedback = document.getElementById("miniLabFeedback");
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const destination = document.getElementById("destination").value.trim(),
    mask = document.getElementById("mask").value.trim(),
    nextHop = document.getElementById("nextHop").value.trim();
  const correct =
    destination === "192.168.2.0" &&
    mask === "255.255.255.0" &&
    nextHop === "10.10.10.2";
  if (correct) {
    feedback.className = "alert success";
    feedback.innerHTML =
      "<strong>Benar.</strong> R1 sekarang memiliki static route menuju LAN 2 melalui next hop 10.10.10.2.";
    const p = loadProgress();
    p.miniLab = 100;
    saveProgress(p);
  } else {
    const hints = [];
    if (destination !== "192.168.2.0")
      hints.push("destination network LAN 2 belum tepat");
    if (mask !== "255.255.255.0") hints.push("subnet mask LAN 2 belum tepat");
    if (nextHop !== "10.10.10.2")
      hints.push(
        "next hop harus mengarah ke interface R2 yang terhubung ke R1",
      );
    feedback.className = "alert error";
    feedback.innerHTML =
      "<strong>Belum tepat.</strong> Periksa: " + hints.join(", ") + ".";
  }
});
document.getElementById("fillExample").addEventListener("click", () => {
  document.getElementById("destination").value = "192.168.2.0";
  document.getElementById("mask").value = "255.255.255.0";
  document.getElementById("nextHop").value = "10.10.10.2";
});
