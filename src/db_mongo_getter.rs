//! db_mongo_getter.rs :
//!     - get_collection :
//!         nom de la collection    
//!     permet de récupérer l'ensemble de la collection associée pour avoir des statistiques ou des vérifications
//!
//!     - get_server :  
//!         serveur id  
//!     permet de récupérer les données initiées par set_server  
//!
//!     - get_channel_by_id :  
//!         channel id  
//!     permet de récupérer les données initiées par set_channel  
//!
//!     - get_message_by_id :  
//!         message id  
//!     permet de récupérer les données initiées par set_message  
//!
//!     - get_servers_by_member :  
//!         id de l'utilisateur  
//!     permet de récupérer l'ensemble des serveurs où l'utilisateur est.
//!
//!     - get_channels_of_server :  
//!         serveur id  
//!     permet de récupérer l'ensemble des channels d'un serveur
//!
//!     - get_messages_of_channel :  
//!         channel id  
//!     permet de récupérer l'ensemble des messages d'un channel
//!
//!     - get_server_id_by_message_id :  
//!         message id  
//!     permet de récupérer l'id du serveur où se trouve le message
//!
//!     - get_last_id :  
//!         collection  
//!     permet de récupérer le dernier id de la collection. utile pour incrémenter les identifiants
//!
//!     - is_owner :  
//!         serveur id  
//!         id de l'utilisateur  
//!     permet de vérifier s'il possède le serveur
//!
//!     - is_admin :  
//!         serveur id  
//!         id de l'utilisateur  
//!     permet de vérifier s'il possède le rôle administrateur sur le serveur  
//!
//!     - is_member :  
//!         serveur id  
//!         id de l'utilisateur  
//!     permet de vérifier s'il est sur le serveur
//!
//!     - is_channel_of_server :  
//!         serveur id  
//!         channel id  
//!     permet de vérifier si le channel existe sur le serveur. utile dans le setter du message pour ajouter une protection supplémentaire pour écrire un message
//!
//!     - vec_doc_to_number :  
//!         vecteur document  
//!     permet de transformer un vecteur document obtenu auparavant pour avoir un nombre. attention il faut qu'il y ait qu'un seul nombre unique
//!
//!     - verify_link_exist :  
//!         lien/code  
//!     permet de vérifier si le code est bien généré/empêche la génération de deux codes identiques
//!
//!     - convert_string_to_utc :  
//!         chaîne de caractères  
//!     permet de convertir une chaîne de caractères en format UTC en UTC
//!
//!     - convert_utc_to_paris_time  
//!         utc temps  
//!     permet de convertir un UTC en heure de Paris sous format chaîne de caractères

use std::io;
use mongodb::{bson::{doc, Document}, Client};
use futures_util::TryStreamExt;
use chrono::{Utc, DateTime};
use chrono_tz::Europe::Paris;

/// get_collection :
///     nom de la collection    
/// permet de récupérer l'ensemble de la collection associée pour avoir des statistiques ou des vérifications
pub async fn get_collection(client: &Client, db_name: &str, collection: &str) -> io::Result<Vec<Document>> {
    let collection = client
        .database(db_name)
        .collection(collection)
        .find(doc!{})
        .await
        .map_err(|_e| io::Error::new(io::ErrorKind::Other, "base de donnée ou collection de la base non trouver"))?;

    let docs: Vec<Document> = collection
        .try_collect()
        .await
        .map_err(|_e| io::Error::new(io::ErrorKind::Other, "pas de vecteur disponible"))?;

    Ok(docs)

}

/// get_server :  
///     serveur id  
/// permet de récupérer les données initiées par set_server  
pub async fn get_server(client: &Client, db_name: &str, server_id: &i64) -> io::Result<Vec<Document>> {
    let collection = client
        .database(db_name)
        .collection("server")
        .find(doc!{"id":server_id})
        .await
        .map_err(|_e| io::Error::new(io::ErrorKind::Other, "base de donnée ou collection de la base non trouver"))?;

    let docs: Vec<Document> = collection
        .try_collect()
        .await
        .map_err(|_e| io::Error::new(io::ErrorKind::Other, "pas de vecteur disponible"))?;

    Ok(docs)
}

pub async fn get_servers_by_owner(client: &Client, db_name: &str, owner_id: &i64) -> io::Result<Vec<Document>> {
    let collection = client
        .database(db_name)
        .collection("server")
        .find(doc! {"owner_id": owner_id})
        .await
        .map_err(|_| io::Error::new(io::ErrorKind::Other, "Erreur lors de la recherche des serveurs"))?;

    let docs: Vec<Document> = collection
        .try_collect()
        .await
        .map_err(|_| io::Error::new(io::ErrorKind::Other, "Erreur lors de la collecte des documents"))?;

    Ok(docs)
}

