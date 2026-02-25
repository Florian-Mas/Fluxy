use serde::{Deserialize, Serialize};
use actix::{Message, Recipient};

/// Configuration globale de l'application (clés Supabase, clé de session...).
#[derive(Clone)]
pub struct AppConfig {
    pub supabase_url: String,
    pub supabase_anon_key: String,
    pub supabase_service_role_key: String,
    pub session_key: String,
}

/// Données envoyées par le formulaire de login (email + mot de passe).
#[derive(Deserialize)]
pub struct LoginForm {
    pub email: String,
    pub password: String,
}


/// Message envoyé sur le bus Actix pour diffuser un message de chat dans un serveur / channel.
#[derive(Message)]
#[rtype(result = "()")]
pub struct ChatMessage {
    pub server_id: i64,
    pub channel_id: i64,
    pub content: String,
}

/// Message Actix pour rejoindre un chat (associe une adresse WebSocket à un serveur + channel + user).
#[derive(Message)]
#[rtype(result = "()")]
pub struct JoinChat {
    pub addr: Recipient<ChatMessage>,
    pub server_id: i64,
    pub channel_id: i64,
    pub user_id: i64,
}

/// Message Actix pour quitter le chat (décrémenter / nettoyer les sessions d'un user).
#[derive(Message)]
#[rtype(result = "()")]
pub struct LeaveChat {
    pub user_id: i64,
    pub addr: Option<Recipient<ChatMessage>>, // Optionnel : pour retirer la session de la liste
}

/// Message Actix pour demander la liste des utilisateurs connectés (renvoie Vec<i64>).
#[derive(Message)]
#[rtype(result = "Vec<i64>")]
pub struct GetConnectedUsers;

/// Message Actix signalant qu'un utilisateur vient de se connecter.
#[derive(Message)]
#[rtype(result = "()")]
pub struct UserConnected {
    pub user_id: i64,
}

/// État interne du serveur de chat (sessions WebSocket et utilisateurs connectés).
pub struct ChatServer {
    pub sessions: Vec<(Recipient<ChatMessage>, i64, i64)>, // (addr, server_id, channel_id)
    pub connected_users: std::collections::HashSet<i64>, // user_id des utilisateurs connectés
    pub user_session_count: std::collections::HashMap<i64, usize>, // Nombre de sessions WebSocket par utilisateur
}


/// Formulaire "mot de passe oublié" (adresse email uniquement).
#[derive(Deserialize)]
pub struct ForgotForm {
    pub email: String,
}

/// Formulaire de réinitialisation de mot de passe (token + nouveau mot de passe).
#[derive(Deserialize)]
pub struct ResetPasswordForm {
    pub token: String,
    pub password: String,
}

/// Formulaire d'inscription (username, email, mot de passe).
#[derive(Deserialize)]
pub struct RegisterForm {
    pub username: String,
    pub email: String,
    pub password: String,
}

/// Formulaire de création de serveur (nom + image optionnelle).
#[derive(Deserialize)]
pub struct CreateServerForm {
    pub name: String,
    pub image: Option<String>,
}

/// Formulaire de création de channel (serveur cible, nom et position).
#[derive(Deserialize)]
pub struct CreateChannelForm {
    pub server_id: i64,
    pub name: String,
    pub position: i64,
}

/// Formulaire de mise à jour d'un channel (serveur, id du channel, nouveau nom/position).
#[derive(Deserialize)]
pub struct UpdateChannelForm {
    pub server_id: i64,
    pub channel_id: i64,
    pub name: String,
    pub position: i64,
}

/// Formulaire de suppression d'un channel (serveur + id du channel).
#[derive(Deserialize)]
pub struct DeleteChannelForm {
    pub server_id: i64,
    pub channel_id: i64,
}

/// Paramètres de requête pour récupérer les channels d'un serveur.
#[derive(Deserialize)]
pub struct ServerChannelsQuery {
    pub server_id: i64,
}

/// Paramètres de requête pour récupérer les messages d'un channel.
#[derive(Deserialize)]
pub struct ChannelMessagesQuery {
    pub channel_id: i64,
}

/// Formulaire pour rejoindre un serveur par son id (join-server).
#[derive(Deserialize)]
pub struct JoinServerForm {
    pub server_id: i64,
}

/// Formulaire pour créer un lien d'invitation pour un serveur.
#[derive(Deserialize)]
pub struct CreateInviteLinkForm {
    pub server_id: i64,
}

/// Formulaire pour rejoindre un serveur via un lien / code d'invitation.
#[derive(Deserialize)]
pub struct JoinByLinkForm {
    pub link: String,
}

/// Paramètres de requête pour récupérer les membres d'un serveur.
#[derive(Deserialize)]
pub struct ServerMembersQuery {
    pub server_id: i64,
}

/// Formulaire pour supprimer un serveur.
#[derive(Deserialize)]
pub struct DeleteServerForm {
    pub server_id: i64,
}

/// Formulaire pour mettre à jour les propriétés d'un serveur (nom / image).
#[derive(Deserialize)]
pub struct UpdateServerForm {
    pub server_id: i64,
    pub name: Option<String>,
    pub image: Option<String>,
}

/// Formulaire pour quitter un serveur.
#[derive(Deserialize)]
pub struct LeaveServerForm {
    pub server_id: i64,
}

/// Formulaire pour changer le rôle d'un membre (admin / membre) sur un serveur.
#[derive(Deserialize)]
pub struct UpdateMemberRoleForm {
    pub server_id: i64,
    pub user_id: i64,
    pub role: String, // "admin" ou "membre"
}

/// Formulaire pour exclure un membre d'un serveur.
#[derive(Deserialize)]
pub struct KickMemberForm {
    pub server_id: i64,
    pub user_id: i64, // L'utilisateur à exclure
}

/// Formulaire pour transférer le rôle de fondateur (owner) à un autre membre.
#[derive(Deserialize)]
pub struct SwitchOwnerForm {
    pub server_id: i64,
    pub new_owner_id: i64,
}

/// Formulaire pour supprimer un message (par son id).
#[derive(Deserialize)]
pub struct DeleteMessageForm {
    pub message_id: i64,
}

/// Réponse brute de Supabase après une authentification.
#[derive(Deserialize)]
pub struct SupabaseAuthResponse {
    pub user: SupabaseUser,
    #[serde(default)]
    pub session: Option<SupabaseSession>,
}

/// Représentation minimale d'un utilisateur renvoyé par Supabase lors d'un signup.
#[derive(Deserialize)]
pub struct SupabaseSignupUser {
    pub id: String,
    pub email: Option<String>,
}

/// Session Supabase (porte notamment le jeton d'accès).
#[derive(Deserialize)]
pub struct SupabaseSession {
    pub access_token: String,
}

/// Utilisateur Supabase (id + email).
#[derive(Deserialize)]
pub struct SupabaseUser {
    pub id: String,
    pub email: Option<String>,
}

// ==== API JSON simple pour Next.js ==== //

/// Données renvoyées à Next.js pour représenter l'utilisateur courant.
#[derive(Serialize)]
pub struct UserResponse {
    pub user_id: Option<String>,
    pub auth_id: Option<String>,
    pub email: Option<String>,
    pub username: Option<String>,
    pub avatar: Option<String>,
}

/// Utilisateur complet stocké côté backend (id, auth_id, username, email, avatar...).
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct User {
    pub id: String,
    pub auth_id: String,
    pub username: String,
    pub email: String,
    pub avatar: Option<String>,
}