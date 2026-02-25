# 💬 RTC Web Chat — Fluxy (Rust + Next.js)

---

## ✨ Fonctionnalités

- 🔐 Authentification complète (login / register / forgot / reset) via Supabase  
- 🏠 Création & gestion de serveurs (owner / admin / member)
- 📁 Création, modification et suppression de channels
- 💬 Chat temps réel par WebSocket (par serveur + channel)
- 👤 Profils utilisateurs avec avatar & username
- 🖼️ Avatars personnalisés
- 👥 Liste des membres + rôles + statut online/offline
- 🔗 Invitations par lien
- ⚡ UI moderne avec Next.js + Tailwind CSS

---

## 🧱 Stack technique

### Backend

- Rust (Actix Web)
- WebSocket avec Actix Actors
- MongoDB (persistance)
- Supabase (authentification + profils)
- Sessions via cookies Actix

### Frontend

- Next.js (App Router)
- React
- Tailwind CSS
- API proxy côté Next vers le backend Rust

---

## 📐 Architecture générale

.
├── src/ # Backend Rust
│ ├── main.rs
│ ├── handlers.rs
│ ├── models.rs
│ ├── supabase.rs
│ ├── db_mongo_connection.rs
│ ├── db_mongo_getter.rs
│ ├── db_mongo_setter.rs
│ ├── db_mongo_update.rs
│ └── db_mongo_delete.rs
│
└── rtc-app/ # Frontend Next.js
├── app/
│ ├── channels/
│ ├── api/
│ └── components/
└── ...

yaml
Copier le code

---

## 🧠 Fonctionnement global

### 🔐 Authentification

1. Le frontend appelle `/api/login`, `/api/register`, etc. (Next.js)
2. Ces routes proxient vers le backend Rust
3. Le backend dialogue avec Supabase
4. En cas de succès :
   - Supabase retourne un user + session
   - Actix crée un cookie de session (`user_id`, `email`, `username`)
5. Redirection automatique vers `/channels`

---

### 🏠 Gestion des serveurs

#### Création

Front → /api/create-server (Next)
→ /api/create-server (Rust)
→ MongoDB (set_server)

diff
Copier le code

Le serveur est créé avec :
- id
- name
- image (optionnelle)
- owner_id
- member_id initial (fondateur)

#### Récupération

/api/user-servers

pgsql
Copier le code

Retourne pour chaque serveur :

```json
{
  "id": "...",
  "name": "...",
  "image": "...",
  "is_owner": true/false,
  "is_admin": true/false
}
Utilisé pour construire la navbar.

Mise à jour
Nom et image modifiables

Propagés via /api/update-server

Sauvegardés dans MongoDB

📁 Channels & 💬 Messages
Channels
Liste : /api/server-channels?server_id=...

Création : /api/channel/create

Update : /api/channel/update

Suppression : /api/channel/delete

👉 Permissions vérifiées côté backend (owner/admin).

Messages
Historique
bash
Copier le code
/api/channel-messages?channel_id=...
Retourne :

id

message

user

username

time

Temps réel
WebSocket :

bash
Copier le code
ws://localhost:3000/ws?server_id=...&channel_id=...
Un ChatServer central :

maintient les sessions par (server, channel)

diffuse chaque message uniquement aux bons clients

👤 Profils & avatars
Table user côté Supabase :

username

email

avatar

Endpoints dédiés :

/api/update-profile

/api/update-username

Pour le chat :

/api/allusers fournit un mapping complet user_id → username/avatar

▶️ Lancement du projet
✅ Prérequis
Rust (toolchain stable)

Node.js + npm ou yarn

MongoDB (local ou Atlas)

Projet Supabase configuré

Fichier .env rempli (Mongo + Supabase)

🚀 Backend Rust
À la racine du projet :

bash
Copier le code
cargo run
Serveur disponible sur :

cpp
Copier le code
http://127.0.0.1:3000
🚀 Frontend Next.js
Dans rtc-app/ :

bash
Copier le code
npm install
npm run dev

# ou

yarn
yarn dev
Frontend disponible sur :

arduino
Copier le code
http://localhost:3001
Le frontend utilise rtc-app/app/api/* comme proxy vers :

cpp
Copier le code
http://127.0.0.1:3000
⚠️ Assure-toi que les deux serveurs tournent en même temps.

🧩 Résumé
🦀 Rust / Actix :

logique métier

WebSocket temps réel

MongoDB

🔐 Supabase :

authentification

profils utilisateurs

⚛️ Next.js / React :

interface moderne

navigation serveurs / channels

chat en direct

📸 Aperçu
Tu peux ajouter ici des screenshots ou gifs de l’UI 😉

🛠️ Améliorations possibles
🔔 Notifications

✍️ Indicateur “user is typing”

📎 Upload de fichiers

🔍 Recherche de messages

📱 Responsive mobile

🧪 Tests automatisés

🚀 Déploiement Docker
