use actix_session::Session;
use actix_web::{web, HttpRequest, HttpResponse, Responder};
use actix_web_actors::ws;
use actix::Addr;
use std::sync::{Arc, Mutex};

use crate::models::{
    LoginForm, RegisterForm, ForgotForm, ResetPasswordForm, CreateServerForm, CreateChannelForm,
    UpdateChannelForm, DeleteChannelForm, ServerChannelsQuery, ChannelMessagesQuery, JoinServerForm,
    ServerMembersQuery, DeleteServerForm, UpdateServerForm, LeaveServerForm, UpdateMemberRoleForm,
    KickMemberForm, SwitchOwnerForm, DeleteMessageForm, CreateInviteLinkForm, JoinByLinkForm, AppConfig,
};
use crate::chat::ChatSession;
use crate::models::{ChatServer, GetConnectedUsers, LeaveChat, UserConnected};
use crate::supabase;
use crate::getters;
use crate::db_mongo_setter;
use crate::db_mongo_delete;
use crate::db_mongo_update;
use crate::db_mongo_connection;
use crate::db_mongo_getter;
use std::env;
use serde::Deserialize;

#[derive(Deserialize)]
pub struct WsChatQuery {
    pub server_id: i64,
    pub channel_id: i64,
}

fn get_user_id_from_session(user_response: &crate::models::UserResponse) -> Result<i64, HttpResponse> {
    let user_id = match user_response.user_id {
        Some(ref id) => id,
        None => {
            return Err(HttpResponse::Unauthorized().json(serde_json::json!({
                "error": "Utilisateur non connecté"
            })));
        }
    };
    
    user_id.parse::<i64>().map_err(|_| {
        HttpResponse::BadRequest().json(serde_json::json!({
            "error": "ID utilisateur invalide"
        }))
    })
}

async fn get_mongo_client_and_db() -> Result<(mongodb::Client, String), HttpResponse> {
    let client = db_mongo_connection::get_client().await.map_err(|e| {
        eprintln!("Erreur de connexion MongoDB: {}", e);
        HttpResponse::InternalServerError().json(serde_json::json!({
            "error": "Erreur de connexion à la base de données"
        }))
    })?;
    
    let db_name = env::var("MONGO_DATA_BASE_NAME").map_err(|_| {
        HttpResponse::InternalServerError().json(serde_json::json!({
            "error": "Configuration de la base de données manquante"
        }))
    })?;
    
    Ok((client, db_name))
}

// Helper pour marquer un utilisateur comme connecté s'il a une session valide
fn mark_user_connected_if_session_valid(
    user_response: &crate::models::UserResponse,
    chat_data: &web::Data<Arc<Mutex<Addr<ChatServer>>>>,
) {
    if let Ok(user_id) = get_user_id_from_session(user_response) {
        let addr = chat_data.lock().unwrap().clone();
        addr.do_send(UserConnected { user_id });
    }
}

pub async fn api_user(
    session: Session, 
    config: web::Data<AppConfig>,
    chat_data: web::Data<Arc<Mutex<Addr<ChatServer>>>>,
) -> impl Responder {
    let user_response = getters::get_user_response_from_session(&session, &config).await;
    
    // Marquer l'utilisateur comme connecté s'il a une session valide
    mark_user_connected_if_session_valid(&user_response, &chat_data);
    
    HttpResponse::Ok().json(user_response)
}


pub async fn get_all_users(config: web::Data<AppConfig>) -> impl Responder {
    match getters::get_all_users(&config).await {
        Ok(users) => HttpResponse::Ok().json(users),
        Err(e) => {
            eprintln!("Erreur lors de la récupération des utilisateurs: {}", e);
            HttpResponse::InternalServerError().json(serde_json::json!({ "error": e }))
        }
    }
}

pub async fn api_logout(
    session: Session,
    chat_data: web::Data<Arc<Mutex<Addr<ChatServer>>>>,
) -> impl Responder {
    // Récupérer l'user_id avant de supprimer la session
    let user_id_str: Option<String> = session.get("user_id").ok().flatten();
    
    // Supprimer explicitement toutes les clés de session
    session.remove("user_id");
    session.remove("user_email");
    session.remove("username");
    // Purger la session (supprime le cookie)
    session.purge();
    
    // Retirer l'utilisateur de la liste des connectés
    if let Some(user_id_str) = user_id_str {
        if let Ok(user_id) = user_id_str.parse::<i64>() {
            println!("[LOGOUT] Utilisateur {} déconnecté", user_id);
            let addr = chat_data.lock().unwrap().clone();
            addr.do_send(LeaveChat { user_id, addr: None });
        }
    }
    
    // Créer une réponse avec un cookie expiré pour forcer la suppression
    HttpResponse::Ok()
        .cookie(
            actix_web::cookie::Cookie::build("actix-session", "")
                .path("/")
                .max_age(actix_web::cookie::time::Duration::seconds(0))
                .http_only(true)
                .same_site(actix_web::cookie::SameSite::Lax)
                .finish()
        )
        .json(serde_json::json!({ "message": "Déconnexion réussie" }))
}

#[derive(Deserialize)]
pub struct UpdateProfileRequest {
    pub avatar: Option<String>,
}

