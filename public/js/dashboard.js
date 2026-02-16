const out = document.getElementById("out");
document.getElementById("btnRefresh").addEventListener("click", loadMe);
document.getElementById("btnLogout").addEventListener("click", logout);

async function safeJson(r) {
  try { return await r.json(); } catch { return {}; }
}

async function loadMe() {
  const r = await fetch("/me", { credentials: "include" });
  const body = await safeJson(r);

  if (r.status === 401) {
    out.textContent = JSON.stringify({ status: r.status, body }, null, 2);
    setTimeout(() => location.href = "/login.html", 450);
    return;
  }

  out.textContent = JSON.stringify({ status: r.status, body }, null, 2);
}

async function logout() {
  await fetch("/logout", { method: "POST", credentials: "include" });
  location.href = "/login.html";
}

loadMe();
