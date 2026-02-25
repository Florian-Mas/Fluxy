//! Tous les éléments liés à MongoDB correspondent aux serveurs, channels et messages rémanents. Les rôles, les permissions et les codes d'invitation sont liés à cette base de données.
//!
//! Les setters permettent d'ajouter des éléments dans la base de données ou de remplacer une ligne dans un des objets de la base.
//! Les updates permettent de modifier les données de la base partiellement, on peut considérer cela comme des changements souples qui n'impliquent pas de grandes conséquences.
//! Les getters permettent de récupérer des informations ou de vérifier des informations dans la base de données
//! Les deletes permettent de supprimer une information ou un objet de la base de données.
//!
//! Toutes les fonctions utilisées prennent en premier paramètre la connexion avec le client et en second paramètre le nom de la base de données.
//!
//! La connexion à la base de données est gérée par le fichier db_mongo_connection et doit être générée dans une variable qui sera appelée par les autres fonctions.

use std::{env, io};
use mongodb::{bson::doc, options::{ClientOptions, ServerApi, ServerApiVersion}, Client};

// pour le main a ajouté pour se connecter à la db
// let client_mongo_db = db_mongo_connection::get_client().await?;
// avoir un -> io::Result<()> pour le main
pub async fn get_client() -> io::Result<Client> {
    dotenvy::dotenv().ok();
    let db_mongo_username = env::var("MONGO_USERNAME")
        .map_err(|_| io::Error::new(io::ErrorKind::Other, "MONGO_USERNAME manquant dans .env"))?;
    let db_mongo_password = env::var("MONGO_PASSWORD")
        .map_err(|_| io::Error::new(io::ErrorKind::Other, "MONGO_PASSWORD manquant dans .env"))?;
    let db_mongo_url = env::var("MONGO_URL")
        .map_err(|_| io::Error::new(io::ErrorKind::Other, "MONGO_URL manquant dans .env"))?;
    let db_mongo_name = env::var("MONGO_DATA_BASE_NAME")
        .map_err(|_| io::Error::new(io::ErrorKind::Other, "MONGO_DATA_BASE_NAME manquant dans .env"))?;
    
    let base_connection = format!("mongodb+srv://{}:{}@{}", db_mongo_username, db_mongo_password, db_mongo_url);
    let mut client_options = ClientOptions::parse(&base_connection)
        .await
        .map_err(|e| io::Error::new(io::ErrorKind::Other, format!("Erreur de connexion MongoDB: {}", e)))?;

    let server_api = ServerApi::builder().version(ServerApiVersion::V1).build();
    client_options.server_api = Some(server_api);

    let client = Client::with_options(client_options)
        .map_err(|e| io::Error::new(io::ErrorKind::Other, format!("Erreur de création du client: {}", e)))?;

    client
        .database(&db_mongo_name)
        .run_command(doc! {"ping": 1})
        .await
        .map_err(|_| io::Error::new(io::ErrorKind::Other, "Erreur de ping MongoDB"))?;

    Ok(client)
}