const msg = document.getElementById("msg");

const tabLogin = document.getElementById("tabLogin");
const tabRegister = document.getElementById("tabRegister");
const tabForgot = document.getElementById("tabForgot");

const sectionLogin = document.getElementById("sectionLogin");
const sectionRegister = document.getElementById("sectionRegister");
const sectionForgot = document.getElementById("sectionForgot");

const lEmail = document.getElementById("lEmail");
const lPass = document.getElementById("lPass");

const rEmail = document.getElementById("rEmail");
const rPass = document.getElementById("rPass");

const fEmail = document.getElementById("fEmail");

document.getElementById("btnLogin").addEventListener("click", login);
document.getElementById("btnRegister").addEventListener("click", register);
document.getElementById("btnForgot").addEventListener("click", forgot);
document.getElementById("btnGoDash").addEventListener("click", () => location.href = "/dashboard.html");

tabLogin.addEventListener("click", () => show("login"));
tabRegister.addEventListener("click", () => show("register"));
tabForgot.addEventListener("click", () => show("forgot"));

function setMsg(type, data) {
  msg.style.display = "block";
  msg.className = "msg " + (type || "");
  msg.textContent = typeof data === "string" ? data : JSON.stringify(data, null, 2);
}

function clearMsg() {
  msg.style.display = "none";
  msg.textContent = "";
  msg.className = "msg";
}

function show(which) {
  clearMsg();

  sectionLogin.classList.remove("active");
  sectionRegister.classList.remove("active");
  sectionForgot.classList.remove("active");

  tabLogin.classList.remove("active");
  tabRegister.classList.remove("active");
  tabForgot.classList.remove("active");

  if (which === "login") {
    sectionLogin.classList.add("active");
    tabLogin.classList.add("active");
  } else if (which === "register") {
    sectionRegister.classList.add("active");
    tabRegister.classList.add("active");
  } else {
    sectionForgot.classList.add("active");
    tabForgot.classList.add("active");
  }
}

async function safeJson(r) {
  try { return await r.json(); } catch { return {}; }
}

async function register() {
  const email = rEmail.value.trim();
  const password = rPass.value;

  const r = await fetch("/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
    credentials: "include"
  });

  const body = await safeJson(r);

  if (r.ok) {
    setMsg("ok", "Conta criada! ");
    show("login");
    lEmail.value = email;
    lPass.value = password;
  } else {
    setMsg("bad", { status: r.status, ...body });
  }
}

async function login() {
  const email = lEmail.value.trim();
  const password = lPass.value;

  const r = await fetch("/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
    credentials: "include"
  });

  const body = await safeJson(r);

  if (r.ok) {
    setMsg("ok", "Logado! Indo pro dashboard…");
    setTimeout(() => location.href = "/dashboard.html", 450);
  } else {
    setMsg("bad", { status: r.status, ...body });
  }
}

async function forgot() {
  const email = fEmail.value.trim();

  const r = await fetch("/forgot-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email })
  });

  const body = await safeJson(r);

  if (r.ok && body.reset_link) {
    setMsg("ok", `Link de reset:\n${body.reset_link}\n\nAbrindo em nova aba…`);
    window.open(body.reset_link, "_blank");
  } else if (r.ok) {
    setMsg("warn", "Ok. Se esse email existir, o reset foi gerado (o sistema não entrega).");
  } else {
    setMsg("bad", { status: r.status, ...body });
  }
}
