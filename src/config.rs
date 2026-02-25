use crate::models::AppConfig;

impl AppConfig {
    pub fn from_env() -> AppConfig {
        let supabase_url = std::env::var("SUPABASE_URL").expect("SUPABASE_URL manquant");
        let supabase_anon_key = std::env::var("SUPABASE_ANON_KEY").expect("SUPABASE_ANON_KEY manquant");
        let supabase_service_role_key = std::env::var("SUPABASE_SERVICE_ROLE_KEY").expect("SUPABASE_SERVICE_ROLE_KEY manquant");
        let session_key = std::env::var("SESSION_KEY").expect("SESSION_KEY manquant");

        AppConfig {
            supabase_url,
            supabase_anon_key,
            supabase_service_role_key,
            session_key,
        }
    }
}
