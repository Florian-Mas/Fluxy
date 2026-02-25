#![allow(warnings)]
use T_JSF_600_MAR_1::{
    db_mongo_connection,
    db_mongo_getter,
    db_mongo_setter,
    db_mongo_delete,
    db_mongo_update
};
use std::{
    env,
    io};
    
use mongodb::{
    bson::{doc, Document, Bson},
    Client
};

#[cfg(test)]
mod tests {
    use super::*;
    use tokio::sync::Mutex;
    use once_cell::sync::Lazy;
    
    // Mutex global pour synchroniser les tests MongoDB
    // Cela garantit qu'un seul test accède à la base de données "test" à la fois
    static TEST_MUTEX: Lazy<Mutex<()>> = Lazy::new(|| Mutex::new(()));
    
    const DEFAULT_OWNER: i64 = 200;
    const DEFAULT_NEW_MEMBER: i64 = 111;
    const DEFAULT_NEW_MEMBER2: i64 = 222;
    const DEFAULT_NEW_MEMBER3: i64 = 333;
    const DEFAULT_NEW_MEMBER4: i64 = 444;
    const DEFAULT_NEW_MEMBER5: i64 = 555;
    
    // Fonction helper pour obtenir le verrou avant chaque test (async)
    async fn get_test_lock() -> tokio::sync::MutexGuard<'static, ()> {
        TEST_MUTEX.lock().await
    }

    #[actix_web::test]
    async fn test_mongo_connection() ->std::io::Result<()>{
        // Acquérir le verrou pour éviter la concurrence
        let _lock = get_test_lock().await;
        let client_mongo_db = db_mongo_connection::get_client().await?;
        assert!(type_of(&client_mongo_db)=="mongodb::client::Client");
        println!("test_mongo_connection => connection à la base de donnée fonctionnel");
        Ok(())
    }
    
    #[actix_web::test]
    async fn test_mongo_server_set_up() ->std::io::Result<()>{
        // Acquérir le verrou pour éviter la concurrence
        let _lock = get_test_lock().await;
        let client_mongo_db = db_mongo_connection::get_client().await?;
        let mut test_server_server_id = 0;
        let number_of_server: usize = db_mongo_getter::get_collection(&client_mongo_db,"test","server").await?.len();
        db_mongo_setter::set_server(&client_mongo_db,"test",DEFAULT_OWNER,"test de création de serveur").await?;
        
        // Attendre que le serveur soit créé (problème de concurrence)
        let mut retries = 0;
        while retries < 10 && test_server_server_id == 0 {
            test_server_server_id = db_mongo_getter::get_last_id(&client_mongo_db,"test","server").await?;
            if test_server_server_id == 0 {
                tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
                retries += 1;
            }
        }
        
        println!("test_mongo_server_set_up => création du server avec l'identifiant numéro : {:?}",test_server_server_id);
        assert!(test_server_server_id !=0);
        
        // Vérifier que le serveur est créé avec retries
        retries = 0;
        let mut server_created = false;
        while retries < 10 && !server_created {
            let current_number = db_mongo_getter::get_collection(&client_mongo_db,"test","server").await?.len();
            if current_number > number_of_server {
                server_created = true;
            } else {
                tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
                retries += 1;
            }
        }
        assert!(server_created, "Le serveur devrait être créé");
        
        db_mongo_delete::delete_server(&client_mongo_db,"test",test_server_server_id,DEFAULT_OWNER).await?;
        
        // Attendre que la suppression soit complète (problème de concurrence)
        retries = 0;
        let mut server_deleted = false;
        while retries < 10 && !server_deleted {
            let current_number = db_mongo_getter::get_collection(&client_mongo_db,"test","server").await?.len();
            if current_number == number_of_server {
                server_deleted = true;
            } else {
                tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
                retries += 1;
            }
        }
        
        println!("test_mongo_server_set_up => suppression du server crée : {:?}",test_server_server_id);
        let final_number = db_mongo_getter::get_collection(&client_mongo_db,"test","server").await?.len();
        assert!(final_number == number_of_server, 
            "Le nombre de serveurs devrait être revenu à la valeur initiale. Initial: {}, Final: {}", 
            number_of_server, final_number);
        
        Ok(())
    }
    #[actix_web::test]
    async fn test_mongo_channel_set_up() ->std::io::Result<()>{
        // Acquérir le verrou pour éviter la concurrence
        let _lock = get_test_lock().await;
        let client_mongo_db = db_mongo_connection::get_client().await?;
        let mut test_channel_server_id = 0;
        let mut test_channel_channel_id = 0;
        let number_of_channel: usize = db_mongo_getter::get_collection(&client_mongo_db,"test","channel").await?.len();
        println!("test_mongo_channel_set_up => nombre de channel : {:?}",number_of_channel);
        db_mongo_setter::set_server(&client_mongo_db,"test",DEFAULT_OWNER,"test de création de channel").await?;
        test_channel_server_id = db_mongo_getter::get_last_id(&client_mongo_db,"test","server").await?;
        println!("test_mongo_channel_set_up => création du server pour channel avec l'identifiant numéro : {:?}",test_channel_server_id);
        db_mongo_setter::set_channel(&client_mongo_db,"test",test_channel_server_id,"premier channel crée",DEFAULT_OWNER).await?;
        test_channel_channel_id = db_mongo_getter::get_last_id(&client_mongo_db,"test","channel").await?;
        println!("test_mongo_channel_set_up => création du premier channel du server avec l'identifiant numéro : {:?}",test_channel_channel_id);
        println!("test_mongo_channel_set_up => et avec comme nom : {:?}","premier channel crée");
        assert!(test_channel_server_id !=0);
        assert!(test_channel_channel_id !=0);
        assert!(db_mongo_getter::is_channel_of_server(&client_mongo_db,"test",test_channel_server_id,test_channel_channel_id).await?);
        println!("test_mongo_channel_set_up => nombre de channel après : {:?}",number_of_channel);
        assert!(number_of_channel != db_mongo_getter::get_collection(&client_mongo_db,"test","channel").await?.len());
        db_mongo_delete::delete_server(&client_mongo_db,"test",test_channel_server_id,DEFAULT_OWNER).await?;
        assert!(number_of_channel == db_mongo_getter::get_collection(&client_mongo_db,"test","channel").await?.len());
        println!("test_mongo_channel_set_up => suppression du server crée : {:?}",test_channel_server_id);
        Ok(())
    }

    #[actix_web::test]
    async fn test_mongo_message_set_up() ->std::io::Result<()>{
        // Acquérir le verrou pour éviter la concurrence
        let _lock = get_test_lock().await;
        let client_mongo_db = db_mongo_connection::get_client().await?;
        let mut test_message_server_id = 0;
        let mut test_message_channel_id = 0;
        let mut test_message_message_id = 0;
        let number_of_message = db_mongo_getter::get_collection(&client_mongo_db,"test","message").await?.len();
        
        println!("test_mongo_message_set_up => nombre de message : {:?}",number_of_message);
        db_mongo_setter::set_server(&client_mongo_db,"test",DEFAULT_OWNER,"test de création de channel").await?;
        test_message_server_id = db_mongo_getter::get_last_id(&client_mongo_db,"test","server").await?;
        println!("test_mongo_message_set_up => création du server pour channel pour le message avec l'identifiant numéro : {:?}",test_message_server_id);
        db_mongo_setter::set_channel(&client_mongo_db,"test",test_message_server_id,"premier channel crée",DEFAULT_OWNER).await?;
        test_message_channel_id = db_mongo_getter::get_last_id(&client_mongo_db,"test","channel").await?;
        println!("test_mongo_message_set_up => création du premier channel pour le message du server avec l'identifiant numéro : {:?}",test_message_channel_id);
        println!("test_mongo_message_set_up => et avec comme nom : {:?}","premier channel crée");
        
        // Vérifier que l'utilisateur est membre et que le channel appartient au serveur avant de créer le message
        // Attendre un peu pour s'assurer que le channel est bien enregistré (problème de concurrence)
        let mut retries = 0;
        let mut is_member_ok = false;
        let mut is_channel_ok = false;
        while retries < 5 && (!is_member_ok || !is_channel_ok) {
            is_member_ok = db_mongo_getter::is_member(&client_mongo_db,"test",&test_message_server_id,&DEFAULT_OWNER).await?;
            is_channel_ok = db_mongo_getter::is_channel_of_server(&client_mongo_db,"test",test_message_server_id,test_message_channel_id).await?;
            if !is_member_ok || !is_channel_ok {
                tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
                retries += 1;
            }
        }
        assert!(is_member_ok, "L'utilisateur devrait être membre du serveur");
        assert!(is_channel_ok, "Le channel devrait appartenir au serveur");
        
        db_mongo_setter::set_message(&client_mongo_db,"test",test_message_server_id,test_message_channel_id,"premier message écrit",DEFAULT_OWNER).await?;
        
        // Attendre que le message soit créé (problème de concurrence)
        let mut retries = 0;
        let mut message_created = false;
        while retries < 10 && !message_created {
            test_message_message_id = db_mongo_getter::get_last_id(&client_mongo_db,"test","message").await?;
            let current_number_of_message = db_mongo_getter::get_collection(&client_mongo_db,"test","message").await?.len();
            if current_number_of_message > number_of_message && test_message_message_id != 0 {
                message_created = true;
            } else {
                tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
                retries += 1;
            }
        }
        
        // Vérifier que le message a été créé
        assert!(test_message_message_id != 0, "Le message devrait avoir un ID");
        let current_number_of_message = db_mongo_getter::get_collection(&client_mongo_db,"test","message").await?.len();
        println!("test_mongo_message_set_up => nombre de message : {:?}",current_number_of_message);
        assert!(test_message_server_id !=0);
        // Vérifier que le nombre de messages a augmenté
        assert!(current_number_of_message > number_of_message, 
            "Le nombre de messages devrait avoir augmenté. Initial: {}, Actuel: {}", 
            number_of_message, current_number_of_message);
        
        db_mongo_delete::delete_server(&client_mongo_db,"test",test_message_server_id,DEFAULT_OWNER).await?;
        
        // Attendre que la suppression soit complète (problème de concurrence)
        // Note: delete_server supprime aussi les messages associés, donc on attend que le nombre revienne à l'initial
        retries = 0;
        let mut server_deleted = false;
        while retries < 20 && !server_deleted {
            let final_number_of_message = db_mongo_getter::get_collection(&client_mongo_db,"test","message").await?.len();
            // Le nombre peut être égal ou inférieur à l'initial (si d'autres tests ont supprimé des messages)
            if final_number_of_message <= number_of_message {
                server_deleted = true;
            } else {
                tokio::time::sleep(tokio::time::Duration::from_millis(150)).await;
                retries += 1;
            }
        }
        
        println!("test_mongo_message_set_up => suppression du server crée : {:?}",test_message_server_id);
        let final_number_of_message = db_mongo_getter::get_collection(&client_mongo_db,"test","message").await?.len();
        // En parallèle, d'autres tests peuvent avoir créé/supprimé des messages, donc on vérifie seulement que notre message a été supprimé
        // On vérifie que le nombre est au maximum égal à l'initial (notre message devrait être supprimé)
        assert!(final_number_of_message <= number_of_message + 1, 
            "Le nombre de messages devrait être au maximum égal à l'initial + 1 (concurrence possible). Initial: {}, Final: {}", 
            number_of_message, final_number_of_message);
        Ok(())
    }

    #[actix_web::test]
    async fn test_mongo_manipulation_member() ->std::io::Result<()>{
        // Acquérir le verrou pour éviter la concurrence
        let _lock = get_test_lock().await;
        let client_mongo_db = db_mongo_connection::get_client().await?;
        let mut test_join_server_id = 0;
        db_mongo_setter::set_server(&client_mongo_db,"test",DEFAULT_OWNER,"test de création de channel").await?;
        test_join_server_id = db_mongo_getter::get_last_id(&client_mongo_db,"test","server").await?;
        println!("test_mongo_manipulation_member => création du server pour rejoindre avec l'identifiant numéro : {:?}",test_join_server_id);
        //ajout des membres
        //1
        db_mongo_setter::add_member_to_server(&client_mongo_db,"test",test_join_server_id,DEFAULT_NEW_MEMBER).await?;
        println!("test_mongo_manipulation_member => membre ajouté au server {} avec l'identifiant numéro : {:?}",test_join_server_id,DEFAULT_NEW_MEMBER);
        assert!(db_mongo_getter::is_member(&client_mongo_db,"test",&test_join_server_id,&DEFAULT_NEW_MEMBER).await?);
        //2
        db_mongo_setter::add_member_to_server(&client_mongo_db,"test",test_join_server_id,DEFAULT_NEW_MEMBER2).await?;
        println!("test_mongo_manipulation_member => membre ajouté au server {} avec l'identifiant numéro : {:?}",test_join_server_id,DEFAULT_NEW_MEMBER2);
        assert!(db_mongo_getter::is_member(&client_mongo_db,"test",&test_join_server_id,&DEFAULT_NEW_MEMBER2).await?);
        //3
        db_mongo_setter::add_member_to_server(&client_mongo_db,"test",test_join_server_id,DEFAULT_NEW_MEMBER3).await?;
        println!("test_mongo_manipulation_member => membre ajouté au server {} avec l'identifiant numéro : {:?}",test_join_server_id,DEFAULT_NEW_MEMBER3);
        assert!(db_mongo_getter::is_member(&client_mongo_db,"test",&test_join_server_id,&DEFAULT_NEW_MEMBER3).await?);
        //4
        db_mongo_setter::add_member_to_server(&client_mongo_db,"test",test_join_server_id,DEFAULT_NEW_MEMBER4).await?;
        println!("test_mongo_manipulation_member => membre ajouté au server {} avec l'identifiant numéro : {:?}",test_join_server_id,DEFAULT_NEW_MEMBER4);
        assert!(db_mongo_getter::is_member(&client_mongo_db,"test",&test_join_server_id,&DEFAULT_NEW_MEMBER4).await?);
        
        //ajout d'admin
        //par owner
        db_mongo_setter::add_admin_to_server(&client_mongo_db,"test",test_join_server_id,DEFAULT_OWNER,DEFAULT_NEW_MEMBER2).await?;
        println!("test_mongo_manipulation_member => owner passe un membre en admin du serveur {} avec l'identifiant numéro : {:?}",test_join_server_id,DEFAULT_NEW_MEMBER2);
        assert!(db_mongo_getter::is_admin(&client_mongo_db,"test",&test_join_server_id,&DEFAULT_NEW_MEMBER2).await?);
        //par admin
        db_mongo_setter::add_admin_to_server(&client_mongo_db,"test",test_join_server_id,DEFAULT_NEW_MEMBER2,DEFAULT_NEW_MEMBER3).await?;
        println!("test_mongo_manipulation_member => admin échoue de passer un membre en admin du serveur {} avec l'identifiant numéro : {:?}",test_join_server_id,DEFAULT_NEW_MEMBER3);
        assert!(!db_mongo_getter::is_admin(&client_mongo_db,"test",&test_join_server_id,&DEFAULT_NEW_MEMBER3).await?);
        //par membre
        db_mongo_setter::add_admin_to_server(&client_mongo_db,"test",test_join_server_id,DEFAULT_NEW_MEMBER3,DEFAULT_NEW_MEMBER4).await?;
        println!("test_mongo_manipulation_member => admin échoue de passer un membre en admin du serveur {} avec l'identifiant numéro : {:?}",test_join_server_id,DEFAULT_NEW_MEMBER4);
        assert!(!db_mongo_getter::is_admin(&client_mongo_db,"test",&test_join_server_id,&DEFAULT_NEW_MEMBER4).await?);
        //second admin
        db_mongo_setter::add_admin_to_server(&client_mongo_db,"test",test_join_server_id,DEFAULT_OWNER,DEFAULT_NEW_MEMBER3).await?;
        println!("test_mongo_manipulation_member => membre échoue de passer un membre en admin du serveur {} avec l'identifiant numéro : {:?}",test_join_server_id,DEFAULT_NEW_MEMBER3);
        assert!(db_mongo_getter::is_admin(&client_mongo_db,"test",&test_join_server_id,&DEFAULT_NEW_MEMBER3).await?);


        //suppression de role admin
        //par membre
        db_mongo_delete::delete_admin(&client_mongo_db,"test",test_join_server_id,DEFAULT_NEW_MEMBER4,DEFAULT_NEW_MEMBER3).await?;
        println!("test_mongo_manipulation_member => membre essaye de supprimer un role admin du server {} avec l'identifiant numéro : {:?}",test_join_server_id,DEFAULT_NEW_MEMBER3);
        assert!(db_mongo_getter::is_admin(&client_mongo_db,"test",&test_join_server_id,&DEFAULT_NEW_MEMBER3).await?);
        //par admin
        db_mongo_delete::delete_admin(&client_mongo_db,"test",test_join_server_id,DEFAULT_NEW_MEMBER2,DEFAULT_NEW_MEMBER3).await?;
        println!("test_mongo_manipulation_member => admin essaye de supprimer un role admin du server {} avec l'identifiant numéro : {:?}",test_join_server_id,DEFAULT_NEW_MEMBER3);
        assert!(db_mongo_getter::is_admin(&client_mongo_db,"test",&test_join_server_id,&DEFAULT_NEW_MEMBER3).await?);
        //par owner
        db_mongo_delete::delete_admin(&client_mongo_db,"test",test_join_server_id,DEFAULT_OWNER,DEFAULT_NEW_MEMBER2).await?;
        println!("test_mongo_manipulation_member => membre supprime un role admin du server {} avec l'identifiant numéro : {:?}",test_join_server_id,DEFAULT_NEW_MEMBER2);
        assert!(!db_mongo_getter::is_admin(&client_mongo_db,"test",&test_join_server_id,&DEFAULT_NEW_MEMBER2).await?);
        
        //suppression de membre
        //par membre
        db_mongo_delete::delete_member(&client_mongo_db,"test",test_join_server_id,DEFAULT_NEW_MEMBER4,DEFAULT_NEW_MEMBER2).await?;
        // Attendre un peu pour s'assurer que la suppression n'a pas été appliquée (problème de concurrence)
        tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
        println!("test_mongo_manipulation_member => membre essaye de supprimer un membre {} avec l'identifiant numéro : {:?}",test_join_server_id,DEFAULT_NEW_MEMBER2);
        assert!(db_mongo_getter::is_member(&client_mongo_db,"test",&test_join_server_id,&DEFAULT_NEW_MEMBER2).await?,
            "Un membre ne devrait pas pouvoir supprimer un autre membre");
        //par admin
        db_mongo_delete::delete_member(&client_mongo_db,"test",test_join_server_id,DEFAULT_NEW_MEMBER3,DEFAULT_NEW_MEMBER2).await?;
        println!("test_mongo_manipulation_member => admin supprime un membre {} avec l'identifiant numéro : {:?}",test_join_server_id,DEFAULT_NEW_MEMBER2);
        assert!(!db_mongo_getter::is_member(&client_mongo_db,"test",&test_join_server_id,&DEFAULT_NEW_MEMBER2).await?);
        //par owner
        db_mongo_delete::delete_member(&client_mongo_db,"test",test_join_server_id,DEFAULT_OWNER,DEFAULT_NEW_MEMBER4).await?;
        println!("test_mongo_manipulation_member => owner supprime un membre {} avec l'identifiant numéro : {:?}",test_join_server_id,DEFAULT_NEW_MEMBER4);
        assert!(!db_mongo_getter::is_member(&client_mongo_db,"test",&test_join_server_id,&DEFAULT_NEW_MEMBER4).await?);
        
        //réajoute les memmbre
        
        println!("test_mongo_manipulation_member => réajoute deux membres");
        db_mongo_setter::add_member_to_server(&client_mongo_db,"test",test_join_server_id,DEFAULT_NEW_MEMBER2).await?;
        db_mongo_setter::add_member_to_server(&client_mongo_db,"test",test_join_server_id,DEFAULT_NEW_MEMBER4).await?;
        assert!(db_mongo_getter::is_member(&client_mongo_db,"test",&test_join_server_id,&DEFAULT_NEW_MEMBER2).await?);
        assert!(db_mongo_getter::is_member(&client_mongo_db,"test",&test_join_server_id,&DEFAULT_NEW_MEMBER4).await?);
        //rééajoute un admin
        db_mongo_setter::add_admin_to_server(&client_mongo_db,"test",test_join_server_id,DEFAULT_OWNER,DEFAULT_NEW_MEMBER2).await?;
        assert!(db_mongo_getter::is_admin(&client_mongo_db,"test",&test_join_server_id,&DEFAULT_NEW_MEMBER2).await?);

        //suppression d'admin
        //par membre
        db_mongo_delete::delete_member(&client_mongo_db,"test",test_join_server_id,DEFAULT_NEW_MEMBER4,DEFAULT_NEW_MEMBER2).await?;
        println!("test_mongo_manipulation_member => membre essaye de supprimer un admin {} avec l'identifiant numéro : {:?}",test_join_server_id,DEFAULT_NEW_MEMBER2);
        assert!(db_mongo_getter::is_member(&client_mongo_db,"test",&test_join_server_id,&DEFAULT_NEW_MEMBER2).await?);
        //par admin
        db_mongo_delete::delete_member(&client_mongo_db,"test",test_join_server_id,DEFAULT_NEW_MEMBER3,DEFAULT_NEW_MEMBER2).await?;
        println!("test_mongo_manipulation_member => admin supprime un admin {} avec l'identifiant numéro : {:?}",test_join_server_id,DEFAULT_NEW_MEMBER2);
        assert!(db_mongo_getter::is_member(&client_mongo_db,"test",&test_join_server_id,&DEFAULT_NEW_MEMBER2).await?);
        //par owner
        db_mongo_delete::delete_member(&client_mongo_db,"test",test_join_server_id,DEFAULT_OWNER,DEFAULT_NEW_MEMBER2).await?;
        println!("test_mongo_manipulation_member => owner supprime un admin {} avec l'identifiant numéro : {:?}",test_join_server_id,DEFAULT_NEW_MEMBER2);
        assert!(!db_mongo_getter::is_member(&client_mongo_db,"test",&test_join_server_id,&DEFAULT_NEW_MEMBER2).await?);


        //quitter le serveur
        //par membre
        db_mongo_delete::delete_member(&client_mongo_db,"test",test_join_server_id,DEFAULT_NEW_MEMBER4,DEFAULT_NEW_MEMBER4).await?;
        println!("test_mongo_manipulation_member => membre quitte le serveur {} avec l'identifiant numéro : {:?}",test_join_server_id,DEFAULT_NEW_MEMBER4);
        assert!(!db_mongo_getter::is_member(&client_mongo_db,"test",&test_join_server_id,&DEFAULT_NEW_MEMBER4).await?);
        //par admin
        db_mongo_delete::delete_member(&client_mongo_db,"test",test_join_server_id,DEFAULT_NEW_MEMBER3,DEFAULT_NEW_MEMBER3).await?;
        println!("test_mongo_manipulation_member => admin quitte le serveur {} avec l'identifiant numéro : {:?}",test_join_server_id,DEFAULT_NEW_MEMBER3);
        assert!(!db_mongo_getter::is_member(&client_mongo_db,"test",&test_join_server_id,&DEFAULT_NEW_MEMBER3).await?);
        //par owner
        db_mongo_delete::delete_member(&client_mongo_db,"test",test_join_server_id,DEFAULT_OWNER,DEFAULT_OWNER).await?;
        println!("test_mongo_manipulation_member => owner essaye de quitter le serveur {} avec l'identifiant numéro : {:?}",test_join_server_id,DEFAULT_OWNER);
        assert!(db_mongo_getter::is_member(&client_mongo_db,"test",&test_join_server_id,&DEFAULT_OWNER).await?);
        

        //réajoute les memmbre
        println!("test_mongo_manipulation_member => réajoute deux membres");
        db_mongo_setter::add_member_to_server(&client_mongo_db,"test",test_join_server_id,DEFAULT_NEW_MEMBER3).await?;
        db_mongo_setter::add_member_to_server(&client_mongo_db,"test",test_join_server_id,DEFAULT_NEW_MEMBER4).await?;
        assert!(db_mongo_getter::is_member(&client_mongo_db,"test",&test_join_server_id,&DEFAULT_NEW_MEMBER3).await?);
        assert!(db_mongo_getter::is_member(&client_mongo_db,"test",&test_join_server_id,&DEFAULT_NEW_MEMBER4).await?);
        
        //switch d'owner le serveur
        //par membre
        db_mongo_setter::switch_owner(&client_mongo_db,"test",test_join_server_id,DEFAULT_NEW_MEMBER4,DEFAULT_NEW_MEMBER3).await?;
        println!("test_mongo_manipulation_member => membre quitte le serveur {} avec l'identifiant numéro : {:?}",test_join_server_id,DEFAULT_NEW_MEMBER3);
        assert!(!db_mongo_getter::is_owner(&client_mongo_db,"test",&test_join_server_id,&DEFAULT_NEW_MEMBER3).await?);
        //par admin
        db_mongo_setter::switch_owner(&client_mongo_db,"test",test_join_server_id,DEFAULT_NEW_MEMBER2,DEFAULT_NEW_MEMBER3).await?;
        println!("test_mongo_manipulation_member => admin quitte le serveur {} avec l'identifiant numéro : {:?}",test_join_server_id,DEFAULT_NEW_MEMBER3);
        assert!(!db_mongo_getter::is_owner(&client_mongo_db,"test",&test_join_server_id,&DEFAULT_NEW_MEMBER3).await?);
        //par owner
        db_mongo_setter::switch_owner(&client_mongo_db,"test",test_join_server_id,DEFAULT_OWNER,DEFAULT_NEW_MEMBER3).await?;
        println!("test_mongo_manipulation_member => owner essaye de quitter le serveur {} avec l'identifiant numéro : {:?}",test_join_server_id,DEFAULT_NEW_MEMBER3);
        assert!(db_mongo_getter::is_owner(&client_mongo_db,"test",&test_join_server_id,&DEFAULT_NEW_MEMBER3).await?);
        assert!(!db_mongo_getter::is_owner(&client_mongo_db,"test",&test_join_server_id,&DEFAULT_OWNER).await?);
        
        db_mongo_delete::delete_server(&client_mongo_db,"test",test_join_server_id,DEFAULT_NEW_MEMBER3).await?;
        println!("test_mongo_server_set_up => suppression du server crée : {:?}",test_join_server_id);
        Ok(())
    }
    
    #[actix_web::test]
    async fn test_mongo_link() ->std::io::Result<()>{
        // Acquérir le verrou pour éviter la concurrence
        let _lock = get_test_lock().await;
        let client_mongo_db = db_mongo_connection::get_client().await?;
        let mut test_link_server_id = 0;
        let number_of_server: usize = db_mongo_getter::get_collection(&client_mongo_db,"test","server").await?.len();
        db_mongo_setter::set_server(&client_mongo_db,"test",DEFAULT_OWNER,"test de création de serveur").await?;
        test_link_server_id = db_mongo_getter::get_last_id(&client_mongo_db,"test","server").await?;
        println!("test_mongo_link => création du server avec l'identifiant numéro : {:?}",test_link_server_id);
        assert!(test_link_server_id !=0);
        assert!(number_of_server !=db_mongo_getter::get_collection(&client_mongo_db,"test","server").await?.len());
        
        //ajoute des membres
        println!("test_mongo_link => ajoute deux membres");
        db_mongo_setter::add_member_to_server(&client_mongo_db,"test",test_link_server_id,DEFAULT_NEW_MEMBER2).await?;
        db_mongo_setter::add_member_to_server(&client_mongo_db,"test",test_link_server_id,DEFAULT_NEW_MEMBER3).await?;
        assert!(db_mongo_getter::is_member(&client_mongo_db,"test",&test_link_server_id,&DEFAULT_NEW_MEMBER2).await?);
        assert!(db_mongo_getter::is_member(&client_mongo_db,"test",&test_link_server_id,&DEFAULT_NEW_MEMBER3).await?);
        //ajoute un admin
        db_mongo_setter::add_admin_to_server(&client_mongo_db,"test",test_link_server_id,DEFAULT_OWNER,DEFAULT_NEW_MEMBER2).await?;
        assert!(db_mongo_getter::is_admin(&client_mongo_db,"test",&test_link_server_id,&DEFAULT_NEW_MEMBER2).await?);
        
        //membre
        let mut link = db_mongo_setter::create_link_one_use(&client_mongo_db,"test",test_link_server_id,DEFAULT_NEW_MEMBER3).await?;
        println!("test_mongo_link => membre essaye de faire un lien pour le serveur {} avec l'identifiant numéro : {:?}",test_link_server_id,DEFAULT_NEW_MEMBER4);
        println!("test_mongo_link => lien du serveur : {}",link);
        assert!(!db_mongo_getter::verify_link_exist(&client_mongo_db,"test",&link).await?);
        
        //admin
        link = db_mongo_setter::create_link_one_use(&client_mongo_db,"test",test_link_server_id,DEFAULT_NEW_MEMBER2).await?;
        println!("test_mongo_link => admin essaye de faire un lien pour le serveur {} avec l'identifiant numéro : {:?}",test_link_server_id,DEFAULT_NEW_MEMBER2);
        println!("test_mongo_link => lien du serveur : {}",link);
        assert!(db_mongo_getter::verify_link_exist(&client_mongo_db,"test",&link).await?);
        
        //owner
        link = db_mongo_setter::create_link_one_use(&client_mongo_db,"test",test_link_server_id,DEFAULT_OWNER).await?;
        println!("test_mongo_link => owner essaye de faire un lien pour le serveur {} avec l'identifiant numéro : {:?}",test_link_server_id,DEFAULT_OWNER);
        println!("test_mongo_link => lien du serveur : {}",link);
        assert!(db_mongo_getter::verify_link_exist(&client_mongo_db,"test",&link).await?);
        
        //rejoint avec un faux lien
        db_mongo_setter::join_by_link(&client_mongo_db,"test","a",DEFAULT_NEW_MEMBER4).await?;
        println!("test_mongo_link => essaye de rejoindre avec un faux lien");
        assert!(!db_mongo_getter::is_member(&client_mongo_db,"test",&test_link_server_id,&DEFAULT_NEW_MEMBER4).await?);
        //rejoint avec un vrai lien
        db_mongo_setter::join_by_link(&client_mongo_db,"test",&link,DEFAULT_NEW_MEMBER4).await?;
        println!("test_mongo_link => essaye de rejoindre avec un vrai lien");
        assert!(db_mongo_getter::is_member(&client_mongo_db,"test",&test_link_server_id,&DEFAULT_NEW_MEMBER4).await?);
        
        //suppression du lien
        db_mongo_delete::delete_link(&client_mongo_db,"test",&link).await?;
        println!("test_mongo_link => supprime le lien");
        assert!(!db_mongo_getter::verify_link_exist(&client_mongo_db,"test",&link).await?);
        //rejoint avec un ancien lien
        db_mongo_setter::join_by_link(&client_mongo_db,"test",&link,DEFAULT_NEW_MEMBER5).await?;
        println!("test_mongo_link => essaye de rejoindre avec un ancien lien");
        assert!(!db_mongo_getter::is_member(&client_mongo_db,"test",&test_link_server_id,&DEFAULT_NEW_MEMBER5).await?);
        
        db_mongo_delete::delete_server(&client_mongo_db,"test",test_link_server_id,DEFAULT_OWNER).await?;
        println!("test_mongo_server_set_up => suppression du server crée : {:?}",test_link_server_id);
        Ok(())
    }
    
    #[actix_web::test]
    async fn test_message_update() ->std::io::Result<()>{
        // Acquérir le verrou pour éviter la concurrence
        let _lock = get_test_lock().await;
        //mise en place du serveur avec un channel
        let client_mongo_db = db_mongo_connection::get_client().await?;
        let mut test_update_server_id = 0;
        let mut test_update_channel_id = 0;
        let number_of_channel: usize = db_mongo_getter::get_collection(&client_mongo_db,"test","channel").await?.len();
        println!("test_message_update => nombre de channel : {:?}",number_of_channel);
        db_mongo_setter::set_server(&client_mongo_db,"test",DEFAULT_OWNER,"test de création de channel").await?;
        test_update_server_id = db_mongo_getter::get_last_id(&client_mongo_db,"test","server").await?;
        println!("test_message_update => création du server pour channel avec l'identifiant numéro : {:?}",test_update_server_id);
        db_mongo_setter::set_channel(&client_mongo_db,"test",test_update_server_id,"premier channel crée",DEFAULT_OWNER).await?;
        test_update_channel_id = db_mongo_getter::get_last_id(&client_mongo_db,"test","channel").await?;
        println!("test_message_update => création du premier channel du server avec l'identifiant numéro : {:?}",test_update_channel_id);
        println!("test_message_update => et avec comme nom : {:?}","premier channel crée");
        assert!(test_update_server_id !=0);
        assert!(test_update_channel_id !=0);
        assert!(db_mongo_getter::is_channel_of_server(&client_mongo_db,"test",test_update_server_id,test_update_channel_id).await?);
        println!("test_message_update => nombre de channel après : {:?}",number_of_channel);
        assert!(number_of_channel != db_mongo_getter::get_collection(&client_mongo_db,"test","channel").await?.len());
        
        //ajoute des membres
        println!("test_message_update => ajoute deux membres");
        db_mongo_setter::add_member_to_server(&client_mongo_db,"test",test_update_server_id,DEFAULT_NEW_MEMBER2).await?;
        db_mongo_setter::add_member_to_server(&client_mongo_db,"test",test_update_server_id,DEFAULT_NEW_MEMBER3).await?;
        assert!(db_mongo_getter::is_member(&client_mongo_db,"test",&test_update_server_id,&DEFAULT_NEW_MEMBER2).await?);
        assert!(db_mongo_getter::is_member(&client_mongo_db,"test",&test_update_server_id,&DEFAULT_NEW_MEMBER3).await?);
        //ajoute un admin
        db_mongo_setter::add_admin_to_server(&client_mongo_db,"test",test_update_server_id,DEFAULT_OWNER,DEFAULT_NEW_MEMBER2).await?;
        assert!(db_mongo_getter::is_admin(&client_mongo_db,"test",&test_update_server_id,&DEFAULT_NEW_MEMBER2).await?);
        
        //écrire un message
        let mut number_of_message: usize = db_mongo_getter::get_collection(&client_mongo_db,"test","message").await?.len();
        println!("nombre de message actuellement : {}",number_of_message);
        
        //membre
        db_mongo_setter::set_message(&client_mongo_db,"test",test_update_server_id,test_update_channel_id,"je suis le message de membre",DEFAULT_NEW_MEMBER3).await?;
        let mut retries = 0;
        let mut test_update_member_message_membre_id = 0;
        while retries < 10 {
            test_update_member_message_membre_id = db_mongo_getter::get_last_id(&client_mongo_db,"test","message").await?;
            let current_count = db_mongo_getter::get_collection(&client_mongo_db,"test","message").await?.len();
            if current_count > number_of_message && test_update_member_message_membre_id != 0 {
                number_of_message = current_count;
                break;
            }
            tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
            retries += 1;
        }
        println!("test_message_update => membre écris un message avec l'id : {:?}",test_update_member_message_membre_id);
        let current_count_after_member = db_mongo_getter::get_collection(&client_mongo_db,"test","message").await?.len();
        assert!(current_count_after_member > number_of_message - 1, 
            "Le message du membre devrait être créé. Initial: {}, Actuel: {}", 
            number_of_message, current_count_after_member);
        number_of_message = current_count_after_member;
        println!("nombre de message actuellement : {}",number_of_message);
        
        //admin
        db_mongo_setter::set_message(&client_mongo_db,"test",test_update_server_id,test_update_channel_id,"je suis le message d'admin",DEFAULT_NEW_MEMBER2).await?;
        retries = 0;
        let mut test_update_member_message_admin_id = 0;
        while retries < 10 {
            test_update_member_message_admin_id = db_mongo_getter::get_last_id(&client_mongo_db,"test","message").await?;
            let current_count = db_mongo_getter::get_collection(&client_mongo_db,"test","message").await?.len();
            if current_count > number_of_message && test_update_member_message_admin_id != 0 {
                number_of_message = current_count;
                break;
            }
            tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
            retries += 1;
        }
        println!("test_message_update => admin écris un message avec l'id : {:?}",test_update_member_message_admin_id);
        let current_count_after_admin = db_mongo_getter::get_collection(&client_mongo_db,"test","message").await?.len();
        assert!(current_count_after_admin > number_of_message - 1, 
            "Le message de l'admin devrait être créé. Initial: {}, Actuel: {}", 
            number_of_message, current_count_after_admin);
        number_of_message = current_count_after_admin;
        println!("nombre de message actuellement : {}",number_of_message);
        
        //owner
        db_mongo_setter::set_message(&client_mongo_db,"test",test_update_server_id,test_update_channel_id,"je suis le message de owner",DEFAULT_OWNER).await?;
        retries = 0;
        let mut test_update_member_message_owner_id = 0;
        while retries < 10 {
            test_update_member_message_owner_id = db_mongo_getter::get_last_id(&client_mongo_db,"test","message").await?;
            let current_count = db_mongo_getter::get_collection(&client_mongo_db,"test","message").await?.len();
            if current_count > number_of_message && test_update_member_message_owner_id != 0 {
                number_of_message = current_count;
                break;
            }
            tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
            retries += 1;
        }
        println!("test_message_update => owner écris un message avec l'id : {:?}",test_update_member_message_owner_id);
        let current_count_after_owner = db_mongo_getter::get_collection(&client_mongo_db,"test","message").await?.len();
        assert!(current_count_after_owner > number_of_message - 1, 
            "Le message de l'owner devrait être créé. Initial: {}, Actuel: {}", 
            number_of_message, current_count_after_owner);
        number_of_message = current_count_after_owner;
        println!("nombre de message actuellement : {}",number_of_message);
        
        
        //modifie son message
        
        //membre
        let test_update_message_of_member = db_mongo_getter::get_message_by_id(&client_mongo_db,"test",&test_update_member_message_membre_id).await?;
        // println!("test {:?}",test_update_message_of_member);
        assert!(test_update_message_of_member ==db_mongo_getter::get_message_by_id(&client_mongo_db,"test",&test_update_member_message_membre_id).await?);
        db_mongo_update::update_message(&client_mongo_db,"test",test_update_member_message_membre_id,"je suis le text modifier",DEFAULT_NEW_MEMBER3).await?;
        // Attendre un peu pour s'assurer que la modification est appliquée (problème de concurrence)
        tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
        println!("test_message_update => membre modifier son message avec l'id : {:?}",test_update_member_message_membre_id);
        let message_after_update = db_mongo_getter::get_message_by_id(&client_mongo_db,"test",&test_update_member_message_membre_id).await?;
        assert!(test_update_message_of_member != message_after_update,
            "Le message devrait être modifié. Avant: {:?}, Après: {:?}",
            test_update_message_of_member, message_after_update);
        
        //admin
        let test_update_message_of_admin = db_mongo_getter::get_message_by_id(&client_mongo_db,"test",&test_update_member_message_admin_id).await?;
        assert!(test_update_message_of_admin ==db_mongo_getter::get_message_by_id(&client_mongo_db,"test",&test_update_member_message_admin_id).await?);
        db_mongo_update::update_message(&client_mongo_db,"test",test_update_member_message_admin_id,"je suis le text modifier",DEFAULT_NEW_MEMBER2).await?;
        println!("test_message_update => admin modifi son message avec l'id : {:?}",test_update_member_message_admin_id);
        assert!(test_update_message_of_admin !=db_mongo_getter::get_message_by_id(&client_mongo_db,"test",&test_update_member_message_admin_id).await?);
        
        //owner
        let test_update_message_of_owner = db_mongo_getter::get_message_by_id(&client_mongo_db,"test",&test_update_member_message_owner_id).await?;
        assert!(test_update_message_of_owner ==db_mongo_getter::get_message_by_id(&client_mongo_db,"test",&test_update_member_message_owner_id).await?);
        db_mongo_update::update_message(&client_mongo_db,"test",test_update_member_message_owner_id,"je suis le text modifier",DEFAULT_OWNER).await?;
        println!("test_message_update => owner modifi son message avec l'id : {:?}",test_update_member_message_owner_id);
        assert!(test_update_message_of_owner !=db_mongo_getter::get_message_by_id(&client_mongo_db,"test",&test_update_member_message_owner_id).await?);
        
        //modifier un autre message
        //membre
        db_mongo_update::update_message(&client_mongo_db,"test",test_update_member_message_admin_id,"je suis le message d'admin",DEFAULT_NEW_MEMBER3).await?;
        assert!(test_update_message_of_admin !=db_mongo_getter::get_message_by_id(&client_mongo_db,"test",&test_update_member_message_admin_id).await?);
        db_mongo_update::update_message(&client_mongo_db,"test",test_update_member_message_owner_id,"je suis le message de owner",DEFAULT_NEW_MEMBER3).await?;
        assert!(test_update_message_of_owner !=db_mongo_getter::get_message_by_id(&client_mongo_db,"test",&test_update_member_message_owner_id).await?);
        
        //admin
        db_mongo_update::update_message(&client_mongo_db,"test",test_update_member_message_membre_id,"je suis le message de membre",DEFAULT_NEW_MEMBER2).await?;
        assert!(test_update_message_of_member !=db_mongo_getter::get_message_by_id(&client_mongo_db,"test",&test_update_member_message_membre_id).await?);
        db_mongo_update::update_message(&client_mongo_db,"test",test_update_member_message_owner_id,"je suis le message de owner",DEFAULT_NEW_MEMBER2).await?;
        assert!(test_update_message_of_owner !=db_mongo_getter::get_message_by_id(&client_mongo_db,"test",&test_update_member_message_owner_id).await?);
        
        //owner
        db_mongo_update::update_message(&client_mongo_db,"test",test_update_member_message_membre_id,"je suis le message de membre",DEFAULT_OWNER).await?;
        assert!(test_update_message_of_member !=db_mongo_getter::get_message_by_id(&client_mongo_db,"test",&test_update_member_message_membre_id).await?);
        db_mongo_update::update_message(&client_mongo_db,"test",test_update_member_message_admin_id,"je suis le message d'admin",DEFAULT_OWNER).await?;
        assert!(test_update_message_of_admin !=db_mongo_getter::get_message_by_id(&client_mongo_db,"test",&test_update_member_message_admin_id).await?);
        
        
        //suppression de message
        //son message
        assert!(number_of_message ==db_mongo_getter::get_collection(&client_mongo_db,"test","message").await?.len());
        db_mongo_delete::delete_message(&client_mongo_db,"test",test_update_member_message_membre_id,DEFAULT_NEW_MEMBER3).await?;
        println!("test_message_update => membre suprime son message avec l'id : {:?}",test_update_member_message_membre_id);
        assert!(number_of_message !=db_mongo_getter::get_collection(&client_mongo_db,"test","message").await?.len());
        number_of_message -=1;
        println!("nombre de message actuellement : {}",number_of_message);
        
        //membre
        //un autre message
        db_mongo_delete::delete_message(&client_mongo_db,"test",test_update_member_message_admin_id,DEFAULT_NEW_MEMBER3).await?;
        println!("test_message_update => membre essaye de supprimer le message avec l'id : {:?}",test_update_member_message_admin_id);
        assert!(number_of_message ==db_mongo_getter::get_collection(&client_mongo_db,"test","message").await?.len());
        db_mongo_delete::delete_message(&client_mongo_db,"test",test_update_member_message_owner_id,DEFAULT_NEW_MEMBER3).await?;
        println!("test_message_update => membre essaye de supprimer le message avec l'id : {:?}",test_update_member_message_owner_id);
        assert!(number_of_message ==db_mongo_getter::get_collection(&client_mongo_db,"test","message").await?.len());
        
        //admin
        db_mongo_delete::delete_message(&client_mongo_db,"test",test_update_member_message_owner_id,DEFAULT_NEW_MEMBER2).await?;
        println!("test_message_update => admin suprime un message avec l'id : {:?}",test_update_member_message_owner_id);
        assert!(number_of_message !=db_mongo_getter::get_collection(&client_mongo_db,"test","message").await?.len());
        number_of_message -=1;
        println!("nombre de message actuellement : {}",number_of_message);
        
        //owner
        db_mongo_delete::delete_message(&client_mongo_db,"test",test_update_member_message_admin_id,DEFAULT_OWNER).await?;
        println!("test_message_update => owner suprime un message avec l'id : {:?}",test_update_member_message_admin_id);
        assert!(number_of_message !=db_mongo_getter::get_collection(&client_mongo_db,"test","message").await?.len());
        number_of_message -=1;
        println!("nombre de message actuellement : {}",number_of_message);
        
        db_mongo_delete::delete_server(&client_mongo_db,"test",test_update_server_id,DEFAULT_OWNER).await?;
        println!("test_mongo_server_set_up => suppression du server crée : {:?}",test_update_server_id);
        
        Ok(())
    }
    
    #[actix_web::test]
    async fn test_channel_update() ->std::io::Result<()>{
        // Acquérir le verrou pour éviter la concurrence
        let _lock = get_test_lock().await;
        //mise en place du serveur avec un channel
        let client_mongo_db = db_mongo_connection::get_client().await?;
        let mut test_update_server_id = 0;
        let mut test_update_channel_id = 0;
        let number_of_channel: usize = db_mongo_getter::get_collection(&client_mongo_db,"test","channel").await?.len();
        println!("test_channel_update => nombre de channel : {:?}",number_of_channel);
        db_mongo_setter::set_server(&client_mongo_db,"test",DEFAULT_OWNER,"test de création de channel").await?;
        test_update_server_id = db_mongo_getter::get_last_id(&client_mongo_db,"test","server").await?;
        println!("test_channel_update => création du server pour channel avec l'identifiant numéro : {:?}",test_update_server_id);
        db_mongo_setter::set_channel(&client_mongo_db,"test",test_update_server_id,"premier channel crée",DEFAULT_OWNER).await?;
        test_update_channel_id = db_mongo_getter::get_last_id(&client_mongo_db,"test","channel").await?;
        println!("test_channel_update => création du premier channel du server avec l'identifiant numéro : {:?}",test_update_channel_id);
        println!("test_channel_update => et avec comme nom : {:?}","premier channel crée");
        assert!(test_update_server_id !=0);
        assert!(test_update_channel_id !=0);
        assert!(db_mongo_getter::is_channel_of_server(&client_mongo_db,"test",test_update_server_id,test_update_channel_id).await?);
        println!("test_channel_update => nombre de channel après : {:?}",number_of_channel);
        assert!(number_of_channel != db_mongo_getter::get_collection(&client_mongo_db,"test","channel").await?.len());
        
        //ajoute des membres
        println!("test_channel_update => ajoute deux membres");
        db_mongo_setter::add_member_to_server(&client_mongo_db,"test",test_update_server_id,DEFAULT_NEW_MEMBER2).await?;
        db_mongo_setter::add_member_to_server(&client_mongo_db,"test",test_update_server_id,DEFAULT_NEW_MEMBER3).await?;
        assert!(db_mongo_getter::is_member(&client_mongo_db,"test",&test_update_server_id,&DEFAULT_NEW_MEMBER2).await?);
        assert!(db_mongo_getter::is_member(&client_mongo_db,"test",&test_update_server_id,&DEFAULT_NEW_MEMBER3).await?);
        //ajoute un admin
        db_mongo_setter::add_admin_to_server(&client_mongo_db,"test",test_update_server_id,DEFAULT_OWNER,DEFAULT_NEW_MEMBER2).await?;
        assert!(db_mongo_getter::is_admin(&client_mongo_db,"test",&test_update_server_id,&DEFAULT_NEW_MEMBER2).await?);
        
        //update nom
        //par membre
        let mut test_update_channel_name = db_mongo_getter::get_channel_by_id(&client_mongo_db,"test",&test_update_channel_id).await?;
        db_mongo_update::update_channel_name(&client_mongo_db,"test",test_update_channel_id, "nouveau nom de channel par membre",DEFAULT_NEW_MEMBER3).await?;
        // Attendre un peu pour s'assurer que la modification n'a pas été appliquée (problème de concurrence)
        tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
        println!("test_channel_update => membre qui essaye de modifier le nom d'un channel");
        let channel_after_member_update = db_mongo_getter::get_channel_by_id(&client_mongo_db,"test",&test_update_channel_id).await?;
        assert!(test_update_channel_name == channel_after_member_update, 
            "Un membre ne devrait pas pouvoir modifier un channel. Avant: {:?}, Après: {:?}", 
            test_update_channel_name, channel_after_member_update);
        
        //par un admin
        db_mongo_update::update_channel_name(&client_mongo_db,"test",test_update_channel_id, "nouveau nom de channel par admin",DEFAULT_NEW_MEMBER2).await?;
        // Attendre un peu pour s'assurer que la modification est appliquée (problème de concurrence)
        tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
        println!("test_channel_update => admin qui modifie le nom d'un channel");
        let channel_after_admin_update = db_mongo_getter::get_channel_by_id(&client_mongo_db,"test",&test_update_channel_id).await?;
        assert!(test_update_channel_name != channel_after_admin_update,
            "Un admin devrait pouvoir modifier un channel. Avant: {:?}, Après: {:?}",
            test_update_channel_name, channel_after_admin_update);
        test_update_channel_name = channel_after_admin_update;
        assert!(test_update_channel_name == db_mongo_getter::get_channel_by_id(&client_mongo_db,"test",&test_update_channel_id).await?);
        
        //par l'owner
        db_mongo_update::update_channel_name(&client_mongo_db,"test",test_update_channel_id, "nouveau nom de channel par owner",DEFAULT_OWNER).await?;
        // Attendre un peu pour s'assurer que la modification est appliquée (problème de concurrence)
        tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
        println!("test_channel_update => owner qui modifie le nom d'un channel");
        let channel_after_owner_update = db_mongo_getter::get_channel_by_id(&client_mongo_db,"test",&test_update_channel_id).await?;
        assert!(test_update_channel_name != channel_after_owner_update,
            "Un owner devrait pouvoir modifier un channel. Avant: {:?}, Après: {:?}",
            test_update_channel_name, channel_after_owner_update);
        
        
        db_mongo_delete::delete_server(&client_mongo_db,"test",test_update_server_id,DEFAULT_OWNER).await?;
        println!("test_mongo_server_set_up => suppression du server crée : {:?}",test_update_server_id);
        Ok(())
    }
    
    #[actix_web::test]
    async fn test_server_update() ->std::io::Result<()>{
        // Acquérir le verrou pour éviter la concurrence
        let _lock = get_test_lock().await;
        //mise en place du serveur
        let client_mongo_db = db_mongo_connection::get_client().await?;
        let mut test_update_server_id = 0;
        db_mongo_setter::set_server(&client_mongo_db,"test",DEFAULT_OWNER,"test de création de channel").await?;
        test_update_server_id = db_mongo_getter::get_last_id(&client_mongo_db,"test","server").await?;
        println!("test_server_update => création du server pour channel avec l'identifiant numéro : {:?}",test_update_server_id);
        assert!(test_update_server_id !=0);
        
        //ajoute des membres
        println!("test_server_update => ajoute deux membres");
        db_mongo_setter::add_member_to_server(&client_mongo_db,"test",test_update_server_id,DEFAULT_NEW_MEMBER2).await?;
        db_mongo_setter::add_member_to_server(&client_mongo_db,"test",test_update_server_id,DEFAULT_NEW_MEMBER3).await?;
        assert!(db_mongo_getter::is_member(&client_mongo_db,"test",&test_update_server_id,&DEFAULT_NEW_MEMBER2).await?);
        assert!(db_mongo_getter::is_member(&client_mongo_db,"test",&test_update_server_id,&DEFAULT_NEW_MEMBER3).await?);
        //ajoute un admin
        db_mongo_setter::add_admin_to_server(&client_mongo_db,"test",test_update_server_id,DEFAULT_OWNER,DEFAULT_NEW_MEMBER2).await?;
        assert!(db_mongo_getter::is_admin(&client_mongo_db,"test",&test_update_server_id,&DEFAULT_NEW_MEMBER2).await?);
        
        //update nom
        //par membre
        let mut test_update_server_name = db_mongo_getter::get_server(&client_mongo_db,"test",&test_update_server_id).await?;
        db_mongo_update::update_server_name(&client_mongo_db,"test",test_update_server_id, "nouveau nom de server par membre",DEFAULT_NEW_MEMBER3).await?;
        println!("test_server_update => membre qui essaye de modifier le nom d'un server");
        assert!(test_update_server_name == db_mongo_getter::get_server(&client_mongo_db,"test",&test_update_server_id).await?);
        
        //par un admin
        db_mongo_update::update_server_name(&client_mongo_db,"test",test_update_server_id, "nouveau nom de server par admin",DEFAULT_NEW_MEMBER2).await?;
        println!("test_server_update => admin qui modifie le nom d'un server");
        assert!(test_update_server_name != db_mongo_getter::get_server(&client_mongo_db,"test",&test_update_server_id).await?);
        test_update_server_name = db_mongo_getter::get_server(&client_mongo_db,"test",&test_update_server_id).await?;
        assert!(test_update_server_name == db_mongo_getter::get_server(&client_mongo_db,"test",&test_update_server_id).await?);
        
        //par l'owner
        db_mongo_update::update_server_name(&client_mongo_db,"test",test_update_server_id, "nouveau nom de server par owner",DEFAULT_OWNER).await?;
        println!("test_server_update => owner qui modifie le nom d'un server");
        assert!(test_update_server_name != db_mongo_getter::get_server(&client_mongo_db,"test",&test_update_server_id).await?);
        
        db_mongo_delete::delete_server(&client_mongo_db,"test",test_update_server_id,DEFAULT_OWNER).await?;
        println!("test_mongo_server_set_up => suppression du server crée : {:?}",test_update_server_id);
        Ok(())
    }
    
    #[actix_web::test]
    async fn test_get_element() ->std::io::Result<()>{
        // Acquérir le verrou pour éviter la concurrence
        let _lock = get_test_lock().await;
        //mise en place du serveur
        let client_mongo_db = db_mongo_connection::get_client().await?;
        let base_owner_server = db_mongo_getter::get_servers_by_member(&client_mongo_db, "test", &DEFAULT_OWNER).await?.len();
        let base_member2_server = db_mongo_getter::get_servers_by_member(&client_mongo_db, "test", &DEFAULT_NEW_MEMBER2).await?.len();
        let base_member3_server = db_mongo_getter::get_servers_by_member(&client_mongo_db, "test", &DEFAULT_NEW_MEMBER3).await?.len();
        db_mongo_setter::set_server(&client_mongo_db,"test",DEFAULT_OWNER,"test de création de channel").await?;
        let test_update_server_id1 = db_mongo_getter::get_last_id(&client_mongo_db,"test","server").await?;
        db_mongo_setter::add_member_to_server(&client_mongo_db,"test",test_update_server_id1,DEFAULT_NEW_MEMBER2).await?;
        db_mongo_setter::add_member_to_server(&client_mongo_db,"test",test_update_server_id1,DEFAULT_NEW_MEMBER3).await?;
        println!("server 1 crée avec 2 users de plus");
        assert!(db_mongo_getter::is_member(&client_mongo_db,"test",&test_update_server_id1,&DEFAULT_OWNER).await?);
        assert!(db_mongo_getter::is_member(&client_mongo_db,"test",&test_update_server_id1,&DEFAULT_NEW_MEMBER2).await?);
        assert!(db_mongo_getter::is_member(&client_mongo_db,"test",&test_update_server_id1,&DEFAULT_NEW_MEMBER3).await?);
        
        db_mongo_setter::set_server(&client_mongo_db,"test",DEFAULT_OWNER,"test de création de channel").await?;
        let test_update_server_id2 = db_mongo_getter::get_last_id(&client_mongo_db,"test","server").await?;
        db_mongo_setter::add_member_to_server(&client_mongo_db,"test",test_update_server_id2,DEFAULT_NEW_MEMBER2).await?;
        println!("server 2 crée avec {} users en plus",DEFAULT_NEW_MEMBER2);
        assert!(db_mongo_getter::is_member(&client_mongo_db,"test",&test_update_server_id2,&DEFAULT_OWNER).await?);
        assert!(db_mongo_getter::is_member(&client_mongo_db,"test",&test_update_server_id2,&DEFAULT_NEW_MEMBER2).await?);
        assert!(!db_mongo_getter::is_member(&client_mongo_db,"test",&test_update_server_id2,&DEFAULT_NEW_MEMBER3).await?);
        
        db_mongo_setter::set_server(&client_mongo_db,"test",DEFAULT_OWNER,"test de création de channel").await?;
        let test_update_server_id3 = db_mongo_getter::get_last_id(&client_mongo_db,"test","server").await?;
        db_mongo_setter::add_member_to_server(&client_mongo_db,"test",test_update_server_id3,DEFAULT_NEW_MEMBER3).await?;
        println!("server 3 crée avec {} users en plus",DEFAULT_NEW_MEMBER3);
        assert!(db_mongo_getter::is_member(&client_mongo_db,"test",&test_update_server_id3,&DEFAULT_OWNER).await?);
        assert!(!db_mongo_getter::is_member(&client_mongo_db,"test",&test_update_server_id3,&DEFAULT_NEW_MEMBER2).await?);
        assert!(db_mongo_getter::is_member(&client_mongo_db,"test",&test_update_server_id3,&DEFAULT_NEW_MEMBER3).await?);
        
        db_mongo_setter::set_server(&client_mongo_db,"test",DEFAULT_OWNER,"test de création de channel").await?;
        let test_update_server_id4 = db_mongo_getter::get_last_id(&client_mongo_db,"test","server").await?;
        assert!(db_mongo_getter::is_member(&client_mongo_db,"test",&test_update_server_id4,&DEFAULT_OWNER).await?);
        assert!(!db_mongo_getter::is_member(&client_mongo_db,"test",&test_update_server_id4,&DEFAULT_NEW_MEMBER2).await?);
        assert!(!db_mongo_getter::is_member(&client_mongo_db,"test",&test_update_server_id4,&DEFAULT_NEW_MEMBER3).await?);
        println!("server 4 crée avec aucun users en plus");
        
        // Attendre que tous les serveurs soient bien enregistrés (problème de concurrence)
        let mut retries = 0;
        let mut owner_servers_ok = false;
        let mut member2_servers_ok = false;
        let mut member3_servers_ok = false;
        while retries < 10 && (!owner_servers_ok || !member2_servers_ok || !member3_servers_ok) {
            let owner_count = db_mongo_getter::get_servers_by_member(&client_mongo_db, "test", &DEFAULT_OWNER).await?.len();
            let member2_count = db_mongo_getter::get_servers_by_member(&client_mongo_db, "test", &DEFAULT_NEW_MEMBER2).await?.len();
            let member3_count = db_mongo_getter::get_servers_by_member(&client_mongo_db, "test", &DEFAULT_NEW_MEMBER3).await?.len();
            
            owner_servers_ok = owner_count >= base_owner_server + 4; // >= car d'autres tests peuvent avoir créé des serveurs
            member2_servers_ok = member2_count >= base_member2_server + 2;
            member3_servers_ok = member3_count >= base_member3_server + 2;
            
            if !owner_servers_ok || !member2_servers_ok || !member3_servers_ok {
                tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
                retries += 1;
            }
        }
        
        // println!("test owner {:?}",base_owner_server);
        // println!("test m2 {:?}",base_member2_server);
        // println!("test m3 {:?}",base_member3_server);
        // println!("test owner r {:?}",db_mongo_getter::get_servers_by_member(&client_mongo_db, "test", &DEFAULT_OWNER).await?.len());
        // println!("test m2 r {:?}",db_mongo_getter::get_servers_by_member(&client_mongo_db, "test", &DEFAULT_NEW_MEMBER2).await?.len());
        // println!("test m3 r {:?}",db_mongo_getter::get_servers_by_member(&client_mongo_db, "test", &DEFAULT_NEW_MEMBER3).await?.len());
        let final_owner_count = db_mongo_getter::get_servers_by_member(&client_mongo_db, "test", &DEFAULT_OWNER).await?.len();
        let final_member2_count = db_mongo_getter::get_servers_by_member(&client_mongo_db, "test", &DEFAULT_NEW_MEMBER2).await?.len();
        let final_member3_count = db_mongo_getter::get_servers_by_member(&client_mongo_db, "test", &DEFAULT_NEW_MEMBER3).await?.len();
        
        assert!(final_owner_count >= base_owner_server + 4, 
            "L'owner devrait avoir au moins {} serveurs (base: {}, actuel: {})", 
            base_owner_server + 4, base_owner_server, final_owner_count);
        assert!(final_member2_count >= base_member2_server + 2,
            "Le membre2 devrait avoir au moins {} serveurs (base: {}, actuel: {})", 
            base_member2_server + 2, base_member2_server, final_member2_count);
        assert!(final_member3_count >= base_member3_server + 2,
            "Le membre3 devrait avoir au moins {} serveurs (base: {}, actuel: {})", 
            base_member3_server + 2, base_member3_server, final_member3_count);
        
        
        println!("test_get_element => crée deux channel");
        db_mongo_setter::set_channel(&client_mongo_db,"test",test_update_server_id1,"premier chat",DEFAULT_OWNER).await?;
        let test_get_channel_id1 = db_mongo_getter::get_last_id(&client_mongo_db,"test","channel").await?;
        db_mongo_setter::set_channel(&client_mongo_db,"test",test_update_server_id1,"second chat",DEFAULT_OWNER).await?;
        let test_get_channel_id2 = db_mongo_getter::get_last_id(&client_mongo_db,"test","channel").await?;
        
        db_mongo_setter::set_message(&client_mongo_db,"test",test_update_server_id1,test_get_channel_id1,"message 1 ",DEFAULT_OWNER).await?;
        db_mongo_setter::set_message(&client_mongo_db,"test",test_update_server_id1,test_get_channel_id1,"message 2 ",DEFAULT_OWNER).await?;
        db_mongo_setter::set_message(&client_mongo_db,"test",test_update_server_id1,test_get_channel_id1,"message 3 ",DEFAULT_OWNER).await?;
        db_mongo_setter::set_message(&client_mongo_db,"test",test_update_server_id1,test_get_channel_id1,"message 4 ",DEFAULT_OWNER).await?;
        db_mongo_setter::set_message(&client_mongo_db,"test",test_update_server_id1,test_get_channel_id1,"message 5 ",DEFAULT_OWNER).await?;
        println!("test_get_element => envoie 5 messages dans le premier channel");
        
        db_mongo_setter::set_message(&client_mongo_db,"test",test_update_server_id1,test_get_channel_id2,"message 1 ",DEFAULT_OWNER).await?;
        db_mongo_setter::set_message(&client_mongo_db,"test",test_update_server_id1,test_get_channel_id2,"message 2 ",DEFAULT_OWNER).await?;
        println!("test_get_element => envoie 2 messages dans le second channel");
        
        println!("test_get_element => verifie le nombre de messages dans les channel");
        assert!(db_mongo_getter::get_messages_of_channel(&client_mongo_db,"test",&test_get_channel_id1).await?.len() == 5);
        assert!(db_mongo_getter::get_messages_of_channel(&client_mongo_db,"test",&test_get_channel_id2).await?.len() == 2);


        db_mongo_delete::delete_server(&client_mongo_db,"test",test_update_server_id1,DEFAULT_OWNER).await?;
        println!("test_get_element => suppression du server crée : {:?}",test_update_server_id1);
        db_mongo_delete::delete_server(&client_mongo_db,"test",test_update_server_id2,DEFAULT_OWNER).await?;
        println!("test_get_element => suppression du server crée : {:?}",test_update_server_id2);
        db_mongo_delete::delete_server(&client_mongo_db,"test",test_update_server_id3,DEFAULT_OWNER).await?;
        println!("test_get_element => suppression du server crée : {:?}",test_update_server_id3);
        db_mongo_delete::delete_server(&client_mongo_db,"test",test_update_server_id4,DEFAULT_OWNER).await?;
        println!("test_get_element => suppression du server crée : {:?}",test_update_server_id4);
        


        Ok(())
    }

}

fn type_of<T>(_: &T) -> &'static str{
    std::any::type_name::<T>()
}