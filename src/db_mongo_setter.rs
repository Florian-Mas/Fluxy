//! db_mongo_setter.rs :
//!     -set_server :
//!         utilisateur qui le crée
//!         nom du serveur
//!     permet de créer un serveur dont l'id s'incrémente à chaque fois. pour ajouter d'autres éléments pour l'objet, les ajouter dans insert_one.  
//!
//!     - set_channel :  
//!         serveur id  
//!         nom du channel  
//!         utilisateur qui le crée  
//!     permet de créer un channel dans le serveur que si l'utilisateur a la permission (administrateur ou possesseur).
//!
//!     - set_message :  
//!         serveur id  
//!         channel id  
//!         message  
//!         utilisateur qui écrit  
//!     permet d'écrire dans le channel du serveur correspondant. une vérification est effectuée pour vérifier que le membre et le salon existent bien dans le serveur
//!
//!     - add_member_to_server :  
//!         serveur id  
//!         membre id  
//!     permet de forcer un membre à rejoindre un serveur. pas de lien d'invitation ni de confirmation de l'utilisateur pour rejoindre
//!
//!     - add_admin_to_server :  
//!         serveur id  
//!         possesseur id  
//!         membre à passer administrateur  
//!     permet uniquement au possesseur du serveur d'ajouter un administrateur
//!
//!     - switch_owner :  
//!         serveur id  
//!         possesseur id  
//!         membre à passer possesseur  
//!     permet uniquement au possesseur du serveur de passer un autre membre possesseur du serveur à sa place  
//!
//!     - create_link_one_use :  
//!         serveur id  
//!         utilisateur qui veut créer le lien  
//!     permet de créer un lien que si l'on est administrateur ou possesseur du serveur. le terme one_use ne s'effectue que sur la ligne commentée dans join_by_link est décommentée. la gestion de l'aléatoire du code est effectuée grâce à random_string
//!
//!     - join_by_link :  
//!         lien/code  
//!         utilisateur qui veut rejoindre  
//!     permet de rejoindre le serveur grâce à un lien.

use crate::db_mongo_getter;
// use crate::db_mongo_delete;
use std::io;
use mongodb::{bson::{doc, Document}, Client};
use chrono::Utc;
use futures_util::TryStreamExt;
use rand::Rng;

/// set_server :
///     utilisateur qui le crée
///     nom du serveur
///     image optionnelle du serveur
/// permet de créer un serveur dont l'id s'incrémente à chaque fois. pour ajouter d'autres éléments pour l'objet, les ajouter dans insert_one.  
pub async fn set_server(
    client: &Client,
    db_name: &str,
    owner_id: i64,
    name: &str,
    image: Option<String>,
) -> io::Result<()> {
    let last_id = db_mongo_getter::get_last_id(client, db_name, "server").await?;
    
    let mut server_doc = doc! {
        "id": last_id + 1,
        "name": name,
        "owner_id": owner_id,
        "admin_id": [],
        "member_id": [owner_id]
    };

    if let Some(img) = image {
        if !img.trim().is_empty() {
            server_doc.insert("image", img);
        }
    }

    client
        .database(db_name)
        .collection("server")
        .insert_one(server_doc)
        .await
        .map_err(|_| io::Error::new(io::ErrorKind::Other, "Erreur lors de la création du serveur"))?;

    Ok(())
}

/// set_channel :  
///     serveur id  
///     nom du channel  
///     utilisateur qui le crée  
/// permet de créer un channel dans le serveur que si l'utilisateur a la permission (administrateur ou possesseur).
pub async fn set_channel(client: &Client, db_name: &str, server_id: i64, name: &str, user_id: i64) -> io::Result<()> {
    // Vérifie que l'utilisateur est owner ou admin du serveur ciblé
    if !db_mongo_getter::is_owner(&client, &db_name, &server_id, &user_id).await?
        && !db_mongo_getter::is_admin(&client, &db_name, &server_id, &user_id).await?
    {
        return Ok(());
    }

    let last_id = db_mongo_getter::get_last_id(client, db_name,"channel").await?;
    let last_position = db_mongo_getter::get_channels_of_server(client,db_name,&server_id).await?.len()as i64;
    
    client
        .database(db_name)
        .collection("channel")
        .insert_one(doc! {
            "id": last_id + 1,
            "server_id": server_id,
            "position": last_position+1,
            "name": name,
        })
        .await
        .map_err(|_| io::Error::new(io::ErrorKind::Other, "Erreur lors de la création du channel"))?;

    Ok(())
}

/// set_message :  
///     serveur id  
///     channel id  
///     message  
///     utilisateur qui écrit  
/// permet d'écrire dans le channel du serveur correspondant. une vérification est effectuée pour vérifier que le membre et le salon existent bien dans le serveur
pub async fn set_message(client: &Client, db_name: &str, server_id: i64, channel_id: i64, message: &str, user_id: i64) -> io::Result<()> {
    let is_member = db_mongo_getter::is_member(&client, &db_name, &server_id, &user_id).await?;
    let is_channel = db_mongo_getter::is_channel_of_server(client, db_name, server_id, channel_id).await?;
    
    if !is_member || !is_channel {
        println!("set_message: is_member={}, is_channel={} pour server_id={}, channel_id={}, user_id={}", 
                 is_member, is_channel, server_id, channel_id, user_id);
        return Ok(());
    }

    let last_id = db_mongo_getter::get_last_id(client, db_name, "message").await?;

    client
        .database(db_name)
        .collection("message")
        .insert_one(doc! {
            "id": last_id + 1,
            "channel_id": channel_id,
            "message": message,
            "user": user_id,
            "time": Utc::now().to_rfc3339()
        })
        .await
        .map_err(|_| io::Error::new(io::ErrorKind::Other, "Erreur lors de la création du message"))?;

    Ok(())
}

