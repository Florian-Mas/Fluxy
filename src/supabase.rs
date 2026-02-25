//! Intégration avec Supabase :
//! - Authentification (login, register, forgot / reset password)
//! - Synchronisation de la table `user` (création, mise à jour avatar / username)
//! Toutes les fonctions utilisent la configuration portée par `AppConfig`.

use crate::models::{AppConfig, SupabaseAuthResponse, SupabaseSignupUser};

/// Appelle l'API Supabase pour connecter un utilisateur (email + mot de passe).
/// Retourne la réponse d'authentification Supabase ou un message d'erreur lisible.
pub async fn ask_login_to_supabase(
    config: &AppConfig,
    email: &str,
    password: &str,
) -> Result<SupabaseAuthResponse, String> {
    // Essayer d'abord avec l'endpoint moderne signInWithPassword
    let url = format!(
        "{}/auth/v1/token?grant_type=password",
        config.supabase_url.trim_end_matches('/')
    );

    let client = reqwest::Client::new();

    let res = client
        .post(&url)
        .header("apikey", &config.supabase_anon_key)
        .header("Content-Type", "application/json")
        .json(&serde_json::json!({ 
            "email": email, 
            "password": password 
        }))
        .send()
        .await
        .map_err(|e| {
            eprintln!("Erreur réseau vers Supabase: {}", e);
            format!("Erreur réseau vers Supabase: {e}")
        })?;

    let status = res.status();
    if !status.is_success() {
        let error_text = res.text().await.unwrap_or_else(|_| "Erreur inconnue".to_string());
        eprintln!("Erreur Supabase login: status={}, url={}, body={}", status, url, error_text);
        
        // Essayer de parser l'erreur JSON si possible
        if let Ok(error_json) = serde_json::from_str::<serde_json::Value>(&error_text) {
            if let Some(msg) = error_json.get("error_description").and_then(|v| v.as_str()) {
                return Err(msg.to_string());
            }
            if let Some(msg) = error_json.get("message").and_then(|v| v.as_str()) {
                return Err(msg.to_string());
            }
        }
        
        return Err(format!("Email ou mot de passe incorrect"));
    }

    res.json::<SupabaseAuthResponse>()
        .await
        .map_err(|e| format!("Réponse Supabase illisible: {e}"))
}

/// Appelle l'API Supabase pour inscrire un nouvel utilisateur (email + mot de passe).
/// Retourne un utilisateur minimal (`SupabaseSignupUser`) ou une erreur lisible.
pub async fn ask_register_to_supabase(
    config: &AppConfig,
    email: &str,
    password: &str,
) -> Result<SupabaseSignupUser, String> {
    let url = format!(
        "{}/auth/v1/signup",
        config.supabase_url.trim_end_matches('/')
    );

    let client = reqwest::Client::new();

    let res = client
        .post(url)
        .header("apikey", &config.supabase_anon_key)
        .header("Authorization", format!("Bearer {}", &config.supabase_anon_key))
        .header("Content-Type", "application/json")
        .json(&serde_json::json!({ "email": email, "password": password }))
        .send()
        .await
        .map_err(|e| format!("Erreur réseau vers Supabase: {e}"))?;

    if !res.status().is_success() {
        let error_text = res.text().await.unwrap_or_default();
        return Err(format!("Erreur lors de l'inscription: {error_text}"));
    }

    res.json::<SupabaseSignupUser>()
        .await
        .map_err(|e| format!("Réponse Supabase illisible: {e}"))
}

/// Envoie une demande "mot de passe oublié" à Supabase pour l'email donné.
/// Supabase enverra un e‑mail avec un lien contenant le token de réinitialisation.
pub async fn ask_forgot_to_supabase(config: &AppConfig, email: &str) -> Result<(), String> {
    let url = format!("{}/auth/v1/recover", config.supabase_url.trim_end_matches('/'));
    let client = reqwest::Client::new();

    // URL de redirection vers la page de réinitialisation de mot de passe
    // Le token sera inclus dans l'URL par Supabase
    let redirect_to = "http://localhost:3001/reset-password";

    let res = client
        .post(url)
        .header("apikey", &config.supabase_anon_key)
        .header("Content-Type", "application/json")
        .json(&serde_json::json!({ 
            "email": email,
            "redirect_to": redirect_to
        }))
        .send()
        .await
        .map_err(|e| format!("Erreur réseau vers Supabase: {e}"))?;

    if !res.status().is_success() {
        let text = res.text().await.unwrap_or_default();
        return Err(format!("Erreur forgot password: {text}"));
    }

    Ok(())
}

