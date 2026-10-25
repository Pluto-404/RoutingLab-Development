/* RoutingLab Sprint 1: helpers for the STATIC UTS DEMO only.
 * These browser values are NOT secure or authoritative. Replace with a backend
 * before using real students, class records, grades, or authentication.
 */
const ROUTINGLAB_PROGRESS_VERSION = 2;
const ROUTINGLAB_PROGRESS_FIELDS = ["materi", "visualisasi", "miniLab", "troubleshooting", "evaluasi"];

function initCommon(expectedRole) {
  const session = RoutingAuth.requireRole(expectedRole);
  if (!session) return null;
  document.querySelectorAll("[data-user-name]").forEach(el => { el.textContent = session.name || "Pengguna"; });
  document.querySelectorAll("[data-user-role]").forEach(el => { el.textContent = session.role === "guru" ? "Guru/Admin" : "Siswa"; });
  document.querySelectorAll("[data-class-code]").forEach(el => { el.textContent = session.classCode || "-"; });
  document.querySelectorAll("[data-logout]").forEach(btn => btn.addEventListener("click", RoutingAuth.logout));
  const page = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav a").forEach(a => {
    if (a.getAttribute("href") === page) a.classList.add("active");
  });
  return session;
}

function getProgressStorageKey() {
  const session = RoutingAuth.getSession();
  // Separate demo accounts in one browser; DO NOT treat username as a security boundary.
  const username = session && typeof session.username === "string" && session.username
    ? session.username : "anonymous-demo";
  return `routinglab_progress_v${ROUTINGLAB_PROGRESS_VERSION}:${encodeURIComponent(username)}`;
}

function createEmptyProgress() {
  return {
    materi: 0, visualisasi: 0, miniLab: 0, troubleshooting: 0, evaluasi: 0,
    bestScore: 0, evaluationAttempts: 0, lastQuizScore: null,
    evaluationMastered: false, updatedAt: null
  };
}

function normalizeProgress(value) {
  const output = createEmptyProgress();
  if (!value || typeof value !== "object" || Array.isArray(value)) return output;
  for (const field of [...ROUTINGLAB_PROGRESS_FIELDS, "bestScore"]) {
    const n = Number(value[field]);
    output[field] = Number.isFinite(n) ? Math.min(100, Math.max(0, Math.round(n))) : 0;
  }
  const attempts = Number(value.evaluationAttempts);
  output.evaluationAttempts = Number.isInteger(attempts) ? Math.min(100000, Math.max(0, attempts)) : 0;
  const last = Number(value.lastQuizScore);
  output.lastQuizScore = value.lastQuizScore == null || !Number.isFinite(last)
    ? null : Math.min(100, Math.max(0, Math.round(last)));
  output.evaluationMastered = Boolean(value.evaluationMastered) || output.bestScore >= 80;
  output.updatedAt = typeof value.updatedAt === "string" ? value.updatedAt : null;
  return output;
}

function loadProgress() {
  try {
    return normalizeProgress(JSON.parse(localStorage.getItem(getProgressStorageKey())));
  } catch (err) {
    console.warn("Progres demo tidak terbaca; menggunakan nilai awal.", err);
    return createEmptyProgress();
  }
}

function saveProgress(next) {
  const clean = normalizeProgress(next);
  clean.updatedAt = new Date().toISOString();
  try {
    localStorage.setItem(getProgressStorageKey(), JSON.stringify(clean));
  } catch (err) {
    console.error("Progres demo gagal disimpan ke browser.", err);
    return false;
  }
  return true;
}

function totalProgress() {
  const p = loadProgress();
  return Math.round(ROUTINGLAB_PROGRESS_FIELDS.reduce((total, field) => total + p[field], 0) /
    ROUTINGLAB_PROGRESS_FIELDS.length);
}
