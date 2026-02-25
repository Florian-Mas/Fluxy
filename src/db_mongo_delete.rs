//! db_mongo_delete.rs :
//!     - delete_message :
//!         message id
//!         utilisateur qui fait l'action   
//!     permet au créateur du message, un administrateur ou un possesseur de supprimer le message correspondant
//!
//!     - delete_channel :  
//!         channel id  
//!         id utilisateur  
//!     permet à un administrateur ou un possesseur de supprimer un channel
//!
//!     - delete_server :  
//!         serveur id  
//!         id utilisateur  
//!     permet au possesseur du serveur de le supprimer
//!
//!     - delete_admin :  
//!         serveur id  
//!         id possesseur  
//!         id administrateur  
//!     permet à un possesseur de serveur de retirer la permission administrateur à un des membres
//!
//!     - delete_member :  
//!         utilisateur id  
//!         utilisateur à supprimer  
//!     permet à un membre de partir, à un administrateur de partir et de supprimer des membres et à un possesseur de supprimer des membres. un possesseur ne peut pas partir.
//!
//!     - delete_link :  
//!         lien/code  
//!     permet de supprimer un lien d'invitation directement

use crate::db_mongo_getter;

use std::{
    io,
};
use mongodb::{
    bson::{doc,Document,Bson,},
    options::FindOptions,
    Client
};

use futures_util::{
    TryStreamExt,
    StreamExt
};

/// delete_message :
///     message id
///     utilisateur qui fait l'action   
/// permet au créateur du message, un administrateur ou un possesseur de supprimer le message correspondant
//supprime un message
pub async fn delete_message(client: &Client, db_name: &str, message_id: i64,user_id: i64)-> io::Result<()>{
    // println!("test");
    let mut can_del = false;
    let server_id = db_mongo_getter::get_server_id_by_message_id(client, db_name, &message_id).await?;
    if db_mongo_getter::is_owner(&client,&db_name, &server_id,&user_id).await?==true 
    || db_mongo_getter::is_admin(&client,&db_name, &server_id,&user_id).await?==true{
        can_del = true;
    }
    let message_by_id = db_mongo_getter::get_message_by_id(client, db_name, &message_id).await?;
    for i in message_by_id{
        for (key,value) in i{
            if key == "user"{
                if value == Bson::Int64(user_id){
                    can_del = true;
                }
            }
        }
    }

    if can_del == false{return Ok(());};
    let collection = client
    .database(db_name)
    .collection::<Document>("message")
    .delete_one(doc!{"id":message_id})
    .await
    .map_err(|_e| io::Error::new(io::ErrorKind::Other, "base de donnée ou collection de la base non trouver"))?;
    Ok(())
}

/// delete_channel :  
///     channel id  
///     id utilisateur  
/// permet à un administrateur ou un possesseur de supprimer un channel
//supprime un salon
pub async fn delete_channel(client: &Client, db_name: &str,channel_id: i64,user_id: i64)-> io::Result<()>{
    let channel = db_mongo_getter::get_channel_by_id(client, db_name,&channel_id).await?;
    let mut server_id = 0;
    for i in channel{
        for (key,value) in i{
            if key == "server_id"{
                server_id = value.to_string().parse::<i64>().unwrap();
            }
        }
    }
    if !db_mongo_getter::is_owner(&client,&db_name, &server_id,&user_id).await?
        && !db_mongo_getter::is_admin(&client,&db_name, &server_id,&user_id).await?{
        return Ok(());
    }
    //supprime tout les message
    client
        .database(db_name)
        .collection::<Document>("message")
        .delete_many(doc!{"channel_id":channel_id})
        .await
        .map_err(|_e| io::Error::new(io::ErrorKind::Other, "base de donnée ou collection de la base non trouver"))?;

    //supprime le channel
    client
        .database(db_name)
        .collection::<Document>("channel")
        .delete_one(doc!{"id":channel_id})
        .await
        .map_err(|_e| io::Error::new(io::ErrorKind::Other, "base de donnée ou collection de la base non trouver"))?;


    Ok(())  
}

