(function () {
  "use strict";
  const app = RoutingLabCLI.create(),
    out = document.getElementById("output"),
    input = document.getElementById("command"),
    form = document.getElementById("commandForm");
  const history = [];
  let historyPos = 0;
  // SVG cables are rendered from actual device positions so they stay aligned on resize.
  const topo = document.getElementById('rlTopology');
  const wires = document.getElementById('rlWires');
  const devices = ['pc0', 'sw0', 'r1', 'r2', 'sw1', 'pc1'];
  let linkState = { links: false, forward: false, returnRoute: false, ok: false };
  let highlightedSegments = new Set();
  let traceFailed = false;
  const packetIndicator = document.getElementById('rlPacketIndicator');
  let traceAnimationId = 0;
  async function animateTrace(path) {
    if (!topo || !packetIndicator || !path?.length) return;
    const runId = ++traceAnimationId;
    packetIndicator.getAnimations().forEach(anim => anim.cancel());
    const map = {PC0:'pc0',SW0:'sw0',R1:'r1',R2:'r2',SW1:'sw1',PC1:'pc1'};
    const positions = path.map(id => topo.querySelector(`[data-device="${map[id]}"]`)).filter(Boolean).map(node => {
      const b=node.getBoundingClientRect(), t=topo.getBoundingClientRect();
      return {left:b.left-t.left+b.width/2-19,top:b.top-t.top+b.height*.42-19};
    });
    if (!positions.length) return;
    packetIndicator.style.left = positions[0].left+'px';
    packetIndicator.style.top = positions[0].top+'px';
    packetIndicator.classList.add('is-visible');
    for(let i=1;i<positions.length;i++){
      if(runId!==traceAnimationId)return;
      const a=positions[i-1], b=positions[i];
      const animation=packetIndicator.animate([
        {left:a.left+'px',top:a.top+'px',opacity:1},
        {left:b.left+'px',top:b.top+'px',opacity:1}
      ],{duration:510,easing:'ease-in-out',fill:'forwards'});
      try {await animation.finished;}catch{return;}
      if(runId!==traceAnimationId)return;
      animation.cancel();
      packetIndicator.style.left=b.left+'px';
      packetIndicator.style.top=b.top+'px';
    }
    if(runId===traceAnimationId){
      packetIndicator.classList.add(traceFailed ? 'is-blocked' : 'is-arrived');
      setTimeout(()=>{ if(runId===traceAnimationId){packetIndicator.classList.remove('is-visible','is-arrived','is-blocked');} },850);
    }
  }
  function clearTraceMotion(){
    ++traceAnimationId;
    packetIndicator?.getAnimations().forEach(a=>a.cancel());
    packetIndicator?.classList.remove('is-visible','is-arrived','is-blocked');
    highlightedSegments.clear(); traceFailed = false; renderCables();
  }
  function renderCables() {
    if (!topo || !wires) return;
    const bounds = topo.getBoundingClientRect();
    const width = topo.clientWidth;
    const height = topo.clientHeight;
    if (!width || !height) return;
    wires.setAttribute('viewBox', `0 0 ${width} ${height}`);
    wires.setAttribute('width', width);
    wires.setAttribute('height', height);
    wires.replaceChildren();
    const ns = 'http://www.w3.org/2000/svg';
    const els = devices.map(id => topo.querySelector(`[data-device="${id}"]`));
    els.forEach((node, i) => {
      if (!node || i === els.length - 1) return;
      const next = els[i + 1];
      if (!next) return;
      const a = node.getBoundingClientRect(), b = next.getBoundingClientRect();
      const y = (a.top + a.height * .42 + b.top + b.height * .42) / 2 - bounds.top;
      const x1 = a.right - bounds.left - 3, x2 = b.left - bounds.left + 3;
      const d = `M${x1.toFixed(1)} ${y.toFixed(1)} L${x2.toFixed(1)} ${y.toFixed(1)}`;
      const isDown = i === 2 && !linkState.links;
      // Active traces visualize actual simulator reachability, not just physical cables.
      const active = !isDown && (highlightedSegments.has(i) || (linkState.ok && highlightedSegments.size === 0));
      for (const [kind, name] of [['base', 'rl-cable-base'], ['flow', 'rl-cable-flow']]) {
        const path = document.createElementNS(ns, 'path');
        path.setAttribute('d', d);
        path.setAttribute('class', `${name}${isDown ? ' is-down' : ''}${active ? ' is-active' : ''}${highlightedSegments.has(i) ? ' is-trace' : ''}`);
        path.setAttribute('vector-effect', 'non-scaling-stroke');
        if (kind === 'flow') path.style.animationDelay = `${i * .16}s`;
        wires.appendChild(path);
      }
      // RJ45 contact dots: one at each end of the cable.
      for (const x of [x1 + 2, x2 - 2]) {
        const contact = document.createElementNS(ns, 'circle');
        contact.setAttribute('cx', x.toFixed(1));
        contact.setAttribute('cy', y.toFixed(1));
        contact.setAttribute('r', '2.5');
        contact.setAttribute('class', `rl-cable-contact${isDown ? ' is-down' : ''}`);
        wires.appendChild(contact);
      }
    });
  }
  if (typeof ResizeObserver !== 'undefined' && topo) {
    new ResizeObserver(renderCables).observe(topo);
  }
  window.addEventListener('resize', renderCables);
  window.addEventListener('load', renderCables);

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
      document.getElementById("svg" + id).setAttribute("aria-pressed", String(app.selected === id));
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
    linkState = r;
    renderCables();
    const linkSummary = document.getElementById('rlLinkSummary');
    if (linkSummary) linkSummary.textContent = r.ok ? 'Jalur dua arah aktif' : (!r.links ? 'Periksa koneksi antarrouter' : 'Kabel terhubung · periksa rute');
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
    clearTraceMotion();
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
    const nodeIndex = { PC0:0, SW0:1, R1:2, R2:3, SW1:4, PC1:5 };
    highlightedSegments.clear();
    for (let i = 1; i < result.path.length; i++) {
      const a = nodeIndex[result.path[i - 1]], b = nodeIndex[result.path[i]];
      if (Number.isInteger(a) && Number.isInteger(b) && Math.abs(a - b) === 1) highlightedSegments.add(Math.min(a,b));
    }
    traceFailed = !result.ok;
    renderCables();
    animateTrace(result.path);
    diagnosis.textContent=(result.ok?"✓ Paket sampai. ":"✕ Paket berhenti. ")+result.reason;
    diagnosis.className="packet-diagnosis "+(result.ok?"packet-ok":"packet-fail");
    return result;
  }
  document.getElementById("sendPacket").addEventListener("click",()=>showTrace("PC0","192.168.2.10"));
  document.getElementById("sendReverse").addEventListener("click",()=>showTrace("PC1","192.168.1.10"));
  function loadScenario(kind,confirmUser=false){
    if(confirmUser&&!confirm("Memuat skenario akan mereset konfigurasi lab. Lanjutkan?"))return;
    clearTraceMotion();app.preset(kind);out.textContent="";track.textContent="";
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
