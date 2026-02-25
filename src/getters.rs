use actix_session::Session;
use crate::models::{AppConfig, User, UserResponse};

// ==== Helpers ==== //

/// Helper pour créer une requête GET Supabase avec les bons headers
fn supabase_get_request(client: &reqwest::Client, url: &str, config: &AppConfig) -> reqwest::RequestBuilder {
    client
        .get(url)
        .header("apikey", &config.supabase_service_role_key)
        .header("Authorization", format!("Bearer {}", &config.supabase_service_role_key))
        .header("Content-Type", "application/json")
}

/// Helper pour extraire l'id d'un JSON (gère i64 et String)
fn extract_id(json: &serde_json::Value) -> Option<String> {
    json.get("id")
        .and_then(|v| v.as_i64().map(|n| n.to_string())
            .or_else(|| v.as_str().map(|s| s.to_string())))
}

// ==== Getters ==== //

/// Récupère tous les utilisateurs depuis Supabase
pub async fn get_all_users(config: &AppConfig) -> Result<Vec<User>, String> {
    let url = format!(
        "{}/rest/v1/user?select=id,auth_id,username,email,avatar",
        config.supabase_url.trim_end_matches('/')
    );

    let client = reqwest::Client::new();
    let res = supabase_get_request(&client, &url, config)
        .send()
        .await
        .map_err(|e| format!("Erreur réseau vers Supabase: {e}"))?;

    if !res.status().is_success() {
        let error_text = res.text().await.unwrap_or_default();
        return Err(format!("Erreur lors de la récupération des utilisateurs: {error_text}"));
    }

    let raw_json: Vec<serde_json::Value> = res
        .json()
        .await
        .map_err(|e| format!("Réponse Supabase illisible: {e}"))?;

    let users: Vec<User> = raw_json
        .into_iter()
        .filter_map(|json| {
            let id = extract_id(&json).unwrap_or_default();
            let auth_id = json.get("auth_id")?.as_str()?.to_string();
            let username = json.get("username")?.as_str()?.to_string();
            let email = json.get("email")?.as_str()?.to_string();
            let avatar = json
                .get("avatar")
                .and_then(|v| v.as_str())
                .map(|s| s.to_string());
            Some(User { id, auth_id, username, email, avatar })
        })
        .collect();

    Ok(users)
}


//===============================================//


/// Récupère l'utilisateur actif depuis la session
/// Récupère les informations de l'utilisateur depuis la session avec jointure vers la table user
pub async fn get_user_response_from_session(
    session: &Session,
    config: &AppConfig,
) -> UserResponse {
    //Récupérer l'auth_id et l'email de l'utilisateur connecté depuis la session
    let auth_id: Option<String> = session.get("user_id").ok().flatten();
    let email: Option<String> = session.get("user_email").ok().flatten();
    
    //Si l'auth_id ou l'email est manquant, retourner un UserResponse avec les champs vides
    if auth_id.is_none() || email.is_none() {
        return UserResponse {
            user_id: None,
            auth_id: None,
            email,
            username: None,
            avatar: None,
        };
    }

    // on fait la jointure, utiliser auth_id de la session pour récupérer l'id, auth_id, username et avatar depuis la table user
    let (user_id, auth_id_from_table, username, avatar) = match auth_id.as_ref() {
        Some(auth_id_value) => {
            let url = format!(
                // on fait la requête GET à la table user avec l'auth_id de la session
                "{}/rest/v1/user?auth_id=eq.{}&select=id,auth_id,username,avatar",
                // on récupère l'url de la base de données Supabase
                config.supabase_url.trim_end_matches('/'),
                // on récupère l'auth_id de la session
                auth_id_value
            );

            let client = reqwest::Client::new();
            // on fait la requête GET à la table user avec l'auth_id de la session
            match supabase_get_request(&client, &url, config).send().await {
                // si la requête est réussie, on récupère les données de l'utilisateur
                Ok(res) if res.status().is_success() => {
                    // on récupère les données de l'utilisateur
                    if let Ok(users) = res.json::<Vec<serde_json::Value>>().await {
                        // on récupère le premier utilisateur
                        if let Some(user) = users.first() {
                            // on récupère l'id de l'utilisateur
                            let id = extract_id(user);
                            // on récupère l'auth_id de l'utilisateur
                            let auth_id_from_table = user.get("auth_id").and_then(|v| v.as_str()).map(|s| s.to_string());
                            // on récupère le username de l'utilisateur
                            let username = user.get("username").and_then(|v| v.as_str()).map(|s| s.to_string());
                            // on récupère l'avatar de l'utilisateur
                            let avatar = user.get("avatar").and_then(|v| v.as_str()).map(|s| s.to_string());
                            // on retourne les informations de l'utilisateur
                            (id, auth_id_from_table, username, avatar)
                            // si aucun utilisateur n'est trouvé, on retourne None pour les champs
                        } else {
                            // si aucun utilisateur n'est trouvé, on retourne None pour les champs
                            (None, None, None, None)
                        }
                    } else {
                        // si la réponse n'est pas JSON, on retourne None pour les champs
                        (None, None, None, None)
                    }
                }
                // si la requête est échouée, on retourne None pour les champs
                _ => (None, None, None, None),
            }
        }
        // si l'auth_id est manquant, on retourne None pour les champs
        None => (None, None, None, None),
    };

    // on retourne le UserResponse avec les informations de l'utilisateur connecté
    UserResponse {
        user_id,
        auth_id: auth_id_from_table,
        email,
        username,
        avatar,
    }
}

//===============================================//