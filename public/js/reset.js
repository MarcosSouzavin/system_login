const token = location.hash.replace("#", "");
document.getElementById("token").value = token;

const msg = document.getElementById("msg");
document.getElementById("btnReset").addEventListener("click", resetPass);

function setMsg(type, data) {
  msg.style.display = "block";
  msg.className = "msg " + (type || "");
  msg.textContent = typeof data === "string" ? data : JSON.stringify(data, null, 2);
}

async function safeJson(r) {
  try { return await r.json(); } catch { return {}; }
}

async function resetPass() {
  if (!token) {
    setMsg("warn", "Sem token no link. Usa o reset_link que sai do /forgot-password.");
    return;
  }

  const newPassword = document.getElementById("newPass").value;

  const r = await fetch("/reset-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, newPassword }),
    credentials: "include"
  });

  const body = await safeJson(r);

  if (r.ok) {
    setMsg("ok", "Senha trocada. Voltando pro login…");
    setTimeout(() => location.href = "/login.html", 650);
  } else {
    setMsg("bad", { status: r.status, ...body });
  }
}
