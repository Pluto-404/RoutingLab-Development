/* RoutingLab v4: controlled, accessible packet walkthrough. The Materi and
   Visualisasi pages demonstrate a preconfigured route, NOT live CLI state. */
initCommon('siswa');
(() => {
  'use strict';
  const topology = document.getElementById('visualTopology');
  const wires = document.getElementById('visualWires');
  const packet = document.getElementById('packet');
  const status = document.getElementById('packetStatus');
  const pathText = document.getElementById('packetPathText');
  const play = document.getElementById('sendPacket');
  const pause = document.getElementById('pausePacket');
  const previous = document.getElementById('previousPacket');
  const next = document.getElementById('nextPacket');
  const reset = document.getElementById('resetPacket');
  const stage = document.getElementById('packetStage');
  const explanation = document.getElementById('packetExplanation');
  const progress = document.getElementById('packetStageProgress');
  if (!topology || !wires || !packet || !play) return;

  const nodes = [
    ['pc0', 'PC0', 'PC0 menyiapkan paket menuju 192.168.2.10. Tujuan berada di jaringan lain sehingga paket dikirim ke default gateway.'],
    ['sw0', 'Switch0', 'Switch0 meneruskan frame dari PC0 ke port yang terhubung ke router R1.'],
    ['r1', 'Router R1', 'R1 memeriksa alamat IP tujuan pada routing table. Static route menunjuk next hop 10.10.10.2.'],
    ['r2', 'Router R2', 'R2 menerima paket melalui jaringan antarrouter dan menemukan LAN 2 yang terhubung langsung.'],
    ['sw1', 'Switch1', 'Switch1 meneruskan frame ke port PC1 pada LAN 2.'],
    ['pc1', 'PC1', 'PC1 menerima paket. Contoh ini mengasumsikan static route dan interface telah dikonfigurasi dengan benar.'],
  ];
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  let index = 0, playing = false, runId = 0, animation = null;
  const els = nodes.map(([name]) => topology.querySelector(`[data-node="${name}"]`));

  function positions() {
    const parent = topology.getBoundingClientRect();
    return els.map(el => {
      const r = el.getBoundingClientRect();
      return { x: r.left - parent.left + r.width / 2, y: r.top - parent.top + r.height * .43 };
    });
  }
  function paintCables() {
    const width = topology.clientWidth, height = topology.clientHeight;
    if (!width || !height) return;
    const points = positions(), ns = 'http://www.w3.org/2000/svg';
    wires.setAttribute('viewBox', `0 0 ${width} ${height}`);
    wires.replaceChildren();
    for (let i = 0; i < points.length - 1; i++) {
      const a = points[i], b = points[i + 1];
      const d = `M ${a.x.toFixed(1)} ${a.y.toFixed(1)} L ${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
      for (const type of ['visual-wire', 'visual-wire visual-wire-glow' + (i < index ? ' is-active' : '')]) {
        const path = document.createElementNS(ns, 'path');
        path.setAttribute('class', type); path.setAttribute('d', d); wires.appendChild(path);
      }
    }
  }
  function placeAt(i) {
    const p = positions()[i]; if (!p) return;
    // The oversized neon cube floats just above the cable, as in v3.
    packet.style.left = `${p.x - 29}px`;
    packet.style.top = `${p.y - 77}px`;
  }
  function syncUI() {
    els.forEach((el, i) => {
      el?.classList.toggle('is-active', i === index);
      el?.classList.toggle('is-done', i < index);
      el?.setAttribute('aria-current', i === index ? 'step' : 'false');
    });
    packet.classList.add('is-running');
    packet.classList.toggle('is-success', index === nodes.length - 1);
    placeAt(index); paintCables();
    stage.textContent = `Langkah ${index + 1} dari ${nodes.length}: ${nodes[index][1]}`;
    explanation.textContent = nodes[index][2];
    progress.value = index + 1;
    progress.max = nodes.length;
    previous.disabled = index === 0;
    next.disabled = index === nodes.length - 1;
    play.textContent = index === nodes.length - 1 ? 'Putar Ulang' : (playing ? 'Sedang berjalan…' : 'Putar Otomatis');
    play.disabled = playing;
    pause.disabled = !playing;
    pause.textContent = playing ? 'Jeda' : 'Dijeda';
    status.className = index === nodes.length - 1 ? 'alert success mt-2' : 'alert mt-2';
    status.textContent = index === nodes.length - 1 ? 'Simulasi selesai: paket sampai PC1.' : `Sedang mempelajari ${nodes[index][1]}.`;
    pathText.textContent = `PC0 → Switch0 → R1 → R2 → Switch1 → PC1`;
  }
  function stop() {
    ++runId; playing = false;
    if (animation) { animation.cancel(); animation = null; }
  }
  function finish() {
    const p = loadProgress();
    if (p.visualisasi !== 100) { p.visualisasi = 100; saveProgress(p); }
    if (typeof RoutingActivity !== 'undefined') RoutingActivity.record('visualisasi','completed',null,'Walkthrough paket selesai');
  }
  function jump(to) {
    stop();
    index = Math.max(0, Math.min(nodes.length - 1, to));
    syncUI();
    if (index === nodes.length - 1) finish();
  }
  async function autoPlay() {
    if (index === nodes.length - 1) index = 0;
    stop(); const id = runId; playing = true; syncUI();
    while (index < nodes.length - 1 && id === runId) {
      const a = positions()[index], b = positions()[index + 1];
      if (!a || !b) break;
      if (!reduced.matches && typeof packet.animate === 'function') {
        animation = packet.animate([
          {left:`${a.x - 29}px`,top:`${a.y - 77}px`},
          {left:`${b.x - 29}px`,top:`${b.y - 77}px`},
        ],{duration:850,easing:'ease-in-out',fill:'forwards'});
        try { await animation.finished; } catch { return; }
        animation.cancel(); animation = null;
      } else {
        await new Promise(resolve => setTimeout(resolve, reduced.matches ? 80 : 850));
      }
      if (id !== runId) return;
      index += 1; syncUI();
    }
    if (id !== runId) return;
    playing = false;
    if (index === nodes.length - 1) finish();
    syncUI();
  }
  play.addEventListener('click', autoPlay);
  pause.addEventListener('click', () => { if (playing) { stop(); syncUI(); } });
  previous.addEventListener('click', () => jump(index - 1));
  next.addEventListener('click', () => jump(index + 1));
  reset.addEventListener('click', () => jump(0));
  window.addEventListener('resize', () => { stop(); syncUI(); });
  if (typeof ResizeObserver !== 'undefined') new ResizeObserver(() => {
    if (!playing) { paintCables(); placeAt(index); }
  }).observe(topology);
  window.addEventListener('load', syncUI);
  syncUI();
})();