/// add_member_to_server :  
///     serveur id  
///     membre id  
/// permet de forcer un membre à rejoindre un serveur. pas de lien d'invitation ni de confirmation de l'utilisateur pour rejoindre
pub async fn add_member_to_server(client: &Client, db_name: &str, server_id: i64, user_id: i64) -> io::Result<()> {

    client
        .database(db_name)
        .collection::<Document>("server")
        .update_one(
            doc! {"id": server_id},
            doc! {"$addToSet": {"member_id": user_id}},
        )
        .await
        .map_err(|_| {
            io::Error::new(
                io::ErrorKind::Other,
                "Erreur lors de l'ajout du membre",
            )
        })?;

    Ok(())
}

/// add_admin_to_server :  
///     serveur id  
///     possesseur id  
///     membre à passer administrateur  
/// permet uniquement au possesseur du serveur d'ajouter un administrateur
pub async fn add_admin_to_server(client: &Client, db_name: &str, server_id: i64, user_id: i64, user_to_add: i64) -> io::Result<()> {
    if !db_mongo_getter::is_owner(&client, &db_name,&server_id, &user_id).await? 
        || !db_mongo_getter::is_member(&client,&db_name,&server_id, &user_to_add).await?{
        return Ok(());
    }

    client
        .database(db_name)
        .collection::<Document>("server")
        .update_one(
            doc! {"id": server_id},
            doc! {"$addToSet": {"admin_id": user_to_add}},
        )
        .await
        .map_err(|_| {
            io::Error::new(
                io::ErrorKind::Other,
                "Erreur lors de l'ajout de l'admin",
            )
        })?;

    Ok(())
}

/// switch_owner :  
///     serveur id  
///     possesseur id  
///     membre à passer possesseur  
/// permet uniquement au possesseur du serveur de passer un autre membre possesseur du serveur à sa place  
pub async fn switch_owner(client: &Client, db_name: &str, server_id: i64, user_id: i64, user_to_replace: i64) -> io::Result<()> {
    if !db_mongo_getter::is_owner(&client, &db_name, &server_id, &user_id).await? {
        return Ok(());
    }

    client
        .database(db_name)
        .collection::<Document>("server")
        .update_one(
            doc! {"id": server_id},
            doc! {"$set": {"owner_id": user_to_replace}},
        )
        .await
        .map_err(|_| {
            io::Error::new(
                io::ErrorKind::Other,
                "Erreur lors du transfert de propriété",
            )
        })?;

    Ok(())
}

/// create_link_one_use :  
///     serveur id  
///     utilisateur qui veut créer le lien  
/// permet de créer un lien que si l'on est administrateur ou possesseur du serveur. le terme one_use ne s'effectue que sur la ligne commentée dans join_by_link est décommentée. la gestion de l'aléatoire du code est effectuée grâce à random_string
pub async fn create_link_one_use(client: &Client, db_name: &str, server_id: i64, user_id: i64)->io::Result<String>{
    if !db_mongo_getter::is_owner(&client,&db_name, &server_id,&user_id).await?
        && !db_mongo_getter::is_admin(&client,&db_name, &server_id,&user_id).await?{
        return Ok("a".to_string());
    }
    let mut link_code = random_string();
    while db_mongo_getter::verify_link_exist(client, db_name,&link_code).await?{
        link_code = random_string();
        db_mongo_getter::verify_link_exist(client, db_name,&link_code);
    }

    client
        .database(db_name)
        .collection::<Document>("server")
        .update_one(
            doc! {"id":server_id},
            doc!{"$set":{"lien":&link_code}})
        .await
        .map_err(|_e| io::Error::new(io::ErrorKind::Other, "base de donnée ou collection de la base non trouver"))?;
    
    
    Ok(link_code)
    
}

/// join_by_link :  
///     lien/code  
///     utilisateur qui veut rejoindre  
/// permet de rejoindre le serveur grâce à un lien.
pub async fn join_by_link(client: &Client, db_name: &str,link: &str,user_id: i64)->io::Result<()>{
    if !db_mongo_getter::verify_link_exist(client, db_name,link).await?{
        return Ok(());
    }
    // println!("entrain de rejoindre");
    client
        .database(db_name)
        .collection::<Document>("server")
        .update_one(
            doc! {"lien":link},
            doc!{"$addToSet":{"member_id":user_id}}
        )
        .await
        .map_err(|_e| io::Error::new(io::ErrorKind::Other, "add_member_to_server : base de donnée ou collection de la base non trouver"))?;

    // db_mongo_delete::delete_link(client, db_name,link).await?;

    return Ok(());
}

fn random_string()-> String{
    let mut rng = rand::rng();
    let mut link_code = "".to_string();

    for i in 1..10{
        link_code.push(rng.sample(rand::distr::Alphanumeric) as char)
    }
    return link_code;
}


