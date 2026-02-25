use actix_web_actors::ws;
use actix::{Actor, Addr, AsyncContext, Context, Handler, Recipient, Running, StreamHandler};
use crate::models::{ChatMessage, ChatServer, JoinChat, LeaveChat, GetConnectedUsers, UserConnected};
use crate::db_mongo_connection;
use crate::db_mongo_setter;
use std::env;

impl ChatServer {
    pub fn new() -> Self {
        Self { 
            sessions: Vec::new(),
            connected_users: std::collections::HashSet::new(),
            user_session_count: std::collections::HashMap::new(),
        }
    }

    fn send_to_channel(&self, server_id: i64, channel_id: i64, content: &str) {
        println!(
            "Envoi du message au server {} channel {} pour {} sessions",
            server_id,
            channel_id,
            self.sessions.len()
        );
        for (session, s_id, ch_id) in &self.sessions {
            if *s_id == server_id && *ch_id == channel_id {
                let _ = session.do_send(ChatMessage {
                    server_id,
                    channel_id,
                    content: content.to_owned(),
                });
            }
        }
    }
    
    // Retirer une session WebSocket de la liste
    fn remove_session(&mut self, addr: &Recipient<ChatMessage>) {
        let before = self.sessions.len();
        self.sessions.retain(|(session_addr, _, _)| session_addr != addr);
        let after = self.sessions.len();
        if before != after {
            println!("[DÉCONNEXION] Session WebSocket retirée. Sessions restantes: {}", after);
        }
    }
}


impl Actor for ChatServer {
    type Context = Context<Self>;
}

impl Handler<ChatMessage> for ChatServer {
    type Result = ();

    fn handle(&mut self, msg: ChatMessage, _ctx: &mut Context<Self>) {
        self.send_to_channel(msg.server_id, msg.channel_id, &msg.content);
    }
}

impl Handler<GetConnectedUsers> for ChatServer {
    type Result = Vec<i64>;

    fn handle(&mut self, _msg: GetConnectedUsers, _ctx: &mut Context<Self>) -> Self::Result {
        self.connected_users.iter().cloned().collect()
    }
}

impl Handler<JoinChat> for ChatServer {
    type Result = ();

    fn handle(&mut self, msg: JoinChat, _ctx: &mut Context<Self>) {
        // Si c'est une vraie session WebSocket (avec server_id et channel_id valides), l'ajouter aux sessions
        // Sinon, c'est juste une mise à jour de statut (login)
        if msg.server_id != 0 || msg.channel_id != 0 {
            println!("Nouvelle session WebSocket ajoutée. Total: {}", self.sessions.len() + 1);
            self.sessions.push((msg.addr, msg.server_id, msg.channel_id));
            // Incrémenter le compteur de sessions pour cet utilisateur
            let count = self.user_session_count.entry(msg.user_id).or_insert(0);
            *count += 1;
            println!("[CONNEXION] Utilisateur {} a maintenant {} session(s) WebSocket", msg.user_id, count);
        } else {
            // Si c'est juste un login sans WebSocket, initialiser le compteur à 0
            self.user_session_count.entry(msg.user_id).or_insert(0);
        }
        self.connected_users.insert(msg.user_id);
        println!("[CONNEXION] Utilisateur {} connecté. Total connectés: {}", msg.user_id, self.connected_users.len());
    }
}

impl Handler<LeaveChat> for ChatServer {
    type Result = ();

    fn handle(&mut self, msg: LeaveChat, _ctx: &mut Context<Self>) {
        // Retirer la session de la liste si elle est fournie (fermeture WebSocket)
        if let Some(addr) = msg.addr {
            self.remove_session(&addr);
            // Décrémenter le compteur de sessions pour cet utilisateur
            if let Some(count) = self.user_session_count.get_mut(&msg.user_id) {
                if *count > 0 {
                    *count -= 1;
                }
                // Si l'utilisateur n'a plus de sessions WebSocket actives, le retirer de la liste des connectés
                if *count == 0 {
                    self.connected_users.remove(&msg.user_id);
                    self.user_session_count.remove(&msg.user_id);
                    println!("[DÉCONNEXION] Utilisateur {} déconnecté (plus de sessions WebSocket). Total connectés: {}", msg.user_id, self.connected_users.len());
                } else {
                    println!("[DÉCONNEXION] Utilisateur {} a encore {} session(s) WebSocket active(s)", msg.user_id, count);
                }
            }
        } else {
            // Si addr est None, c'est un logout explicite via API
            // Dans ce cas, on retire toujours l'utilisateur, peu importe son compteur
            let was_connected = self.connected_users.remove(&msg.user_id);
            self.user_session_count.remove(&msg.user_id);
            if was_connected {
                println!("[DÉCONNEXION] Utilisateur {} déconnecté (logout explicite). Total connectés: {}", msg.user_id, self.connected_users.len());
            }
        }
    }
}

