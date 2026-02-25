'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface ModifyServeurProps {
  serverId: number | null;
}

export default function ModifyServeur({ serverId }: ModifyServeurProps) {
  const [serverName, setServerName] = useState('');
  const [serverImage, setServerImage] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchServerData = async () => {
      if (!serverId) {
        router.push('/channels');
        return;
      }

      try {
        const response = await fetch('http://localhost:3000/api/user-servers', {
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          if (data.servers && Array.isArray(data.servers)) {
            const server = data.servers.find((s: any) => s.id === serverId);
            if (server) {
              setServerName(server.name || '');
              setServerImage(server.image || null);
            } else {
              router.push('/channels');
            }
          }
        }
      } catch (err) {
        console.error('Erreur lors de la récupération du serveur:', err);
        router.push('/channels');
      } finally {
        setLoading(false);
      }
    };

    fetchServerData();
  }, [serverId, router]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setServerImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!serverId) {
      setError('Aucun serveur sélectionné');
      return;
    }
    
    if (!serverName || serverName.trim() === '') {
      setError('Le nom du serveur est requis');
      return;
    }
    
    setIsUpdating(true);
    
    try {
      const response = await fetch('http://localhost:3000/api/update-server', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ 
          server_id: serverId,
          name: serverName.trim(),
          image: serverImage
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setError(data.error || 'Erreur lors de la modification du serveur');
        setIsUpdating(false);
        return;
      }
      
      // Rediriger vers la page Channels après succès
      router.push('/channels');
    } catch (err) {
      console.error('Erreur lors de la modification du serveur:', err);
      setError('Erreur réseau lors de la modification du serveur');
      setIsUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="text-white">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">

      <div className="relative z-10 container mx-auto px-4 py-12 md:py-16">
        <div className="max-w-3xl mx-auto mb-12 text-center">

          
          <p className="text-white text-lg md:text-xl max-w-2xl mx-auto font-light leading-relaxed">
            Tu peux modifier le nom et la photo de ton serveur. 
          </p>
        </div>

        <div className="w-full mx-auto px-4 md:px-8 lg:px-16 grid gap-16">
          <div className="order-2 lg:order-1 w-full">
            <div className="bg-zinc-900/50 backdrop-blur-xl border border-orange-500/50 rounded-3xl  overflow-hidden transition-all duration-300 hover:border-orange-600/50 group  shadow-lg shadow-orange-600/30 ease-out hover:shadow-2xl hover:shadow-orange-600/70 hover:-translate-y-2">
              <div className="h-2 bg-gradient-to-r from-orange-600 via-orange-500 to-orange-600"></div>
              
              <div className="p-8 md:p-10 xl:p-16">
                <form onSubmit={handleSubmit} className="space-y-7">
                  <div>
                    <label className="block text-sm font-bold text-gray-200 mb-4 tracking-wide uppercase">
                      Image du serveur
                    </label>
                    <div className="flex items-center gap-6">
                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="relative w-32 h-32 rounded-2xl overflow-hidden cursor-pointer group border-2 border-dashed border-zinc-700 hover:border-orange-500 transition-all duration-300"
                      >
                        {serverImage ? (
                          <>
                            <img 
                              src={serverImage} 
                              alt="Server icon" 
                              className="w-full h-full object-cover"
                            />
                             <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          </>
                        ) : (
                          <div className="w-full h-full bg-zinc-800/50 flex flex-col items-center justify-center group-hover:bg-zinc-800 transition-colors duration-300">
                            <svg className="w-12 h-12 text-orange-600 group-hover:text-orange-500 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            <span className="text-orange-600 text-xs mt-2 group-hover:text-orange-500 transition-colors duration-300">Ajouter</span>
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
                      <div className="flex-1">
                        <p className="text-sm text-gray-300 mb-2 font-medium">
                          Téléchargez une image
                        </p>
                        <p className="text-xs text-gray-500 leading-relaxed">
                          Formats acceptés : JPG, PNG, GIF
                          <br />
                          Taille recommandée : 512x512px
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label 
                      htmlFor="serverName" 
                      className="block text-sm font-bold text-gray-200 mb-3 tracking-wide uppercase"
                    >
                      Nom du serveur
                    </label>
                    <input
                      type="text"
                      id="serverName"
                      value={serverName}
                      onChange={(e) => setServerName(e.target.value)}
                      placeholder="Ma Super Communauté"
                      required
                      maxLength={50}
                      className="w-full px-5 py-4 bg-zinc-950/60 border-2 border-zinc-500/40 rounded-2xl text-white placeholder-gray-600 
                               focus:border-orange-500 focus:ring-4 focus:ring-orange-500/20 focus:outline-none
                               transition-all duration-300 hover:border-zinc-700/70 text-lg font-medium"
                    />
                    <p className="text-gray-600 text-xs mt-2">{serverName.length}/50 caractères</p>
                  </div>


                  {error && (
                    <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-4">
                      <p className="text-red-400 text-sm">{error}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={!serverName || isUpdating}
                    className="w-full py-5 px-6
                            bg-orange-500 hover:bg-orange-400
                            text-white font-bold text-lg rounded-2xl
                            transform transition-all duration-300
                            hover:scale-[1.02] active:scale-[0.98]
                            relative overflow-hidden group
                            disabled:opacity-50 disabled:cursor-not-allowed"

                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent 
                                  translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700"></div>
                    
                    <span className="relative flex items-center justify-center gap-3">
                      {isUpdating ? (
                        <>
                          <svg className="animate-spin h-6 w-6" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Modification en cours...
                        </>
                      ) : (
                        <>
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Modifier le serveur 
                        </>
                      )}
                    </span>
                  </button>
                </form>
              </div>
            </div>
          </div>

          
           
        
        </div>
      </div>
    </div>
  );
}