/// Met à jour la photo de profil (avatar) de l'utilisateur connecté
pub async fn update_profile(
    session: Session,
    config: web::Data<AppConfig>,
    body: web::Json<UpdateProfileRequest>,
) -> impl Responder {
    let user_response = getters::get_user_response_from_session(&session, &config).await;

    let auth_id = match user_response.auth_id {
        Some(ref id) => id.clone(),
        None => {
            return HttpResponse::Unauthorized().json(serde_json::json!({
                "error": "Utilisateur non connecté"
            }))
        }
    };

    if let Some(avatar) = &body.avatar {
        match supabase::update_user_avatar(&config, &auth_id, avatar).await {
            Ok(_) => HttpResponse::Ok().json(serde_json::json!({ "success": true })),
            Err(e) => {
                eprintln!("Erreur lors de la mise à jour de l'avatar: {}", e);
                HttpResponse::InternalServerError().json(serde_json::json!({
                    "error": "Erreur lors de la mise à jour de l'avatar"
                }))
            }
        }
    } else {
        HttpResponse::BadRequest().json(serde_json::json!({
            "error": "Aucun avatar fourni"
        }))
    }
}

#[derive(Deserialize)]
pub struct UpdateUsernameRequest {
    pub username: String,
}

/// Met à jour le username de l'utilisateur connecté
pub async fn update_username(
    session: Session,
    config: web::Data<AppConfig>,
    body: web::Json<UpdateUsernameRequest>,
) -> impl Responder {
    let user_response = getters::get_user_response_from_session(&session, &config).await;

    let auth_id = match user_response.auth_id {
        Some(ref id) => id.clone(),
        None => {
            return HttpResponse::Unauthorized().json(serde_json::json!({
                "error": "Utilisateur non connecté"
            }))
        }
    };

    if body.username.trim().is_empty() {
        return HttpResponse::BadRequest().json(serde_json::json!({
            "error": "Username vide"
        }));
    }

    match supabase::update_user_username(&config, &auth_id, &body.username).await {
        Ok(_) => HttpResponse::Ok().json(serde_json::json!({ "success": true })),
        Err(e) => {
            eprintln!("Erreur lors de la mise à jour du username: {}", e);
            HttpResponse::InternalServerError().json(serde_json::json!({
                "error": "Erreur lors de la mise à jour du username"
            }))
        }
    }
}

pub async fn forgot(
    form: web::Form<ForgotForm>,
    config: web::Data<AppConfig>,
) -> impl Responder {
    match supabase::ask_forgot_to_supabase(&config, &form.email).await {
        Ok(()) => HttpResponse::Found()
            .append_header(("Location", "/forgot-sent"))
            .finish(),
        Err(msg) => HttpResponse::BadRequest()
            .content_type("text/html; charset=utf-8")
            .body(format!("<h2>Erreur</h2><p>{}</p><p><a href=\"/forgot\">Réessayer</a></p>", msg)),
    }
}

pub async fn reset_password(
    form: web::Form<ResetPasswordForm>,
    config: web::Data<AppConfig>,
) -> impl Responder {
    match supabase::reset_password_with_token(&config, &form.token, &form.password).await {
        Ok(()) => HttpResponse::Ok()
            .content_type("text/plain; charset=utf-8")
            .body("Mot de passe réinitialisé avec succès"),
        Err(msg) => HttpResponse::BadRequest()
            .content_type("text/plain; charset=utf-8")
            .body(msg),
    }
}

pub async fn login(
    form: web::Form<LoginForm>,
    session: Session,
    config: web::Data<AppConfig>,
    chat_data: web::Data<Arc<Mutex<Addr<ChatServer>>>>,
) -> impl Responder {
    let email = form.email.clone();
    match supabase::ask_login_to_supabase(&config, &form.email, &form.password).await {
        Ok(ok) => {
            let user_id = ok.user.id;
            let user_email = ok.user.email.unwrap_or_else(|| email.clone());
            
            session.insert("user_id", user_id).ok();
            session.insert("user_email", user_email).ok();
            
            let user_response = getters::get_user_response_from_session(&session, &config).await;
            if let Some(username) = user_response.username.clone() {
                session.insert("username", username).ok();
            }
            
            // Ajouter l'utilisateur à la liste des connectés
            // On utilise get_user_id_from_session pour obtenir le user_id numérique
            if let Ok(user_id_num) = get_user_id_from_session(&user_response) {
                println!("[LOGIN] Utilisateur {} connecté", user_id_num);
                let addr = chat_data.lock().unwrap().clone();
                addr.do_send(UserConnected { user_id: user_id_num });
            }
            
            HttpResponse::Ok()
                .content_type("application/json; charset=utf-8")
                .json(serde_json::json!({
                    "success": true,
                    "message": "Connexion réussie",
                    "redirect": "/home"
                }))
        }
        Err(msg) => HttpResponse::Unauthorized()
            .content_type("text/plain; charset=utf-8")
            .body(msg),
    }
}

