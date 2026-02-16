# System Login 🔐

Sistema completo de autenticação com **cadastro**, **login**, **sessão via cookie**, **rota protegida**, **logout** e **reset de senha** (token com expiração).  
Backend em **Node.js + Express** e banco **SQLite**.

##  Features
- Cadastro de usuário com validação
- Senha com hash (**bcrypt**)
- Login com **JWT** em cookie **httpOnly**
- Rota protegida: `/me`
- Logout
- Recuperação de senha:
  - Gera token com expiração
  - Tela `reset.html#TOKEN` para redefinir a senha
- Anti brute-force no login (**rate limit**)

## Stack
- Node.js
- Express
- SQLite (better-sqlite3)
- bcrypt
- jsonwebtoken
- cookie-parser
- dotenv
- nanoid
- express-rate-limit

##  Estrutura

system_login/
src/
app.js
db.js
auth.js
public/
->css/ 
--> styles.css
->js/
-->dashboard.js
-->index.js
-->reset.js
    
->login.html
->dashboard.html
->reset.html
.env
package.json
database.sqlite (gerado automaticamente)
