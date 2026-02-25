use actix_web::{cookie::Key, HttpServer, web, App};
use actix_session::{storage::CookieSessionStore, SessionMiddleware};
use actix_files::Files;
use actix_cors::Cors;
use actix_web::http::header;
use actix::Actor;
use std::sync::{Arc, Mutex};

mod models;
mod config;
mod chat;
mod supabase;
mod handlers;
mod getters;
mod db_mongo_setter;
mod db_mongo_connection;
mod db_mongo_getter;
mod db_mongo_delete;
mod db_mongo_update;

use models::{ChatServer, AppConfig};

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    dotenvy::dotenv().ok();

    let config = AppConfig::from_env();
    let key = Key::from(config.session_key.as_bytes());

    let chat_server = ChatServer::new().start();
    let chat_data = Arc::new(Mutex::new(chat_server));

    let server_3000 = HttpServer::new(move || {
        App::new()
            .app_data(web::Data::new(config.clone()))
            .app_data(web::Data::new(chat_data.clone()))
            .wrap(
                Cors::default()
                    .allowed_origin("http://localhost:3000")
                    .allowed_origin("http://localhost:3001")
                    .allowed_origin("http://127.0.0.1:3000")
                    .allowed_origin("http://127.0.0.1:3001")
                    .allowed_methods(vec!["GET", "POST", "OPTIONS"])
                    .allowed_headers(vec![header::CONTENT_TYPE, header::AUTHORIZATION])
                    .supports_credentials()
            )
            .wrap(
                SessionMiddleware::builder(CookieSessionStore::default(), key.clone())
                    .cookie_secure(false)
                    .cookie_same_site(actix_web::cookie::SameSite::Lax)
                    .cookie_http_only(true)
                    .build(),
            )
            
            //Routes pour la gestion de l'utilisateur connecté
            .route("/api/user", web::get().to(handlers::api_user))
            .route("/api/logout", web::post().to(handlers::api_logout))
            .route("/api/update-profile", web::post().to(handlers::update_profile))
            .route("/api/update-username", web::post().to(handlers::update_username))

            //Routes pour la gestion de tous les utilisateurs
            .route("/api/allusers", web::get().to(handlers::get_all_users))
            
            //Routes pour la gestion des serveurs
            .route("/api/create-server", web::post().to(handlers::create_server))
            .route("/api/join-server", web::post().to(handlers::join_server))
            .route("/api/create-invite-link", web::post().to(handlers::create_invite_link))
            .route("/api/join-server-by-link", web::post().to(handlers::join_server_by_link))
            .route("/api/delete-server", web::post().to(handlers::delete_server))
            .route("/api/update-server", web::post().to(handlers::update_server))
            .route("/api/leave-server", web::post().to(handlers::leave_server))
            .route("/api/update-member-role", web::post().to(handlers::update_member_role))
            .route("/api/kick-member", web::post().to(handlers::kick_member))
            .route("/api/switch-owner", web::post().to(handlers::switch_owner))
            .route("/api/has-servers", web::get().to(handlers::has_servers))
            .route("/api/user-servers", web::get().to(handlers::get_user_servers))
            .route("/api/server-channels", web::get().to(handlers::get_server_channels))
            .route("/api/server-members", web::get().to(handlers::get_server_members))
            .route("/api/channel-messages", web::get().to(handlers::get_channel_messages))
            .route("/api/message/delete", web::post().to(handlers::delete_message))
            .route("/api/channel/create", web::post().to(handlers::create_channel))
            .route("/api/channel/update", web::post().to(handlers::update_channel))
            .route("/api/channel/delete", web::post().to(handlers::delete_channel))
            
            //Routes pour la gestion de la connexion et de l'inscription
            .route("/login", web::post().to(handlers::login))
            .route("/register", web::post().to(handlers::register))
            .route("/forgot", web::post().to(handlers::forgot))
            .route("/forgot-sent", web::get().to(handlers::page_forgot_sent))
            
            //Routes pour la gestion du mot de passe
            .route("/reset-password", web::post().to(handlers::reset_password))
            
            //Routes pour la gestion des messages
            .route("/ws", web::get().to(handlers::chat_ws))
            .service(
                Files::new("/static", "./src/static")
                    .index_file("index.html"),
            )
    })
    .bind(("0.0.0.0", 3000))?
    .run();

    server_3000.await
}
