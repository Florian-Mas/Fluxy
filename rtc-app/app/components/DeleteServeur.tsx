'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface DeleteServeurProps {
  serverId: number | null;
}

export default function DeleteServeur({ serverId }: DeleteServeurProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');
  const [currentServerName, setCurrentServerName] = useState('');
  const router = useRouter();

  useEffect(() => {
    const fetchServerInfo = async () => {
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
              setCurrentServerName(server.name || 'Serveur sans nom');
            } else {
              router.push('/channels');
            }
          }
        }
      } catch (err) {
        console.error('Erreur lors de la récupération du serveur:', err);
        router.push('/channels');
      }
    };

    fetchServerInfo();
  }, [serverId, router]);

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!serverId) {
      setError('Aucun serveur sélectionné');
      return;
    }

    const confirmDelete = window.confirm(
      `Êtes-vous sûr de vouloir supprimer définitivement le serveur "${currentServerName}" ?`
    );

    if (!confirmDelete) return;

    setIsDeleting(true);

    try {
      const response = await fetch('http://localhost:3000/api/delete-server', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ server_id: serverId }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Erreur lors de la suppression du serveur. Vérifiez que vous êtes le fondateur.');
        setIsDeleting(false);
        return;
      }

      // Rediriger vers la page Channels après succès
      router.push('/channels');
    } catch (err) {
      console.error('Erreur lors de la suppression du serveur:', err);
      setError('Erreur réseau lors de la suppression du serveur');
      setIsDeleting(false);
    }
  };

  const handleCancel = () => {
    router.push('/channels');
  };

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <div className="relative z-10 container mx-auto px-4 py-12 md:py-16">
        <div className="w-full mx-auto px-4 md:px-8 lg:px-16 grid gap-16">
          <div className="order-2 lg:order-1 w-full">
            <div className="bg-zinc-900/50 backdrop-blur-xl border border-red-500/50 rounded-3xl overflow-hidden transition-all duration-300 hover:border-red-600/50 group shadow-lg shadow-red-600/30 ease-out hover:shadow-2xl hover:shadow-red-600/70 hover:-translate-y-2">
              <div className="h-2 bg-gradient-to-r from-red-600 via-red-500 to-red-600"></div>
              
              <div className="p-8 md:p-10 xl:p-16">
                <form onSubmit={handleDelete} className="space-y-7">
                  <div>
                    <label 
                      htmlFor="serverName" 
                      className="block text-sm text-center font-bold text-gray-200 mb-6 tracking-wide uppercase"
                    >
                      Es-tu certain de vouloir supprimer ce serveur ?  
                    </label>
                    <input
                      type="text"
                      id="serverName"
                      value={currentServerName}
                      readOnly
                      disabled
                      placeholder="Chargement..."
                      className="w-full px-5 py-4 bg-zinc-950/80 border-2 border-zinc-700/40 rounded-2xl text-gray-400 
                      cursor-not-allowed text-lg font-medium"
                    />
                  </div>

                  {error && (
                    <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-4">
                      <p className="text-red-400 text-sm">{error}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={!serverId || isDeleting}
                    className="w-full py-5 px-6
                            bg-red-600 hover:bg-red-500
                            text-white font-bold text-lg rounded-2xl
                            transform transition-all duration-300
                            hover:scale-[1.02] active:scale-[0.98]
                            relative overflow-hidden group
                            disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent 
                                  translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700"></div>
                    
                    <span className="relative flex items-center justify-center gap-3">
                      {isDeleting ? (
                        <>
                          <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Suppression en cours...
                        </>
                      ) : (
                        <>
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Supprimer le serveur 
                        </>
                      )}
                    </span>
                  </button>
                  
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={isDeleting}
                    className="w-full py-5 px-6
                            bg-white hover:bg-gray-100
                            text-black font-bold text-lg rounded-2xl
                            transform transition-all duration-300
                            hover:scale-[1.02] active:scale-[0.98]
                            relative overflow-hidden group
                            disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent 
                                  translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700"></div>
                    
                    <span className="relative flex items-center justify-center gap-3">
                      Annuler
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
