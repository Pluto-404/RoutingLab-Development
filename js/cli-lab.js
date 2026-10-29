(function () {
  "use strict";
  const app = RoutingLabCLI.create(),
    out = document.getElementById("output"),
    input = document.getElementById("command"),
    form = document.getElementById("commandForm");
  const history = [];
  let historyPos = 0;
  function write(text, cls = "") {
    const el = document.createElement("div");
    el.className = cls;
    el.textContent = text;
    out.appendChild(el);
    out.scrollTop = out.scrollHeight;
  }
  function sync() {
    document.getElementById("prompt").textContent = app.prompt;
    for (const id of ["R1", "R2"]) {
      document
        .getElementById("select" + id)
        .classList.toggle("active", app.selected === id);
      document
        .getElementById("svg" + id)
        .classList.toggle("selected", app.selected === id);
    }
  }
  function renderStatus() {
    const r = app.reachable();
    for (const [id, ok] of [
      ["statusWAN", r.links],
      ["statusForward", r.forward],
      ["statusReturn", r.returnRoute],
    ]) {
      const el = document.getElementById(id);
      if (el) el.className = ok ? "ok" : "bad";
      // Mirror network lights beside the CLI; the topology is hidden in the mobile terminal tab.
      const mirror = document.getElementById({statusWAN:'termStatusWAN',statusForward:'termStatusForward',statusReturn:'termStatusReturn'}[id]);
      if (mirror) mirror.className = ok ? 'ok' : 'bad';
    }
    const status = document.getElementById("networkState");
    if (status) {
      status.textContent = r.ok
        ? "✓ Jalur dua arah siap diuji"
        : "● Konfigurasi belum menyediakan koneksi dua arah";
      status.className = "network " + (r.ok ? "success" : "");
    }
  }
  const tabs = [...document.querySelectorAll(".mobile-tabs [data-panel]")];
  function setPanel(which) {
    const isTerminal = which === "terminal";
    document.getElementById("instructionsPanel").hidden = isTerminal;
    document.getElementById("terminalPanel").hidden = !isTerminal;
    for (const t of tabs) {
      const active = t.dataset.panel === which;
      t.classList.toggle("active", active);
      t.setAttribute("aria-pressed", String(active));
    }
    if (isTerminal) input.focus();
  }
  const mq = window.matchMedia("(max-width:700px)");
  function applyViewport() {
    if (!mq.matches) {
      document.getElementById("instructionsPanel").hidden = false;
      document.getElementById("terminalPanel").hidden = false;
    } else {
      const active = tabs.find((t) => t.classList.contains("active"));
      setPanel(active?.dataset.panel || "instructions");
    }
  }
  tabs.forEach((t) =>
    t.addEventListener("click", () => setPanel(t.dataset.panel)),
  );
  if (mq.addEventListener) mq.addEventListener("change", applyViewport);
  else mq.addListener(applyViewport);
  function choose(id) {
    write(app.select(id), "system");
    sync();
    if (mq.matches) setPanel("terminal");
    input.focus();
  }
  for (const id of ["R1", "R2"]) {
    document
      .getElementById("select" + id)
      .addEventListener("click", () => choose(id));
    const node = document.getElementById("svg" + id);
    node.addEventListener("click", () => choose(id));
    node.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        choose(id);
      }
    });
  }
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const command = input.value.trim();
    if (!command) return;
    write(app.prompt + " " + command, "entered");
    history.push(command);
    historyPos = history.length;
    const result = app.run(command);
    if (result) write(result, result.startsWith("%") ? "error" : "result");
    input.value = "";
    sync();
    renderStatus();
  });
  input.addEventListener("keydown", (e) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      historyPos = Math.max(0, historyPos - 1);
      input.value = history[historyPos] || "";
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      historyPos = Math.min(history.length, historyPos + 1);
      input.value = history[historyPos] || "";
    }
  });
  document.getElementById("checkMission").addEventListener("click", () => {
    const r = app.reachable(),
      el = document.getElementById("feedback"),
      status = document.getElementById("networkState");
    el.className = r.ok ? "success" : "error";
    if (r.ok) {
      el.textContent =
        "Misi berhasil! Kedua static route dan jalur antarrouter telah dikonfigurasi dengan benar.";
      // Progress here is formative practice and not a trusted grade.
      const state = loadProgress();
      if (state.cliLab !== 100) { state.cliLab = 100; saveProgress(state); }
      status.textContent = "✓ Koneksi PC0 ↔ PC1 tersedia";
      status.className = "network success";
    } else {
      const missing = [];
      if (!r.links) missing.push("periksa IP/status interface antarrouter");
      if (!r.forward) missing.push("route R1 menuju LAN2");
      if (!r.returnRoute) missing.push("route balik R2 menuju LAN1");
      el.textContent = "Belum berhasil: " + missing.join("; ") + ".";
      status.textContent = "✕ Koneksi end-to-end belum tersedia";
      status.className = "network error";
    }
    if (typeof RoutingActivity !== 'undefined') RoutingActivity.record('cliLab', r.ok?'passed':'retry', null, r.ok?'Jalur dua arah berhasil':'Validasi misi belum berhasil');
    if (window.RoutingCLIMission?.recordValidation) window.RoutingCLIMission.recordValidation(r.ok);
    renderStatus();
  });
  document.getElementById("resetLab").addEventListener("click", () => {
    if (!confirm("Reset semua konfigurasi pada lab?")) return;
    app.reset();
    out.textContent = "";
    document.getElementById("feedback").textContent =
      "Lab direset. Mulai konfigurasi lagi.";
    document.getElementById("feedback").className = "";
    document.getElementById("networkState").textContent = "Koneksi belum diuji";
    document.getElementById("networkState").className = "network";
    sync();
    renderStatus();
    write("Lab direset. Klik R1 atau R2 lalu ketik enable.", "system");
  });
  const track=document.getElementById("packetTrack"),diagnosis=document.getElementById("packetDiagnosis");
  function showTrace(source,target){
    const result=app.trace(source,target);
    track.textContent="";
    result.path.forEach((name,index)=>{
      const item=document.createElement("span");item.className="packet-node";item.textContent=name;
      item.style.animationDelay=`${index*0.3}s`;track.appendChild(item);
      if(index<result.path.length-1){const arrow=document.createElement("span");arrow.textContent="→";arrow.className="packet-arrow";track.appendChild(arrow);}
    });
    diagnosis.textContent=(result.ok?"✓ Paket sampai. ":"✕ Paket berhenti. ")+result.reason;
    diagnosis.className="packet-diagnosis "+(result.ok?"packet-ok":"packet-fail");
    return result;
  }
  document.getElementById("sendPacket").addEventListener("click",()=>showTrace("PC0","192.168.2.10"));
  document.getElementById("sendReverse").addEventListener("click",()=>showTrace("PC1","192.168.1.10"));
  function loadScenario(kind,confirmUser=false){
    if(confirmUser&&!confirm("Memuat skenario akan mereset konfigurasi lab. Lanjutkan?"))return;
    app.preset(kind);out.textContent="";track.textContent="";
    diagnosis.textContent="Skenario siap. Periksa interface, routing table, lalu uji paket.";
    diagnosis.className="packet-diagnosis";
    document.getElementById("feedback").textContent="Skenario baru dimuat. Silakan lakukan diagnosis.";
    document.getElementById("feedback").className="";
    sync();renderStatus();write("Skenario dimuat: "+kind,"system");
  }
  document.getElementById("loadScenario").addEventListener("click",()=>loadScenario(document.getElementById("scenarioSelect").value,true));
  window.RoutingCLILab = Object.freeze({loadScenario});
  sync();
  renderStatus();
  applyViewport();
  write("RoutingLab CLI Trainer v0.2", "system");
  write(
    "Pilih R1 / R2. Ketik enable lalu configure terminal untuk mengonfigurasi.",
    "system",
  );
  if (!mq.matches) input.focus();
})();
