const RoutingAuth = (() => {
  const USERS = {
    siswa01: {
      password: "123456",
      role: "siswa",
      name: "Siswa Demo",
      classCode: "X-TJKT-A",
    },
    guru01: {
      password: "123456",
      role: "guru",
      name: "Guru Demo",
      classCode: "X-TJKT-A",
    },
  };
  function login(username, password) {
    const user = USERS[username];
    if (!user || user.password !== password)
      return { ok: false, message: "Username atau password salah." };
    const session = {
      username,
      role: user.role,
      name: user.name,
      classCode: user.classCode,
      loginAt: Date.now(),
    };
    localStorage.setItem("routinglab_session", JSON.stringify(session));
    return { ok: true, session };
  }
  function getSession() {
    try {
      return JSON.parse(localStorage.getItem("routinglab_session")) || null;
    } catch {
      return null;
    }
  }
  function logout() {
    localStorage.removeItem("routinglab_session");
    location.href = "index.html";
  }
  function requireRole(role) {
    const s = getSession();
    if (!s) {
      location.href = "index.html";
      return null;
    }
    if (role && s.role !== role) {
      location.href =
        s.role === "guru" ? "dashboard-guru.html" : "dashboard-siswa.html";
      return null;
    }
    return s;
  }
  return { login, getSession, logout, requireRole };
})();
