require("dotenv").config();
const express = require("express");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcrypt");
const { nanoid } = require("nanoid");
const db = require("./db");
const { signToken, requireAuth } = require("./auth");

const rateLimit = require("express-rate-limit");
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: "Muitas requisições, tente novamente mais tarde." }
});
const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(express.static("public"));

function nowISO() {
  return new Date().toISOString();
}
function addHoursISO(hours) {
  const d = new Date();
  d.setHours(d.getHours() + hours);
  return d.toISOString();
}
function isValidEmail(email) {
    return typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
function isValidPassword(password) {    
    // Mínimo 8 caracteres, pelo menos uma letra e um número
    return typeof password === "string" && password.length >= 8 && /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/.test(password);

}

app.get("/", (req, res) => res.json({ ok: true, message: "Login System rodando" }));

app.post("/register", async (req, res) => {
  const { email, password } = req.body ?? {};
 if (!email || !password) return res.status(400).json({ error: "Email e senha são obrigatórios." });
 if (!isValidEmail(email)) return res.status(400).json({ error: "Email inválido." });
 if (!isValidPassword(password)) return res.status(400).json({ error: "Senha fraca: mínimo 8, com letra e número." });

  const exists = db.prepare("SELECT id FROM users WHERE email = ?").get(email.toLowerCase().trim());
  if (exists) return res.status(409).json({ error: "Email já cadastrado." });

  const id = nanoid();
  const password_hash = await bcrypt.hash(password, 12);

  db.prepare("INSERT INTO users (id, email, password_hash, created_at) VALUES (?, ?, ?, ?)")
    .run(id, email.toLowerCase().trim(), password_hash, nowISO());

  return res.status(201).json({ ok: true });
});

app.post("/login", loginLimiter, async (req, res) => {
  const { email, password } = req.body ?? {};
  if (!email || !password) return res.status(400).json({ error: "Email e senha são obrigatórios." });

  const user = db.prepare("SELECT id, password_hash FROM users WHERE email = ?").get(email.toLowerCase().trim());
  if (!user) return res.status(401).json({ error: "Credenciais inválidas." });

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: "Credenciais inválidas." });

  const token = signToken(user.id);
  res.cookie("token", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: false, // produção: true (HTTPS)
    maxAge: 7 * 24 * 60 * 60 * 1000
  });

  return res.json({ ok: true });
});

app.post("/logout", (req, res) => {
  res.clearCookie("token");
  return res.json({ ok: true });
});

app.get("/me", requireAuth, (req, res) => {
  const user = db.prepare("SELECT id, email, created_at FROM users WHERE id = ?").get(req.userId);
  return res.json({ user });
});

app.post("/forgot-password", (req, res) => {
  const { email } = req.body ?? {};
  if (!email) return res.status(400).json({ error: "Email é obrigatório." });

  const user = db.prepare("SELECT id FROM users WHERE email = ?").get(email.toLowerCase().trim());
  if (!user) return res.json({ ok: true });

  const token = nanoid(32);
  db.prepare("INSERT INTO reset_tokens (token, user_id, expires_at, used) VALUES (?, ?, ?, 0)")
    .run(token, user.id, addHoursISO(1));

 return res.json({
  ok: true,
  reset_link: `http://localhost:${process.env.PORT || 3000}/reset.html#${token}`
});
    });

app.post("/reset-password", async (req, res) => {
  const { token, newPassword } = req.body ?? {};
  if (!token || !newPassword) return res.status(400).json({ error: "Token e nova senha são obrigatórios." });
  if (newPassword.length < 8) return res.status(400).json({ error: "Senha precisa ter pelo menos 8 caracteres." });
  if (!isValidPassword(newPassword)) return res.status(400).json({ error: "Senha fraca: mínimo 8, com letra e número." });

  const row = db.prepare("SELECT token, user_id, expires_at, used FROM reset_tokens WHERE token = ?").get(token);
  if (!row) return res.status(400).json({ error: "Token inválido." });
  if (row.used) return res.status(400).json({ error: "Token já utilizado." });
  if (new Date(row.expires_at).getTime() < Date.now()) return res.status(400).json({ error: "Token expirado." });

  const hash = await bcrypt.hash(newPassword, 12);

  const tx = db.transaction(() => {
    db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(hash, row.user_id);
    db.prepare("UPDATE reset_tokens SET used = 1 WHERE token = ?").run(token);
  });
  tx();

  return res.json({ ok: true });
});

app.listen(process.env.PORT || 3000, () => {
  console.log(`Server on http://localhost:${process.env.PORT || 3000}`);
});
