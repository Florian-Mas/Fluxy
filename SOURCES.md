
connexion
Endpoint `POST /auth/v1/token?grant_type=password`
Documentation https://supabase.com/docs/reference/api/auth-signinwithpassword
Headers requis
  - `apikey`: Votre clé anonyme Supabase
  - `Content-Type: application/json`
- **Body** :
  ```json
  {
    "email": "user@example.com",
    "password": "password"
  }
  ```

inscription
- **Endpoint** : `POST /auth/v1/signup`
- **Documentation** : https://supabase.com/docs/reference/api/auth-signup
- **Headers requis** :
  - `apikey`: Votre clé anonyme Supabase
  - `Authorization: Bearer {anon_key}`: Votre clé anonyme Supabase
  - `Content-Type: application/json`
- **Body** :
  ```json
  {
    "email": "user@example.com",
    "password": "password"
  }
  ```



### Recover Password
- **Endpoint** : 'POST /auth/v1/recover'
### Structure de réponse
```json
{
  "access_token": "eyJhbGc...",
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  }
}
```

## 📚 Documentation Principale

- **Documentation Supabase Auth** : https://supabase.com/docs/reference/api/auth
- **API Reference complète** : https://supabase.com/docs/reference
- **Dashboard Supabase** : https://supabase.com/dashboard (pour récupérer vos clés)

## 🔑 Où trouver vos clés API

1. Allez sur https://supabase.com/dashboard
2. Sélectionnez votre projet
3. **Settings** → **API**
4. Copiez :
   - **URL** : `https://votre-projet.supabase.co`
   - **anon public key** : Pour `SUPABASE_ANON_KEY`

## ⚠️ Notes Importantes

- L'endpoint `/auth/v1/signup` nécessite **deux headers** : `apikey` ET `Authorization: Bearer {key}`
- L'endpoint `/auth/v1/token` fonctionne avec seulement `apikey`
- La clé `anon` est publique et peut être utilisée côté client
- Ne jamais exposer la clé `service_role` côté client

## 📚 Sources – Serveur de chat (Rust)

- **Rust / Langage**
  - The Rust Programming Language (Rust Book) : `https://doc.rust-lang.org/book/`
  - Référence de la bibliothèque standard (réseau, gestion des erreurs, etc.) : `https://doc.rust-lang.org/std/`

- **Runtime asynchrone (Tokio)**
  - Guide officiel Tokio (tâches asynchrones, `TcpListener`, `tokio::spawn`, canaux de communication, etc.) : `https://tokio.rs/tokio/tutorial`
  - Documentation de l’API Tokio : `https://docs.rs/tokio`

- **WebSocket / HTTP (selon l’implémentation choisie)**
  - Documentation `tokio-tungstenite` (WebSocket asynchrone) : `https://docs.rs/tokio-tungstenite`


- **Exemples de serveurs de chat en Rust**
  - Exemples “chat server” du guide Tokio et de dépôts GitHub communautaires (pattern : `TcpListener`, boucle d’acceptation, gestion d’un pool de clients, diffusion via canaux `broadcast` / `mpsc`).
  - Articles de blog et tutoriaux Rust/Tokio sur la conception de serveurs de chat asynchrones (gestion des connexions, partage d’état avec `Arc<Mutex<...>>`, etc.).