/// get_servers_by_member :  
///     id de l'utilisateur  
/// permet de récupérer l'ensemble des serveurs où l'utilisateur est.
pub async fn get_servers_by_member(client: &Client, db_name: &str, user_id: &i64) -> io::Result<Vec<Document>> {
    // MongoDB cherche automatiquement dans les tableaux avec cette syntaxe
    // La syntaxe doc!{"member_id": user_id} fonctionne pour chercher dans un tableau
    let collection = client
        .database(db_name)
        .collection("server")
        .find(doc!{"member_id": user_id})
        .await
        .map_err(|_| io::Error::new(io::ErrorKind::Other, "Erreur lors de la recherche des serveurs"))?;

    let docs: Vec<Document> = collection
        .try_collect()
        .await
        .map_err(|_| io::Error::new(io::ErrorKind::Other, "Erreur lors de la collecte des documents"))?;

    Ok(docs)
}

/// get_channels_of_server :  
///     serveur id  
/// permet de récupérer l'ensemble des channels d'un serveur
pub async fn get_channels_of_server(client: &Client, db_name: &str, server_id: &i64) -> io::Result<Vec<Document>> {
    let collection = client
        .database(db_name)
        .collection("channel")
        .find(doc! {"server_id": server_id})
        .await
        .map_err(|_| io::Error::new(io::ErrorKind::Other, "Erreur lors de la recherche"))?;

    let docs: Vec<Document> = collection
        .try_collect()
        .await
        .map_err(|_| io::Error::new(io::ErrorKind::Other, "Erreur lors de la collecte"))?;

    Ok(docs)
}

/// get_messages_of_channel :  
///     channel id  
/// permet de récupérer l'ensemble des messages d'un channel
pub async fn get_messages_of_channel(client: &Client, db_name: &str, channel_id: &i64) -> io::Result<Vec<Document>> {
    let collection = client
        .database(db_name)
        .collection("message")
        .find(doc! {"channel_id": channel_id})
        .await
        .map_err(|_| io::Error::new(io::ErrorKind::Other, "Erreur lors de la recherche"))?;

    let docs: Vec<Document> = collection
        .try_collect()
        .await
        .map_err(|_| io::Error::new(io::ErrorKind::Other, "Erreur lors de la collecte"))?;

    Ok(docs)
}

/// get_message_by_id :  
///     message id  
/// permet de récupérer les données initiées par set_message  
pub async fn get_message_by_id(client: &Client, db_name: &str, message_id: &i64) -> io::Result<Vec<Document>> {
    let collection = client
        .database(db_name)
        .collection("message")
        .find(doc! {"id": message_id})
        .await
        .map_err(|_| io::Error::new(io::ErrorKind::Other, "Erreur lors de la recherche"))?;

    let docs: Vec<Document> = collection
        .try_collect()
        .await
        .map_err(|_| io::Error::new(io::ErrorKind::Other, "Erreur lors de la collecte"))?;

    Ok(docs)
}

/// get_channel_by_id :  
///     channel id  
/// permet de récupérer les données initiées par set_channel  
pub async fn get_channel_by_id(client: &Client, db_name: &str, channel_id: &i64) -> io::Result<Vec<Document>> {
    let collection = client
        .database(db_name)
        .collection("channel")
        .find(doc! {"id": channel_id})
        .await
        .map_err(|_| io::Error::new(io::ErrorKind::Other, "Erreur lors de la recherche"))?;

    let docs: Vec<Document> = collection
        .try_collect()
        .await
        .map_err(|_| io::Error::new(io::ErrorKind::Other, "Erreur lors de la collecte"))?;

    Ok(docs)
}


