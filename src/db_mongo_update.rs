//! db_mongo_update.rs :
//!     - update_message
//!         message id
//!         message
//!         utilisateur qui a écrit le message
//!     permet à l'utilisateur ayant écrit son message de le modifier
//!
//!     - update_channel_name  
//!         channel id  
//!         nom  
//!         administrateur/possesseur du serveur  
//!     permet à un administrateur ou au possesseur de modifier le nom du channel  
//!
//!     - update_server_name  
//!         serveur id  
//!         nom  
//!         administrateur/possesseur du serveur  
//!     permet au possesseur de modifier le nom du serveur

use crate::db_mongo_getter;
use std::io;
use mongodb::{
    bson::{doc, Document, Bson},
    Client,
};

/// update_message
///     message id
///     message
///     utilisateur qui a écrit le message
/// permet à l'utilisateur ayant écrit son message de le modifier
/// Mise à jour d'un message (contenu uniquement)
pub async fn update_message(
    client: &Client,
    db_name: &str,
    message_id: i64,
    message: &str,
    user_id: i64,
) -> io::Result<()> {
    let mut can_modify = false;
    
    let message_by_id = db_mongo_getter::get_message_by_id(client, db_name, &message_id).await?;
    for i in message_by_id{
        for (key,value) in i{
            if key == "user"{
                if let Some(msg_user_id) = value.as_i64() {
                    if msg_user_id == user_id {
                        can_modify = true;
                        break;
                    }
                }
            }
        }
        if can_modify {
            break;
        }
    }

    if !can_modify {
        return Ok(());
    }

    client
        .database(db_name)
        .collection::<Document>("message")
        .update_one(
            doc! {"id":message_id},
            doc!{"$set":{"message":message}})
        .await
        .map_err(|_e| io::Error::new(io::ErrorKind::Other, "base de donnée ou collection de la base non trouver"))?;
    
    Ok(())
}

/// update_channel_name  
///     channel id  
///     nom  
///     administrateur/possesseur du serveur  
/// permet à un administrateur ou au possesseur de modifier le nom du channel  
pub async fn update_channel_name(client: &Client, db_name: &str,channel_id: i64,name: &str,user_id: i64)-> io::Result<()>{
    let channel = db_mongo_getter::get_channel_by_id(client, db_name,&channel_id).await?;
    if channel.is_empty() {
        return Ok(());
    }
    let mut server_id = 0;
    for i in channel{
        for (key,value) in i{
            if key == "server_id"{
                if let Some(id) = value.as_i64() {
                    server_id = id;
                    break;
                }
            }
        }
        if server_id != 0 {
            break;
        }
    }
    if server_id == 0 {
        return Ok(());
    }
    if !db_mongo_getter::is_owner(&client,&db_name,&server_id,&user_id).await? 
        && !db_mongo_getter::is_admin(&client,&db_name,&server_id,&user_id).await?{
        return Ok(());
    }

    client
        .database(db_name)
        .collection::<Document>("channel")
        .update_one(
            doc! {"id":channel_id},
            doc!{"$set":{"name":name}})
        .await
        .map_err(|_| {
            io::Error::new(
                io::ErrorKind::Other,
                "Erreur lors de la mise à jour du channel",
            )
        })?;

    Ok(())
}

/// update_server_name  
///     serveur id  
///     nom  
///     administrateur/possesseur du serveur  
/// permet au possesseur de modifier le nom du serveur
pub async fn update_server_name(client: &Client, db_name: &str,server_id: i64,name: &str,user_id: i64)-> io::Result<()>{
    if !db_mongo_getter::is_owner(&client,&db_name,&server_id,&user_id).await?
        && !db_mongo_getter::is_admin(&client,&db_name,&server_id,&user_id).await?{
        return Ok(());
    }

    client
        .database(db_name)
        .collection::<Document>("server")
        .update_one(
            doc! {"id":server_id},
            doc!{"$set":{"name":name}})
        .await
        .map_err(|_e| io::Error::new(io::ErrorKind::Other, "base de donnée ou collection de la base non trouver"))?;
    
    Ok(())
}