/// delete_server :  
///     serveur id  
///     id utilisateur  
/// permet au possesseur du serveur de le supprimer
//supprime le serveur au complet
pub async fn delete_server(client: &Client, db_name: &str,server_id: i64,user_id: i64)-> io::Result<()>{
    if !db_mongo_getter::is_owner(&client,&db_name, &server_id,&user_id).await?{
        return Ok(());
    }

    //cherche les salon pour tout supprimer
    let mut channels_id: Vec<i64> = vec![];
    let mut channel_id_doc = client
        .database(db_name)
        .collection::<Document>("channel")
        .find(doc!{"server_id":server_id})
        .projection(doc! { "id": 1, "_id": 0 })
        .await
        .map_err(|_e| io::Error::new(io::ErrorKind::Other, "base de donnée ou collection de la base non trouver"))?;

    let docs: Vec<Document> = channel_id_doc
        .try_collect()
        .await
        .map_err(|_e| io::Error::new(io::ErrorKind::Other, "pas de vecteur disponible"))?;
    
    let mut temp ="".to_string();
    for i in docs{
        let string = i.to_string();
        for a in string.chars(){
            // println!("{:?}",a);
            match a {
                '1'|'2'|'3'|'4'|'5'|'6'|'7'|'8'|'9'|'0'=>temp.push(a),
                '}'=>{
                        // println!("{:?}",temp);
                        channels_id.push(temp.parse::<i64>().unwrap_or(0));
                        temp = "".to_string();
                    },
                    _ => continue,
                };
            }
        }
        for i in channels_id{
            delete_channel(client,db_name,i,user_id).await?;
        }
   
    //supprime le server
    let collection = client
        .database(db_name)
        .collection::<Document>("server")
        .delete_one(doc!{"id":server_id})
        .await
        .map_err(|_e| io::Error::new(io::ErrorKind::Other, "base de donnée ou collection de la base non trouver"))?;
    Ok(())

}

/// delete_admin :  
///     serveur id  
///     id possesseur  
///     id administrateur  
/// permet à un possesseur de serveur de retirer la permission administrateur à un des membres
pub async fn delete_admin(client: &Client, db_name: &str,server_id: i64,user_id: i64,user_to_remove: i64)-> io::Result<()>{
    // Seul l'owner peut supprimer un admin
    if !db_mongo_getter::is_owner(&client,&db_name,&server_id,&user_id).await?{
        return Ok(());
    }

    client
        .database(db_name)
        .collection::<Document>("server")
        .update_one(
            doc! {"id":server_id},
            doc!{"$pull":{"admin_id":user_to_remove}}
        )
        .await
        .map_err(|_e| io::Error::new(io::ErrorKind::Other, "base de donnée ou collection de la base non trouver"))?;

    Ok(())
}

/// delete_member :  
///     utilisateur id  
///     utilisateur à supprimer  
/// permet à un membre de partir, à un administrateur de partir et de supprimer des membres et à un possesseur de supprimer des membres. un possesseur ne peut pas partir.
pub async fn delete_member(client: &Client, db_name: &str,server_id: i64,user_id: i64,user_to_remove: i64)-> io::Result<()>{
    if db_mongo_getter::is_admin(&client,&db_name,&server_id,&user_id).await?
    && db_mongo_getter::is_admin(&client,&db_name,&server_id,&user_to_remove).await?
    && user_id != user_to_remove{
        return Ok(());

    }
    if db_mongo_getter::is_owner(&client,&db_name,&server_id,&user_to_remove).await?{
        return Ok(());

    }
    
    if !db_mongo_getter::is_owner(&client,&db_name,&server_id,&user_id).await?
    && !db_mongo_getter::is_admin(&client,&db_name,&server_id,&user_id).await?
    && user_id != user_to_remove
    {
        return Ok(());
    }

    client
        .database(db_name)
        .collection::<Document>("server")
        .update_one(
            doc! {"id":server_id},
            doc!{"$pull":{"admin_id":user_to_remove,"member_id":user_to_remove}}
        )
        .await
        .map_err(|_e| io::Error::new(io::ErrorKind::Other, "base de donnée ou collection de la base non trouver"))?;

    Ok(())
}

/// delete_link :  
///     lien/code  
/// permet de supprimer un lien d'invitation directement
pub async fn delete_link(client: &Client, db_name: &str,link: &str)-> io::Result<()>{
    client
    .database(db_name)
    .collection::<Document>("server")
    .update_one(
        doc!{"lien":link},
        doc!{"$unset":{"lien":""}}
    )
    .await
    .map_err(|_e| io::Error::new(io::ErrorKind::Other, "base de donnée ou collection de la base non trouver"))?;

    return Ok(());
}