/// get_server_id_by_message_id :  
///     message id  
/// permet de récupérer l'id du serveur où se trouve le message
pub async fn get_server_id_by_message_id(client: &Client, db_name: &str, message_id: &i64) -> io::Result<i64> {
    let message_by_id = get_message_by_id(client, db_name, message_id).await?;
    
    for message in message_by_id {
        for (key, value) in message {
            if key == "channel_id" {
                if let Some(channel_id) = value.as_i64() {
                    let channel_by_id = get_channel_by_id(client, db_name, &channel_id).await?;
                    for channel in channel_by_id {
                        for (key_c, value_c) in channel {
                            if key_c == "server_id" {
                                if let Some(server_id) = value_c.as_i64() {
                                    return Ok(server_id);
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    Ok(0)
}

/// get_last_id :  
///     collection  
/// permet de récupérer le dernier id de la collection. utile pour incrémenter les identifiants
pub async fn get_last_id(client: &Client, db_name: &str, collection: &str) -> io::Result<i64> {
    let collection = client
        .database(db_name)
        .collection(collection)
        .find(doc! {})
        .projection(doc! {"id": 1, "_id": 0})
        .sort(doc! {"_id": -1})
        .limit(1)
        .await
        .map_err(|_| io::Error::new(io::ErrorKind::Other, "Erreur lors de la recherche"))?;

    let docs: Vec<Document> = collection
        .try_collect()
        .await
        .map_err(|_| io::Error::new(io::ErrorKind::Other, "Erreur lors de la collecte"))?;

    Ok(vec_doc_to_number(docs))
}

/// is_owner :  
///     serveur id  
///     id de l'utilisateur  
/// permet de vérifier s'il possède le serveur
pub async fn is_owner(client: &Client, db_name: &str, server_id: &i64, user_id: &i64) -> io::Result<bool> {
    let collection = client
        .database(db_name)
        .collection("server")
        .find(doc! {"id": server_id, "owner_id": user_id})
        .await
        .map_err(|_| io::Error::new(io::ErrorKind::Other, "Erreur lors de la recherche"))?;

    let docs: Vec<Document> = collection
        .try_collect()
        .await
        .map_err(|_| io::Error::new(io::ErrorKind::Other, "Erreur lors de la collecte"))?;

    Ok(!docs.is_empty())
}

/// is_admin :  
///     serveur id  
///     id de l'utilisateur  
/// permet de vérifier s'il possède le rôle administrateur sur le serveur  
pub async fn is_admin(client: &Client, db_name: &str, server_id: &i64, user_id: &i64) -> io::Result<bool> {
    let collection = client
        .database(db_name)
        .collection("server")
        .find(doc! {"id": server_id, "admin_id": user_id})
        .await
        .map_err(|_| io::Error::new(io::ErrorKind::Other, "Erreur lors de la recherche"))?;

    let docs: Vec<Document> = collection
        .try_collect()
        .await
        .map_err(|_| io::Error::new(io::ErrorKind::Other, "Erreur lors de la collecte"))?;

    Ok(!docs.is_empty())
}

/// is_member :  
///     serveur id  
///     id de l'utilisateur  
/// permet de vérifier s'il est sur le serveur
pub async fn is_member(client: &Client, db_name: &str,  server_id: &i64, user_id: &i64) -> io::Result<bool> {
    let collection = client
        .database(db_name)
        .collection("server")
        .find(doc! {"id": server_id, "member_id": user_id})
        .await
        .map_err(|_| io::Error::new(io::ErrorKind::Other, "Erreur lors de la recherche"))?;

    let docs: Vec<Document> = collection
        .try_collect()
        .await
        .map_err(|_| io::Error::new(io::ErrorKind::Other, "Erreur lors de la collecte"))?;

    Ok(!docs.is_empty())
}


/// is_channel_of_server :  
///     serveur id  
///     channel id  
/// permet de vérifier si le channel existe sur le serveur. utile dans le setter du message pour ajouter une protection supplémentaire pour écrire un message
pub async fn is_channel_of_server(client: &Client, db_name: &str, server_id: i64, channel_id: i64) -> io::Result<bool> {
    let channels = get_channels_of_server(client, db_name, &server_id).await?;
    for ch in channels {
        if let Some(id) = ch.get("id").and_then(|v| v.as_i64()) {
            if id == channel_id {
                return Ok(true);
            }
        }
    }
    Ok(false)
}


/// vec_doc_to_number :  
///     vecteur document  
/// permet de transformer un vecteur document obtenu auparavant pour avoir un nombre. attention il faut qu'il y ait qu'un seul nombre unique
pub fn vec_doc_to_number(docs: Vec<Document>) -> i64 {
    let mut temp = String::new();
    for doc in docs {
        let string = doc.to_string();
        for ch in string.chars() {
            if ch.is_ascii_digit() {
                temp.push(ch);
            }
        }
    }
    temp.parse().unwrap_or(0)
}

/// verify_link_exist :  
///     lien/code  
/// permet de vérifier si le code est bien généré/empêche la génération de deux codes identiques
pub async fn verify_link_exist(client: &Client, db_name: &str,link_code: &str)-> io::Result<bool>{
    let collection = client
        .database(db_name)
        .collection::<Document>("server")
        .find(doc!{"lien":&link_code})
        .await
        .map_err(|_e| io::Error::new(io::ErrorKind::Other, "base de donnée ou collection de la base non trouver"))?;
    
    let docs: Vec<Document> = collection
        .try_collect()
        .await
        .map_err(|_e| io::Error::new(io::ErrorKind::Other, "pas de vecteur disponible"))?;

    Ok(!docs.is_empty())
}


/// convert_string_to_utc :  
///     chaîne de caractères  
/// permet de convertir une chaîne de caractères en format UTC en UTC
fn convert_string_to_utc(string: &str) -> DateTime<Utc> {
    string.parse().unwrap()
}

/// convert_utc_to_paris_time  
///     utc temps  
/// permet de convertir un UTC en heure de Paris sous format chaîne de caractères
fn convert_utc_to_paris_time(utc: DateTime<Utc>) -> String {
    utc.with_timezone(&Paris).to_rfc3339()
}