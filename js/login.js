document.getElementById("loginForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;
  const msg = document.getElementById("loginMessage");
  const result = RoutingAuth.login(username, password);
  if (!result.ok) {
    msg.className = "alert error";
    msg.textContent = result.message;
    return;
  }
  msg.className = "alert success";
  msg.textContent = "Login berhasil. Mengarahkan...";
  setTimeout(() => {
    location.href =
      result.session.role === "guru"
        ? "dashboard-guru.html"
        : "dashboard-siswa.html";
  }, 250);
});
document.querySelectorAll("[data-demo]").forEach((btn) =>
  btn.addEventListener("click", () => {
    document.getElementById("username").value =
      btn.dataset.demo === "guru" ? "guru01" : "siswa01";
    document.getElementById("password").value = "123456";
  }),
);