/// Met à jour les propriétés d'un serveur (nom et/ou image).
/// Si `name` ou `image` est `None`, le champ correspondant n'est pas modifié.
pub async fn update_server(
    client: &Client,
    db_name: &str,
    server_id: i64,
    name: Option<&str>,
    image: Option<&str>,
    user_id: i64,
) -> io::Result<()> {
    if !db_mongo_getter::is_owner(&client,&db_name,&server_id,&user_id).await?
        && !db_mongo_getter::is_admin(&client,&db_name,&server_id,&user_id).await?{
        return Ok(());
    }

    let mut set_doc = doc!{};
    if let Some(n) = name {
        if !n.trim().is_empty() {
            set_doc.insert("name", n);
        }
    }
    if let Some(img) = image {
        // on autorise image vide pour effacer, donc pas de trim ici
        set_doc.insert("image", img);
    }

    if set_doc.is_empty() {
        // Rien à mettre à jour
        return Ok(());
    }

    client
        .database(db_name)
        .collection::<Document>("server")
        .update_one(
            doc! {"id":server_id},
            doc!{"$set":set_doc})
        .await
        .map_err(|_e| io::Error::new(io::ErrorKind::Other, "base de donnée ou collection de la base non trouver"))?;
    
    Ok(())
}

// Met à jour le rôle d'un membre (admin / membre) sur un serveur
pub async fn update_member_role(
    client: &Client,
    db_name: &str,
    server_id: i64,
    user_id: i64,
    role: &str,
    owner_id: i64,
) -> io::Result<()> {
    // Seul l'owner peut modifier les rôles
    if !db_mongo_getter::is_owner(client, db_name, &server_id, &owner_id).await? {
        return Err(io::Error::new(
            io::ErrorKind::PermissionDenied,
            "PermissionDenied: seul le fondateur peut modifier les rôles",
        ));
    }

    let collection = client
        .database(db_name)
        .collection::<Document>("server");

    match role {
        "admin" => {
            // Ajouter l'utilisateur à la liste des admins
            collection
                .update_one(
                    doc! { "id": server_id },
                    doc! { "$addToSet": { "admin_id": user_id } },
                )
                .await
                .map_err(|_| {
                    io::Error::new(
                        io::ErrorKind::Other,
                        "Erreur lors de l'ajout de l'admin",
                    )
                })?;
        }
        "membre" => {
            // Retirer l'utilisateur de la liste des admins
            collection
                .update_one(
                    doc! { "id": server_id },
                    doc! { "$pull": { "admin_id": user_id } },
                )
                .await
                .map_err(|_| {
                    io::Error::new(
                        io::ErrorKind::Other,
                        "Erreur lors du retrait de l'admin",
                    )
                })?;
        }
        _ => {
            return Err(io::Error::new(
                io::ErrorKind::InvalidInput,
                "InvalidInput: rôle inconnu",
            ));
        }
    }

    Ok(())
}

//non fonctionnel
/*pub async fn update_channel_position(client: &Client, db_name: &str,channel_id: i64,position: i64,user_id: i64)-> io::Result<()>{
    
    let collection = client
    .database(db_name)
    .collection::<Document>("channel")
    .find(doc!{"id":channel_id})
    .projection(doc! { "position": 1, "_id": 0 })
    .await
    .map_err(|_e| io::Error::new(io::ErrorKind::Other, "base de donnée ou collection de la base non trouver"))?;
    

    let docs: Vec<Document> = collection
    .try_collect()
    .await
    .map_err(|_e| io::Error::new(io::ErrorKind::Other, "pas de vecteur disponible"))?;

    let actual_position = db_mongo_getter::vec_doc_to_number(docs);

    let diff = position - actual_position;
    println!("{}",diff);
    Ok(())
}*/