pub async fn register(
    form: web::Form<RegisterForm>,
    session: Session,
    config: web::Data<AppConfig>,
) -> impl Responder {
    let email = form.email.clone();
    let username = form.username.clone();
    match supabase::ask_register_to_supabase(&config, &form.email, &form.password).await {
        Ok(user) => {
            let user_email = user.email.unwrap_or_else(|| email.clone());
            if let Err(err) = supabase::create_user_in_table(&config, &user.id, &form.username, &user_email).await {
                return HttpResponse::BadRequest()
                    .content_type("text/html; charset=utf-8")
                    .body(format!(
                        r#"<h2>Erreur d'inscription</h2><p>{}</p><p><a href="/register">Réessayer</a></p>"#,
                        err
                    ));
            }

            session.insert("user_id", user.id).ok();
            session.insert("user_email", user_email).ok();
            session.insert("username", username).ok();

            HttpResponse::Ok()
                .content_type("text/html; charset=utf-8")
                .body(r#"Compte créé !. Vérifie ton email pour confirmer, puis connecte-toi."#)
        }
        Err(msg) => HttpResponse::BadRequest()
            .content_type("text/html; charset=utf-8")
            .body(format!(
                r#"<h2>Erreur d'inscription</h2><p>{}</p><p><a href="/register">Réessayer</a></p>"#,
                msg
            )),
    }
}

pub async fn page_forgot_sent() -> impl Responder {
    HttpResponse::Ok()
        .content_type("text/html; charset=utf-8")
        .body(r#"<h2>Email envoyé</h2><p>Vérifie ta boîte mail pour réinitialiser ton mot de passe.</p><p><a href="/">Retour à l'accueil</a></p>"#)
}

pub async fn chat_ws(
    req: HttpRequest,
    stream: web::Payload,
    data: web::Data<Arc<Mutex<Addr<ChatServer>>>>,
    session: Session,
    config: web::Data<AppConfig>,
    query: web::Query<WsChatQuery>,
) -> Result<HttpResponse, actix_web::Error> {
    let maybe_email: Option<String> = session.get("user_email").ok().flatten();
    
    let email = maybe_email.unwrap_or_else(|| "anonymous@example.com".to_string());
    
    let user_response = getters::get_user_response_from_session(&session, &config).await;
    let name = user_response.username.clone().unwrap_or(email);
    let user_id = match get_user_id_from_session(&user_response) {
        Ok(id) => id,
        Err(resp) => return Ok(resp),
    };
    let server_id = query.server_id;
    let channel_id = query.channel_id;
    let server_addr = data.lock().unwrap().clone();
    let chat_session = ChatSession { name, server: server_addr, user_id, server_id, channel_id };

    ws::start(chat_session, &req, stream)
}

pub async fn create_server(
    form: web::Json<CreateServerForm>,
    session: Session,
    config: web::Data<AppConfig>,
) -> impl Responder {
    let user_response = getters::get_user_response_from_session(&session, &config).await;
    let owner_id = match get_user_id_from_session(&user_response) {
        Ok(id) => id,
        Err(resp) => return resp,
    };
    
    let (client, db_name) = match get_mongo_client_and_db().await {
        Ok(result) => result,
        Err(resp) => return resp,
    };
    
    match db_mongo_setter::set_server(
        &client,
        &db_name,
        owner_id,
        &form.name,
        form.image.clone(),
    )
    .await
    {
        Ok(_) => HttpResponse::Ok().json(serde_json::json!({
            "success": true,
            "message": "Serveur créé avec succès"
        })),
        Err(e) => {
            eprintln!("Erreur lors de la création du serveur: {}", e);
            HttpResponse::InternalServerError().json(serde_json::json!({
                "error": "Erreur lors de la création du serveur"
            }))
        }
    }
}

pub async fn has_servers(
    session: Session,
    config: web::Data<AppConfig>,
) -> impl Responder {
    let user_response = getters::get_user_response_from_session(&session, &config).await;
    let user_id = match get_user_id_from_session(&user_response) {
        Ok(id) => id,
        Err(_) => {
            return HttpResponse::Unauthorized().json(serde_json::json!({
                "error": "Utilisateur non connecté",
                "has_servers": false
            }));
        }
    };
    
    let (client, db_name) = match get_mongo_client_and_db().await {
        Ok(result) => result,
        Err(_) => {
            return HttpResponse::InternalServerError().json(serde_json::json!({
                "error": "Erreur de connexion à la base de données",
                "has_servers": false
            }));
        }
    };
    
    // Utiliser la même logique que get_user_servers : propriétaire, membre ou admin
    match db_mongo_getter::get_servers_by_member(&client, &db_name, &user_id).await {
        Ok(servers) => HttpResponse::Ok().json(serde_json::json!({
            "has_servers": !servers.is_empty(),
            "count": servers.len()
        })),
        Err(e) => {
            eprintln!("Erreur lors de la récupération des serveurs: {}", e);
            HttpResponse::InternalServerError().json(serde_json::json!({
                "error": "Erreur lors de la récupération des serveurs",
                "has_servers": false
            }))
        }
    }
}

pub async fn get_user_servers(
    session: Session,
    config: web::Data<AppConfig>,
    chat_data: web::Data<Arc<Mutex<Addr<ChatServer>>>>,
) -> impl Responder {
    let user_response = getters::get_user_response_from_session(&session, &config).await;
    
    // Marquer l'utilisateur comme connecté s'il a une session valide
    mark_user_connected_if_session_valid(&user_response, &chat_data);
    
    let user_id = match get_user_id_from_session(&user_response) {
        Ok(id) => id,
        Err(_) => {
            return HttpResponse::Unauthorized().json(serde_json::json!({
                "error": "Utilisateur non connecté",
                "servers": []
            }));
        }
    };
    
    let (client, db_name) = match get_mongo_client_and_db().await {
        Ok(result) => result,
        Err(_) => {
            return HttpResponse::InternalServerError().json(serde_json::json!({
                "error": "Erreur de connexion à la base de données",
                "servers": []
            }));
        }
    };
    
    // Récupérer tous les serveurs où l'utilisateur est owner / admin / membre
    match db_mongo_getter::get_servers_by_member(&client, &db_name, &user_id).await {
        Ok(servers) => {
            let servers_json: Vec<serde_json::Value> = servers
                .into_iter()
                .map(|doc| {
                    let mut json_obj = serde_json::Map::new();
                    if let Some(id) = doc.get("id").and_then(|v| v.as_i64()) {
                        json_obj.insert("id".to_string(), serde_json::json!(id));
                    }
                    if let Some(name) = doc.get("name").and_then(|v| v.as_str()) {
                        json_obj.insert("name".to_string(), serde_json::json!(name));
                    }
                    // Récupérer l'image si elle existe, sinon utiliser le logo par défaut
                    if let Some(image) = doc.get("image").and_then(|v| v.as_str()) {
                        json_obj.insert("image".to_string(), serde_json::json!(image));
                    } else {
                        json_obj.insert("image".to_string(), serde_json::json!("/logo_fluxy.png"));
                    }

                    // Rôles côté frontend
                    let mut is_owner = false;
                    let mut is_admin = false;

                    if let Some(owner) = doc.get("owner_id").and_then(|v| v.as_i64()) {
                        if owner == user_id {
                            is_owner = true;
                        }
                    }

                    if let Some(admin_field) = doc.get("admin_id") {
                        // admin_id peut être un nombre ou un tableau
                        if let Some(admin_single) = admin_field.as_i64() {
                            if admin_single == user_id {
                                is_admin = true;
                            }
                        } else if let Some(admin_array) = admin_field.as_array() {
                            if admin_array.iter().any(|v| v.as_i64() == Some(user_id)) {
                                is_admin = true;
                            }
                        }
                    }

                    json_obj.insert("is_owner".to_string(), serde_json::json!(is_owner));
                    json_obj.insert("is_admin".to_string(), serde_json::json!(is_admin));

                    serde_json::Value::Object(json_obj)
                })
                .collect();
            
            HttpResponse::Ok().json(serde_json::json!({"servers": servers_json}))
        }
        Err(e) => {
            eprintln!("Erreur lors de la récupération des serveurs: {}", e);
            HttpResponse::InternalServerError().json(serde_json::json!({
                "error": "Erreur lors de la récupération des serveurs",
                "servers": []
            }))
        }
    }
}

pub async fn create_channel(
    form: web::Json<CreateChannelForm>,
    session: Session,
    config: web::Data<AppConfig>,
) -> impl Responder {
    let user_response = getters::get_user_response_from_session(&session, &config).await;
    let user_id = match get_user_id_from_session(&user_response) {
        Ok(id) => id,
        Err(resp) => return resp,
    };

    let (client, db_name) = match get_mongo_client_and_db().await {
        Ok(result) => result,
        Err(resp) => return resp,
    };

    match db_mongo_setter::set_channel(&client, &db_name, form.server_id, &form.name, user_id).await {
        Ok(_) => HttpResponse::Ok().json(serde_json::json!({
            "success": true
        })),
        Err(e) => {
            eprintln!("Erreur lors de la création du channel: {}", e);
            HttpResponse::InternalServerError().json(serde_json::json!({
                "error": "Erreur lors de la création du channel"
            }))
        }
    }
}

pub async fn update_channel(
    form: web::Json<UpdateChannelForm>,
    session: Session,
    config: web::Data<AppConfig>,
) -> impl Responder {
    let user_response = getters::get_user_response_from_session(&session, &config).await;
    let user_id = match get_user_id_from_session(&user_response) {
        Ok(id) => id,
        Err(resp) => return resp,
    };

    let (client, db_name) = match get_mongo_client_and_db().await {
        Ok(result) => result,
        Err(resp) => return resp,
    };

    match db_mongo_update::update_channel_name(
        &client,
        &db_name,
        form.channel_id,
        &form.name,
        user_id,
    )
    .await
    {
        Ok(_) => HttpResponse::Ok().json(serde_json::json!({
            "success": true
        })),
        Err(e) => {
            eprintln!("Erreur lors de la mise à jour du channel: {}", e);
            HttpResponse::InternalServerError().json(serde_json::json!({
                "error": "Erreur lors de la mise à jour du channel"
            }))
        }
    }
}

pub async fn delete_channel(
    form: web::Json<DeleteChannelForm>,
    session: Session,
    config: web::Data<AppConfig>,
) -> impl Responder {
    let user_response = getters::get_user_response_from_session(&session, &config).await;
    let user_id = match get_user_id_from_session(&user_response) {
        Ok(id) => id,
        Err(resp) => return resp,
    };

    let (client, db_name) = match get_mongo_client_and_db().await {
        Ok(result) => result,
        Err(resp) => return resp,
    };

    match db_mongo_delete::delete_channel(&client, &db_name, form.channel_id, user_id).await {
        Ok(_) => HttpResponse::Ok().json(serde_json::json!({
            "success": true
        })),
        Err(e) => {
            eprintln!("Erreur lors de la suppression du channel: {}", e);
            HttpResponse::InternalServerError().json(serde_json::json!({
                "error": "Erreur lors de la suppression du channel"
            }))
        }
    }
}

pub async fn get_server_channels(
    query: web::Query<ServerChannelsQuery>,
    session: Session,
    config: web::Data<AppConfig>,
) -> impl Responder {
    let user_response = getters::get_user_response_from_session(&session, &config).await;
    let _user_id = match get_user_id_from_session(&user_response) {
        Ok(id) => id,
        Err(resp) => return resp,
    };

    let (client, db_name) = match get_mongo_client_and_db().await {
        Ok(result) => result,
        Err(resp) => return resp,
    };

    match db_mongo_getter::get_channels_of_server(&client, &db_name, &query.server_id).await {
        Ok(channels) => {
            let channels_json: Vec<serde_json::Value> = channels
                .into_iter()
                .map(|doc| {
                    let mut json_obj = serde_json::Map::new();
                    if let Some(id) = doc.get("id").and_then(|v| v.as_i64()) {
                        json_obj.insert("id".to_string(), serde_json::json!(id));
                    }
                    if let Some(name) = doc.get("name").and_then(|v| v.as_str()) {
                        json_obj.insert("name".to_string(), serde_json::json!(name));
                    }
                    if let Some(position) = doc.get("position").and_then(|v| v.as_i64()) {
                        json_obj.insert("position".to_string(), serde_json::json!(position));
                    }
                    serde_json::Value::Object(json_obj)
                })
                .collect();

            HttpResponse::Ok().json(serde_json::json!({ "channels": channels_json }))
        }
        Err(e) => {
            eprintln!("Erreur lors de la récupération des channels: {}", e);
            HttpResponse::InternalServerError().json(serde_json::json!({
                "error": "Erreur lors de la récupération des channels",
                "channels": []
            }))
        }
    }
}

pub async fn get_channel_messages(
    query: web::Query<ChannelMessagesQuery>,
    session: Session,
    config: web::Data<AppConfig>,
) -> impl Responder {
    let user_response = getters::get_user_response_from_session(&session, &config).await;
    let _user_id = match get_user_id_from_session(&user_response) {
        Ok(id) => id,
        Err(resp) => return resp,
    };

    let (client, db_name) = match get_mongo_client_and_db().await {
        Ok(result) => result,
        Err(resp) => return resp,
    };

    // Récupérer tous les utilisateurs pour pouvoir ajouter le username à chaque message
    let users_result = getters::get_all_users(&config).await;
    let mut usernames_by_id: std::collections::HashMap<i64, String> = std::collections::HashMap::new();
    if let Ok(users) = users_result {
        for u in users {
            if let Ok(id_num) = u.id.parse::<i64>() {
                usernames_by_id.insert(id_num, u.username.clone());
            }
        }
    }

    match db_mongo_getter::get_messages_of_channel(&client, &db_name, &query.channel_id).await {
        Ok(messages) => {
            let msgs_json: Vec<serde_json::Value> = messages
                .into_iter()
                .map(|doc| {
                    let mut json_obj = serde_json::Map::new();
                    if let Some(id) = doc.get("id").and_then(|v| v.as_i64()) {
                        json_obj.insert("id".to_string(), serde_json::json!(id));
                    }
                    if let Some(content) = doc.get("message").and_then(|v| v.as_str()) {
                        json_obj.insert("message".to_string(), serde_json::json!(content));
                    }
                    if let Some(user) = doc.get("user").and_then(|v| v.as_i64()) {
                        json_obj.insert("user".to_string(), serde_json::json!(user));
                        if let Some(username) = usernames_by_id.get(&user) {
                            json_obj.insert("username".to_string(), serde_json::json!(username));
                        }
                    }
                    if let Some(time) = doc.get("time").and_then(|v| v.as_str()) {
                        json_obj.insert("time".to_string(), serde_json::json!(time));
                    }
                    serde_json::Value::Object(json_obj)
                })
                .collect();

            HttpResponse::Ok().json(serde_json::json!({ "messages": msgs_json }))
        }
        Err(e) => {
            eprintln!("Erreur lors de la récupération des messages: {}", e);
            HttpResponse::InternalServerError().json(serde_json::json!({
                "error": "Erreur lors de la récupération des messages",
                "messages": []
            }))
        }
    }
}

/// Supprime un message (si l'utilisateur est l'auteur, un admin ou le fondateur du serveur).
pub async fn delete_message(
    form: web::Json<DeleteMessageForm>,
    session: Session,
    config: web::Data<AppConfig>,
) -> impl Responder {
    let user_response = getters::get_user_response_from_session(&session, &config).await;
    let user_id = match get_user_id_from_session(&user_response) {
        Ok(id) => id,
        Err(resp) => return resp,
    };

    let (client, db_name) = match get_mongo_client_and_db().await {
        Ok(result) => result,
        Err(resp) => return resp,
    };

    match db_mongo_delete::delete_message(&client, &db_name, form.message_id, user_id).await {
        Ok(_) => HttpResponse::Ok().json(serde_json::json!({ "success": true })),
        Err(e) => {
            eprintln!("Erreur lors de la suppression du message: {}", e);
            HttpResponse::InternalServerError().json(serde_json::json!({
                "error": "Erreur lors de la suppression du message"
            }))
        }
    }
}

/// Transfère le rôle de fondateur (owner) à un autre membre du serveur.
pub async fn switch_owner(
    form: web::Json<SwitchOwnerForm>,
    session: Session,
    config: web::Data<AppConfig>,
) -> impl Responder {
    let user_response = getters::get_user_response_from_session(&session, &config).await;
    let user_id = match get_user_id_from_session(&user_response) {
        Ok(id) => id,
        Err(resp) => return resp,
    };

    let (client, db_name) = match get_mongo_client_and_db().await {
        Ok(result) => result,
        Err(resp) => return resp,
    };

    match db_mongo_setter::switch_owner(&client, &db_name, form.server_id, user_id, form.new_owner_id).await {
        Ok(_) => HttpResponse::Ok().json(serde_json::json!({ "success": true })),
        Err(e) => {
            eprintln!("Erreur lors du transfert de propriété: {}", e);
            HttpResponse::InternalServerError().json(serde_json::json!({
                "error": "Erreur lors du transfert de propriété"
            }))
        }
    }
}

pub async fn update_server(
    form: web::Json<UpdateServerForm>,
    session: Session,
    config: web::Data<AppConfig>,
) -> impl Responder {
    let user_response = getters::get_user_response_from_session(&session, &config).await;
    let user_id = match get_user_id_from_session(&user_response) {
        Ok(id) => id,
        Err(resp) => return resp,
    };

    let (client, db_name) = match get_mongo_client_and_db().await {
        Ok(result) => result,
        Err(resp) => return resp,
    };

    let new_name = form.name.as_deref();
    let new_image = form.image.as_deref();

    if new_name.is_none() && new_image.is_none() {
        return HttpResponse::BadRequest().json(serde_json::json!({
            "error": "Aucune donnée à mettre à jour"
        }));
    }

    match db_mongo_update::update_server(
        &client,
        &db_name,
        form.server_id,
        new_name,
        new_image,
        user_id,
    )
    .await
    {
        Ok(_) => HttpResponse::Ok().json(serde_json::json!({
            "success": true
        })),
        Err(e) => {
            eprintln!("Erreur lors de la mise à jour du serveur: {}", e);
            HttpResponse::InternalServerError().json(serde_json::json!({
                "error": "Erreur lors de la mise à jour du serveur"
            }))
        }
    }
}

pub async fn delete_server(
    form: web::Json<DeleteServerForm>,
    session: Session,
    config: web::Data<AppConfig>,
) -> impl Responder {
    let user_response = getters::get_user_response_from_session(&session, &config).await;
    let user_id = match get_user_id_from_session(&user_response) {
        Ok(id) => id,
        Err(resp) => return resp,
    };

    let (client, db_name) = match get_mongo_client_and_db().await {
        Ok(result) => result,
        Err(resp) => return resp,
    };

    match db_mongo_delete::delete_server(&client, &db_name, form.server_id, user_id).await {
        Ok(_) => HttpResponse::Ok().json(serde_json::json!({
            "success": true
        })),
        Err(e) => {
            eprintln!("Erreur lors de la suppression du serveur: {}", e);
            HttpResponse::InternalServerError().json(serde_json::json!({
                "error": "Erreur lors de la suppression du serveur"
            }))
        }
    }
}

pub async fn leave_server(
    form: web::Json<LeaveServerForm>,
    session: Session,
    config: web::Data<AppConfig>,
) -> impl Responder {
    let user_response = getters::get_user_response_from_session(&session, &config).await;
    let user_id = match get_user_id_from_session(&user_response) {
        Ok(id) => id,
        Err(resp) => return resp,
    };

    let (client, db_name) = match get_mongo_client_and_db().await {
        Ok(result) => result,
        Err(resp) => return resp,
    };

    // Vérifier que l'utilisateur n'est pas owner
    if db_mongo_getter::is_owner(&client, &db_name, &form.server_id, &user_id).await.unwrap_or(false) {
        return HttpResponse::BadRequest().json(serde_json::json!({
            "error": "Les owners ne peuvent pas quitter le serveur. Vous devez d'abord transférer le rôle d'owner."
        }));
    }

    // Utiliser delete_member pour se retirer du serveur
    match db_mongo_delete::delete_member(&client, &db_name, form.server_id, user_id, user_id).await {
        Ok(_) => HttpResponse::Ok().json(serde_json::json!({
            "success": true
        })),
        Err(e) => {
            eprintln!("Erreur lors de la sortie du serveur: {}", e);
            HttpResponse::InternalServerError().json(serde_json::json!({
                "error": "Erreur lors de la sortie du serveur"
            }))
        }
    }
}

pub async fn get_server_members(
    query: web::Query<ServerMembersQuery>,
    session: Session,
    config: web::Data<AppConfig>,
    chat_data: web::Data<Arc<Mutex<Addr<ChatServer>>>>,
) -> impl Responder {
    let user_response = getters::get_user_response_from_session(&session, &config).await;
    
    // Marquer l'utilisateur comme connecté s'il a une session valide
    mark_user_connected_if_session_valid(&user_response, &chat_data);
    
    let _user_id = match get_user_id_from_session(&user_response) {
        Ok(id) => id,
        Err(resp) => return resp,
    };

    let (client, db_name) = match get_mongo_client_and_db().await {
        Ok(result) => result,
        Err(resp) => return resp,
    };

    // Récupérer le document du serveur
    let servers = match db_mongo_getter::get_server(&client, &db_name, &query.server_id).await {
        Ok(s) => s,
        Err(e) => {
            eprintln!("Erreur lors de la récupération du serveur: {}", e);
            return HttpResponse::InternalServerError().json(serde_json::json!({
                "error": "Erreur lors de la récupération du serveur",
                "members": []
            }));
        }
    };

    if servers.is_empty() {
        return HttpResponse::NotFound().json(serde_json::json!({
            "error": "Serveur introuvable",
            "members": []
        }));
    }

    let server_doc = &servers[0];

    // Récupérer les utilisateurs connectés
    let connected_users = chat_data
        .lock()
        .unwrap()
        .send(GetConnectedUsers)
        .await
        .unwrap_or_else(|_| Vec::new());
    
    println!("[MEMBERS] Utilisateurs connectés: {:?} (total: {})", connected_users, connected_users.len());

    let mut members: Vec<serde_json::Value> = Vec::new();

    // Fondateur
    if let Some(owner_id) = server_doc.get("owner_id").and_then(|v| v.as_i64()) {
        let is_online = connected_users.contains(&owner_id);
        members.push(serde_json::json!({
            "user_id": owner_id,
            "role": "fondateur",
            "status": if is_online { "online" } else { "offline" }
        }));
    }

    // Admins (peut être un seul id ou un tableau)
    if let Some(admin_field) = server_doc.get("admin_id") {
        if let Some(admin_id) = admin_field.as_i64() {
            let is_online = connected_users.contains(&admin_id);
            members.push(serde_json::json!({
                "user_id": admin_id,
                "role": "admin",
                "status": if is_online { "online" } else { "offline" }
            }));
        } else if let Some(admin_array) = admin_field.as_array() {
            for v in admin_array {
                if let Some(id) = v.as_i64() {
                    // éviter de dupliquer le fondateur s'il est aussi admin
                    if !members.iter().any(|m| m.get("user_id").and_then(|u| u.as_i64()) == Some(id)) {
                        let is_online = connected_users.contains(&id);
                        members.push(serde_json::json!({
                            "user_id": id,
                            "role": "admin",
                            "status": if is_online { "online" } else { "offline" }
                        }));
                    }
                }
            }
        }
    }

    // Membres (peut être un seul id ou un tableau)
    if let Some(member_field) = server_doc.get("member_id") {
        if let Some(member_id) = member_field.as_i64() {
            if !members.iter().any(|m| m.get("user_id").and_then(|u| u.as_i64()) == Some(member_id)) {
                let is_online = connected_users.contains(&member_id);
                members.push(serde_json::json!({
                    "user_id": member_id,
                    "role": "membre",
                    "status": if is_online { "online" } else { "offline" }
                }));
            }
        } else if let Some(member_array) = member_field.as_array() {
            for v in member_array {
                if let Some(id) = v.as_i64() {
                    if !members.iter().any(|m| m.get("user_id").and_then(|u| u.as_i64()) == Some(id)) {
                        let is_online = connected_users.contains(&id);
                        members.push(serde_json::json!({
                            "user_id": id,
                            "role": "membre",
                            "status": if is_online { "online" } else { "offline" }
                        }));
                    }
                }
            }
        }
    }

    HttpResponse::Ok().json(serde_json::json!({
        "members": members
    }))
}

pub async fn join_server(
    form: web::Json<JoinServerForm>,
    session: Session,
    config: web::Data<AppConfig>,
) -> impl Responder {
    let user_response = getters::get_user_response_from_session(&session, &config).await;
    let user_id = match get_user_id_from_session(&user_response) {
        Ok(id) => id,
        Err(resp) => return resp,
    };

    let (client, db_name) = match get_mongo_client_and_db().await {
        Ok(result) => result,
        Err(resp) => return resp,
    };

    // Vérifier que le serveur existe
    match db_mongo_getter::get_server(&client, &db_name, &form.server_id).await {
        Ok(servers) => {
            if servers.is_empty() {
                return HttpResponse::NotFound().json(serde_json::json!({
                    "error": "Serveur introuvable"
                }));
            }
        }
        Err(e) => {
            eprintln!("Erreur lors de la vérification du serveur: {}", e);
            return HttpResponse::InternalServerError().json(serde_json::json!({
                "error": "Erreur lors de la vérification du serveur"
            }));
        }
    }

    // Vérifier si l'utilisateur est déjà membre
    match db_mongo_getter::is_member(&client, &db_name, &form.server_id, &user_id).await {
        Ok(true) => {
            return HttpResponse::BadRequest().json(serde_json::json!({
                "error": "Vous êtes déjà membre de ce serveur"
            }));
        }
        Ok(false) => {}
        Err(e) => {
            eprintln!("Erreur lors de la vérification du membre: {}", e);
            return HttpResponse::InternalServerError().json(serde_json::json!({
                "error": "Erreur lors de la vérification du membre"
            }));
        }
    }

    // Ajouter l'utilisateur au serveur
    match db_mongo_setter::add_member_to_server(&client, &db_name, form.server_id, user_id).await {
        Ok(_) => HttpResponse::Ok().json(serde_json::json!({
            "success": true,
            "message": "Vous avez rejoint le serveur avec succès"
        })),
        Err(e) => {
            eprintln!("Erreur lors de l'ajout au serveur: {}", e);
            HttpResponse::InternalServerError().json(serde_json::json!({
                "error": "Erreur lors de l'ajout au serveur"
            }))
        }
    }
}

pub async fn create_invite_link(
    form: web::Json<CreateInviteLinkForm>,
    session: Session,
    config: web::Data<AppConfig>,
) -> impl Responder {
    let user_response = getters::get_user_response_from_session(&session, &config).await;
    let user_id = match get_user_id_from_session(&user_response) {
        Ok(id) => id,
        Err(resp) => return resp,
    };

    let (client, db_name) = match get_mongo_client_and_db().await {
        Ok(result) => result,
        Err(resp) => return resp,
    };

    match db_mongo_setter::create_link_one_use(&client, &db_name, form.server_id, user_id).await {
        Ok(code) if code != "a" => HttpResponse::Ok().json(serde_json::json!({
            "success": true,
            "link": code,
        })),
        Ok(_) => HttpResponse::Forbidden().json(serde_json::json!({
            "error": "Seuls le fondateur ou les admins peuvent créer un lien d'invitation"
        })),
        Err(e) => {
            eprintln!("Erreur lors de la création du lien d'invitation: {}", e);
            HttpResponse::InternalServerError().json(serde_json::json!({
                "error": "Erreur lors de la création du lien d'invitation"
            }))
        }
    }
}

pub async fn join_server_by_link(
    form: web::Json<JoinByLinkForm>,
    session: Session,
    config: web::Data<AppConfig>,
) -> impl Responder {
    let user_response = getters::get_user_response_from_session(&session, &config).await;
    let user_id = match get_user_id_from_session(&user_response) {
        Ok(id) => id,
        Err(resp) => return resp,
    };

    let (client, db_name) = match get_mongo_client_and_db().await {
        Ok(result) => result,
        Err(resp) => return resp,
    };

    match db_mongo_setter::join_by_link(&client, &db_name, &form.link, user_id).await {
        Ok(_) => HttpResponse::Ok().json(serde_json::json!({
            "success": true
        })),
        Err(e) => {
            eprintln!("Erreur lors de la jointure par lien: {}", e);
            HttpResponse::InternalServerError().json(serde_json::json!({
                "error": "Erreur lors de la jointure par lien"
            }))
        }
    }
}

pub async fn update_member_role(
    form: web::Json<UpdateMemberRoleForm>,
    session: Session,
    config: web::Data<AppConfig>,
) -> impl Responder {
    let user_response = getters::get_user_response_from_session(&session, &config).await;
    let owner_id = match get_user_id_from_session(&user_response) {
        Ok(id) => id,
        Err(resp) => return resp,
    };

    let (client, db_name) = match get_mongo_client_and_db().await {
        Ok(result) => result,
        Err(resp) => return resp,
    };

    // Valider le rôle
    if form.role != "admin" && form.role != "membre" {
        return HttpResponse::BadRequest().json(serde_json::json!({
            "error": "Rôle invalide. Utilisez 'admin' ou 'membre'"
        }));
    }

    match db_mongo_update::update_member_role(
        &client,
        &db_name,
        form.server_id,
        form.user_id,
        &form.role,
        owner_id,
    )
    .await
    {
        Ok(_) => HttpResponse::Ok().json(serde_json::json!({
            "success": true,
            "message": "Rôle mis à jour avec succès"
        })),
        Err(e) => {
            let error_msg = e.to_string();
            let mut status = if error_msg.contains("PermissionDenied") {
                HttpResponse::Forbidden()
            } else if error_msg.contains("InvalidInput") || error_msg.contains("NotFound") {
                HttpResponse::BadRequest()
            } else {
                HttpResponse::InternalServerError()
            };
            
            status.json(serde_json::json!({
                "error": error_msg
            }))
        }
    }
}

pub async fn kick_member(
    form: web::Json<KickMemberForm>,
    session: Session,
    config: web::Data<AppConfig>,
) -> impl Responder {
    let user_response = getters::get_user_response_from_session(&session, &config).await;
    let user_id = match get_user_id_from_session(&user_response) {
        Ok(id) => id,
        Err(resp) => return resp,
    };

    let (client, db_name) = match get_mongo_client_and_db().await {
        Ok(result) => result,
        Err(resp) => return resp,
    };

    // Vérifier que l'utilisateur est fondateur ou admin
    let is_owner = db_mongo_getter::is_owner(&client, &db_name, &form.server_id, &user_id).await
        .unwrap_or(false);
    let is_admin = db_mongo_getter::is_admin(&client, &db_name, &form.server_id, &user_id).await
        .unwrap_or(false);

    if !is_owner && !is_admin {
        return HttpResponse::Forbidden().json(serde_json::json!({
            "error": "Vous n'avez pas la permission d'exclure des membres"
        }));
    }

    // Ne pas permettre d'exclure le fondateur
    let is_target_owner = db_mongo_getter::is_owner(&client, &db_name, &form.server_id, &form.user_id).await
        .unwrap_or(false);
    if is_target_owner {
        return HttpResponse::BadRequest().json(serde_json::json!({
            "error": "Vous ne pouvez pas exclure le fondateur du serveur"
        }));
    }

    // Un admin ne peut pas exclure un autre admin (seul le fondateur peut)
    if !is_owner && is_admin {
        let is_target_admin = db_mongo_getter::is_admin(&client, &db_name, &form.server_id, &form.user_id).await
            .unwrap_or(false);
        if is_target_admin {
            return HttpResponse::Forbidden().json(serde_json::json!({
                "error": "Seul le fondateur peut exclure un administrateur"
            }));
        }
    }

    match db_mongo_delete::delete_member(
        &client,
        &db_name,
        form.server_id,
        user_id,
        form.user_id,
    ).await {
        Ok(_) => HttpResponse::Ok().json(serde_json::json!({
            "success": true,
            "message": "Membre exclu avec succès"
        })),
        Err(e) => {
            eprintln!("Erreur lors de l'exclusion du membre: {}", e);
            HttpResponse::InternalServerError().json(serde_json::json!({
                "error": "Erreur lors de l'exclusion du membre"
            }))
        }
    }
}