/// Crée une entrée dans la table `user` (base de données Supabase) pour l'utilisateur authentifié.
/// Utilise la clé de service (`service_role`) pour pouvoir écrire dans la table.
pub async fn create_user_in_table(
    config: &AppConfig,
    user_id: &str,
    username: &str,
    email: &str,
) -> Result<(), String> {
    let url = format!(
        "{}/rest/v1/user",
        config.supabase_url.trim_end_matches('/')
    );

    let client = reqwest::Client::new();

    let res = client
        .post(url)
        .header("apikey", &config.supabase_service_role_key)
        .header("Authorization", format!("Bearer {}", &config.supabase_service_role_key))
        .header("Content-Type", "application/json")
        .header("Prefer", "return=minimal")
        .json(&serde_json::json!({
            "auth_id": user_id,
            "username": username,
            "email": email,
            "avatar": null
        }))
        .send()
        .await
        .map_err(|e| format!("Erreur réseau vers Supabase: {e}"))?;

    if !res.status().is_success() {
        let error_text = res.text().await.unwrap_or_default();
        return Err(format!("Erreur lors de la création de l'utilisateur dans la table: {error_text}"));
    }

    Ok(())
}

/// Met à jour l'avatar (photo de profil) de l'utilisateur dans la table `user` (Supabase).
pub async fn update_user_avatar(
    config: &AppConfig,
    auth_id: &str,
    avatar: &str,
) -> Result<(), String> {
    let url = format!(
        "{}/rest/v1/user?auth_id=eq.{}",
        config.supabase_url.trim_end_matches('/'),
        auth_id
    );

    let client = reqwest::Client::new();

    let res = client
        .patch(url)
        .header("apikey", &config.supabase_service_role_key)
        .header(
            "Authorization",
            format!("Bearer {}", &config.supabase_service_role_key),
        )
        .header("Content-Type", "application/json")
        .header("Prefer", "return=minimal")
        .json(&serde_json::json!({ "avatar": avatar }))
        .send()
        .await
        .map_err(|e| format!("Erreur réseau vers Supabase: {e}"))?;

    if !res.status().is_success() {
        let error_text = res.text().await.unwrap_or_default();
        return Err(format!(
            "Erreur lors de la mise à jour de l'avatar utilisateur: {error_text}"
        ));
    }

    Ok(())
}

/// Met à jour le `username` de l'utilisateur dans la table `user` (Supabase).
pub async fn update_user_username(
    config: &AppConfig,
    auth_id: &str,
    username: &str,
) -> Result<(), String> {
    let url = format!(
        "{}/rest/v1/user?auth_id=eq.{}",
        config.supabase_url.trim_end_matches('/'),
        auth_id
    );

    let client = reqwest::Client::new();

    let res = client
        .patch(url)
        .header("apikey", &config.supabase_service_role_key)
        .header(
            "Authorization",
            format!("Bearer {}", &config.supabase_service_role_key),
        )
        .header("Content-Type", "application/json")
        .header("Prefer", "return=minimal")
        .json(&serde_json::json!({ "username": username }))
        .send()
        .await
        .map_err(|e| format!("Erreur réseau vers Supabase: {e}"))?;

    if !res.status().is_success() {
        let error_text = res.text().await.unwrap_or_default();
        return Err(format!(
            "Erreur lors de la mise à jour du username utilisateur: {error_text}"
        ));
    }

    Ok(())
}

/// Réinitialise le mot de passe d'un utilisateur via le token fourni par Supabase.
/// Utilise le token comme Bearer pour autoriser la mise à jour du mot de passe.
pub async fn reset_password_with_token(
    config: &AppConfig,
    token: &str,
    new_password: &str,
) -> Result<(), String> {
    let url = format!(
        "{}/auth/v1/user",
        config.supabase_url.trim_end_matches('/')
    );

    let client = reqwest::Client::new();

    let res = client
        .put(url)
        .header("apikey", &config.supabase_anon_key)
        .header("Authorization", format!("Bearer {}", token))
        .header("Content-Type", "application/json")
        .json(&serde_json::json!({
            "password": new_password
        }))
        .send()
        .await
        .map_err(|e| format!("Erreur réseau vers Supabase: {e}"))?;

    if !res.status().is_success() {
        let text = res.text().await.unwrap_or_default();
        return Err(format!("Erreur lors de la réinitialisation du mot de passe: {text}"));
    }

    Ok(())
}


