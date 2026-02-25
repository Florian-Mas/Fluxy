"use client";

import { useState, useRef, useEffect } from "react";

export default function ProfilePage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [tempUsername, setTempUsername] = useState(username);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const res = await fetch("/api/user", {
          credentials: "include",
        });
        if (!res.ok) return;
        const data = await res.json();
        if (data) {
          const initialUsername =
            data.username || (data.email ? data.email.split("@")[0] : "") || "";
          setUsername(initialUsername);
          setTempUsername(initialUsername);
          if (data.email) {
            setEmail(data.email);
          }
          if (data.avatar) {
            setProfileImage(data.avatar);
          }
        }
      } catch {
        // on laisse les valeurs par défaut vides
      }
    };

    loadUser();
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      setProfileImage(base64);

      try {
        const res = await fetch("/api/update-profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ avatar: base64 }),
        });

        if (!res.ok) {
          console.error("Erreur lors de la sauvegarde de l'avatar");
        }
      } catch (err) {
        console.error("Erreur réseau lors de la sauvegarde de l'avatar:", err);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleUsernameEdit = () => {
    setIsEditingUsername(true);
    setTempUsername(username);
  };

  const handleUsernameSave = async () => {
    if (!tempUsername.trim()) return;
    setIsSaving(true);

    try {
      const res = await fetch("/api/update-username", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: tempUsername.trim() }),
      });

      if (!res.ok) {
        console.error("Erreur lors de la mise à jour du username");
      } else {
        setUsername(tempUsername.trim());
        setIsEditingUsername(false);
      }
    } catch (err) {
      console.error("Erreur réseau lors de la mise à jour du username:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUsernameCancel = () => {
    setTempUsername(username);
    setIsEditingUsername(false);
  };

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <div className="relative z-10 container mx-auto px-4 py-12 md:py-20">
        <div className="max-w-3xl mx-auto mb-12 text-center">
          <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 bg-orange-500/10 border border-orange-500/30 rounded-full backdrop-blur-sm">
            <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
            <span className="text-orange-400 text-sm font-semibold tracking-wider uppercase">
              Mon Profil
            </span>
          </div>
          
           <h1 className="text-6xl md:text-7xl font-black mb-6 leading-none tracking-tight">
            <span className="bg-gradient-to-br from-white via-gray-200 to-gray-300 bg-clip-text text-transparent">
             Modifie ton
            </span>
            <br />
            <span className="bg-gradient-to-r from-orange-500 via-orange-400 to-orange-500 bg-clip-text text-transparent">
              profil
            </span>
          </h1>
          
          <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto font-light leading-relaxed">
            Gérez vos informations personnelles
          </p>
        </div>

        
        <div className="max-w-3xl mx-auto">
          <div className="bg-zinc-900/50 backdrop-blur-xl border border-orange-500/50 rounded-3xl  overflow-hidden transition-all duration-300 hover:border-orange-600/50 group  shadow-lg shadow-orange-600/30 ease-out hover:shadow-2xl hover:shadow-orange-600/70 hover:-translate-y-2">
            <div className="h-2 bg-gradient-to-r from-orange-600 via-orange-500 to-orange-600"></div>
            
            <div className="p-8 md:p-12 space-y-10">
              <div>
                <label className="block text-sm font-bold text-gray-200 mb-6 tracking-wide uppercase">
                  Photo de profil
                </label>
                
                <div className="flex flex-col md:flex-row items-center gap-8">
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="relative w-40 h-40 rounded-full overflow-hidden cursor-pointer group border-4 border-zinc-800 hover:border-orange-500 transition-all duration-300 shadow-xl"
                  >
                    {profileImage ? (
                      <>
                        <img 
                          src={profileImage} 
                          alt="Profile" 
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                          <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-full rounded-full bg-gradient-to-br from-orange-600 to-orange-500 flex items-center justify-center group-hover:from-orange-500 group-hover:to-orange-400 transition-all duration-300">
                        <span className="text-white text-6xl font-bold">
                          {username.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  
                  <div className="flex-1 text-center md:text-left">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-6 py-3 bg-zinc-800/50 hover:bg-zinc-700/50 border border-orange-500 hover:border-orange-600 rounded-xl text-white font-semibold transition-all duration-300 mb-3"
                    >
                      {profileImage ? 'Changer la photo' : 'Ajouter une photo'}
                    </button>
                    <p className="text-sm text-gray-500 leading-relaxed">
                      Formats acceptés : JPG, PNG, GIF
                      <br />
                      Taille maximale : 5 MB
                    </p>
                  </div>
                </div>
              </div>

              <div className="h-px bg-zinc-800/50"></div>

              
              <div>
                <label className="block text-sm font-bold text-gray-200 mb-4 tracking-wide uppercase">
                  Nom d'utilisateur
                </label>
                
                {isEditingUsername ? (
                  <div className="space-y-4">
                    <input
                      type="text"
                      value={tempUsername}
                      onChange={(e) => setTempUsername(e.target.value)}
                      maxLength={30}
                      className="w-full px-5 py-4 bg-zinc-950/60 border-2 border-orange-500 rounded-2xl text-white placeholder-gray-600 
                               focus:ring-4 focus:ring-orange-500/20 focus:outline-none
                               transition-all duration-300 text-lg font-medium"
                      autoFocus
                    />
                    <p className="text-gray-600 text-xs">{tempUsername.length}/30 caractères</p>
                    
                    <div className="flex gap-3">
                      <button
                        onClick={handleUsernameSave}
                        disabled={!tempUsername || isSaving}
                        className="flex-1 py-3 px-6 bg-gradient-to-r from-orange-600 to-orange-500 
                                 hover:from-orange-500 hover:to-orange-400
                                 disabled:from-zinc-800 disabled:to-zinc-700 disabled:cursor-not-allowed
                                 text-white font-bold rounded-xl
                                 shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50
                                 transform transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]
                                 disabled:shadow-none disabled:scale-100"
                      >
                        {isSaving ? 'Enregistrement...' : 'Enregistrer'}
                      </button>
                      <button
                        onClick={handleUsernameCancel}
                        disabled={isSaving}
                        className="px-6 py-3 bg-zinc-800/50 hover:bg-zinc-700/50 border border-zinc-700 hover:border-zinc-600 
                                 rounded-xl text-white font-semibold transition-all duration-300
                                 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-5 bg-zinc-950/40 border border-zinc-800/30 rounded-2xl group hover:border-zinc-700/50 transition-all duration-300">
                    <div className="flex items-center gap-4">
                      <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span className="text-white text-lg font-medium">{username}</span>
                    </div>
                    <button
                      onClick={handleUsernameEdit}
                      className="px-4 py-2 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 hover:border-orange-500/50 
                               rounded-lg text-orange-400 font-semibold text-sm transition-all duration-300 flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Modifier
                    </button>
                  </div>
                )}
              </div>

              <div className="h-px bg-zinc-800/50"></div>

              
              <div>
                <label className="block text-sm font-bold text-gray-200 mb-4 tracking-wide uppercase">
                  Adresse email
                </label>
                
                <div className="flex items-center justify-between p-5 bg-zinc-950/40 border border-orange-500/50 rounded-2xl">
                  <div className="flex items-center gap-4">
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span className="text-white text-lg font-medium">{email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-500 text-sm">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                    Non modifiable
                  </div>
                </div>
                <p className="text-xs text-gray-600 mt-3">
                  Votre adresse email est utilisée pour la connexion et ne peut pas être modifiée
                </p>
              </div>

              <div className="h-px bg-zinc-800/50"></div>

         
            </div>

            <div className="p-6 bg-zinc-950/30 border-t border-zinc-800/50">
              <button
                type="button"
                onClick={handleUsernameSave}
                disabled={!isEditingUsername || !tempUsername.trim() || isSaving}
                className="w-full py-4 px-6 bg-gradient-to-r from-orange-600 to-orange-500 
                         hover:from-orange-500 hover:to-orange-600
                         text-white font-bold text-lg rounded-2xl
                         transform transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]
                         relative overflow-hidden group
                         disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent 
                              translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700"></div>
                
                <span className="relative flex items-center justify-center gap-3">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Enregistrer les modifications
                </span>
              </button>
            </div>
          </div>


        </div>
      </div>
    </div>
  );
}