impl Handler<UserConnected> for ChatServer {
    type Result = ();

    fn handle(&mut self, msg: UserConnected, _ctx: &mut Context<Self>) {
        let was_present = self.connected_users.contains(&msg.user_id);
        self.connected_users.insert(msg.user_id);
        // Initialiser le compteur à 0 si l'utilisateur n'a pas encore de sessions WebSocket
        // Cela permet de le retirer correctement lors de la déconnexion
        self.user_session_count.entry(msg.user_id).or_insert(0);
        // Log seulement si c'est une nouvelle connexion
        if !was_present {
            println!("[CONNEXION] Utilisateur {} connecté (via login/API). Total: {}", msg.user_id, self.connected_users.len());
        }
    }
}

pub struct ChatSession {
    pub name: String,
    pub server: Addr<ChatServer>,
    pub user_id: i64,
    pub server_id: i64,
    pub channel_id: i64,
}

impl Actor for ChatSession {
    type Context = ws::WebsocketContext<Self>;

    fn started(&mut self, ctx: &mut Self::Context) {
        println!("ChatSession démarrée pour: {}", self.name);
        let addr = ctx.address().recipient();
        let user_id = self.user_id;
        self.server
            .do_send(JoinChat { 
                addr, 
                server_id: self.server_id, 
                channel_id: self.channel_id,
                user_id: user_id,
            });
        self.server
            .do_send(ChatMessage {
                server_id: self.server_id,
                channel_id: self.channel_id,
                content: format!("{} a rejoint le chat", self.name),
            });
    }

    fn stopping(&mut self, ctx: &mut Self::Context) -> Running {
        self.server
            .do_send(ChatMessage {
                server_id: self.server_id,
                channel_id: self.channel_id,
                content: format!("{} a quitté le chat", self.name),
            });
        
        // Retirer cette session WebSocket de la liste
        let addr = ctx.address().recipient();
        let user_id = self.user_id;
        let server_addr = self.server.clone();
        
        // Envoyer LeaveChat avec l'adresse de la session pour la retirer de la liste
        server_addr.do_send(LeaveChat { 
            user_id,
            addr: Some(addr),
        });
        
        Running::Stop
    }
}

impl StreamHandler<Result<ws::Message, ws::ProtocolError>> for ChatSession {
    fn handle(&mut self, msg: Result<ws::Message, ws::ProtocolError>, ctx: &mut Self::Context) {
        match msg {
            Ok(ws::Message::Text(text)) => {
                println!("Message reçu de {}: {}", self.name, text);
                let full = format!("{}: {}", self.name, text);
                self.server.do_send(ChatMessage {
                    server_id: self.server_id,
                    channel_id: self.channel_id,
                    content: full.clone(),
                });

                let user_id = self.user_id;
                let server_id = self.server_id;
                let channel_id = self.channel_id;
                let content = text.clone();

                actix::spawn(async move {
                    if let Ok(client) = db_mongo_connection::get_client().await {
                        if let Ok(db_name) = env::var("MONGO_DATA_BASE_NAME") {
                            if let Err(e) = db_mongo_setter::set_message(
                                &client,
                                &db_name,
                                server_id,
                                channel_id,
                                &content,
                                user_id,
                            )
                            .await
                            {
                                eprintln!("Erreur lors de l'enregistrement du message: {}", e);
                            }
                        }
                    }
                });
            }
            Ok(ws::Message::Binary(_)) => {}
            Ok(ws::Message::Close(_)) => {
                // La session va se terminer, le stopping() sera appelé automatiquement
                ctx.close(None);
            }
            Ok(ws::Message::Ping(bytes)) => {
                ctx.pong(&bytes);
            }
            Err(e) => {
                eprintln!("Erreur WebSocket: {:?}", e);
            }
            _ => {}
        }
    }
}

impl Handler<ChatMessage> for ChatSession {
    type Result = ();

    fn handle(&mut self, msg: ChatMessage, ctx: &mut ws::WebsocketContext<Self>) {
        if msg.server_id == self.server_id && msg.channel_id == self.channel_id {
            ctx.text(msg.content);
        }
    }
}
