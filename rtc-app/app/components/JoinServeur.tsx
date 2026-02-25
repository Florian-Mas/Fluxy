'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface JoinServeurProps {
  serverId: number | null;
}

export default function JoinServeur({ serverId }: JoinServeurProps) {
  const [inviteLink, setInviteLink] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [serverPreview, setServerPreview] = useState<{
    name: string;
    icon: string;
    members: number;
  } | null>(null);
  const router = useRouter();

  // Si un serverId est fourni dans l'URL (ancien système par ID numérique), rejoindre automatiquement
  useEffect(() => {
    if (serverId && !isNaN(serverId) && serverId > 0) {
      handleJoinById(serverId);
    }
  }, [serverId]);

  // Ancien système : rejoindre directement par ID numérique
  const handleJoinById = async (id: number) => {
    setIsJoining(true);
    setError(null);

    try {
      const res = await fetch("http://localhost:3000/api/join-server", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ server_id: id }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erreur lors de la jointure du serveur");
        setIsJoining(false);
        return;
      }

      // Rediriger vers la page channels après succès
      setTimeout(() => {
        router.push("/channels");
      }, 1500);
    } catch (err) {
      setError("Erreur réseau lors de la jointure du serveur");
      setIsJoining(false);
    }
  };

  const handleLinkChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const link = e.target.value.trim();
    setInviteLink(link);

    // Aperçu simple basé sur la longueur du code
    if (link.length >= 6) {
      setServerPreview({
        name: 'Serveur (invitation)',
        icon: '🎮',
        members: 0,
      });
    } else {
      setServerPreview(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const raw = inviteLink.trim();
    if (!raw) {
      setError("Veuillez entrer un lien ou un code d'invitation valide");
      return;
    }

    // On accepte soit juste le code, soit l'URL complète contenant ?id=CODE
    let linkCode = raw;
    try {
      if (raw.startsWith("http://") || raw.startsWith("https://")) {
        const url = new URL(raw);
        const fromQuery = url.searchParams.get("id");
        if (fromQuery) {
          linkCode = fromQuery;
        }
      }
    } catch {
      // si ce n'est pas une URL, on garde raw comme code
      linkCode = raw;
    }

    // Si le code ressemble encore à un nombre pur, on utilise l'ancien endpoint par ID pour compat
    if (/^\d+$/.test(linkCode)) {
      const idNum = parseInt(linkCode, 10);
      if (!isNaN(idNum) && idNum > 0) {
        await handleJoinById(idNum);
        return;
      }
    }

    // Nouveau système : rejoindre par code d'invitation via /api/join-server-by-link
    setIsJoining(true);
    try {
      const res = await fetch("http://localhost:3000/api/join-server-by-link", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ link: linkCode }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erreur lors de la jointure du serveur");
        setIsJoining(false);
        return;
      }

      setTimeout(() => {
        router.push("/channels");
      }, 1500);
    } catch (err) {
      console.error("Erreur lors de la jointure du serveur:", err);
      setError("Erreur réseau lors de la jointure du serveur");
      setIsJoining(false);
    }
  };

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      
      <div className="relative z-10 container mx-auto px-4 py-12 md:py-20">
        <div className="max-w-3xl mx-auto mb-16 text-center">
          <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 bg-orange-500/10 border border-orange-500/30 rounded-full backdrop-blur-sm">
            <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></span>
            <span className="text-orange-400 text-sm font-semibold tracking-wider uppercase">
              Rejoindre
            </span>
          </div>
          
          <h1 className="text-6xl md:text-7xl font-black mb-6 leading-none tracking-tight">
            <span className="bg-gradient-to-br from-white via-gray-200 to-gray-300 bg-clip-text text-transparent">
              Rejoindre un
            </span>
            <br />
            <span className="bg-gradient-to-r from-orange-500 via-orange-400 to-orange-500 bg-clip-text text-transparent">
              serveur
            </span>
          </h1>
          
          <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto font-light leading-relaxed">
            Entre un code d'invitation ci-dessous pour rejoindre un serveur existant. 
          </p>
        </div>

        
        <div className="max-w-2xl mx-auto">
          <div className="bg-zinc-900/50 backdrop-blur-xl border border-orange-500/50 rounded-3xl  overflow-hidden transition-all duration-300 hover:border-orange-600/50 group  shadow-lg shadow-orange-600/30 ease-out hover:shadow-2xl hover:shadow-orange-600/70 hover:-translate-y-2">
            <div className="h-2 bg-gradient-to-r from-orange-600 via-orange-500 to-orange-600"></div>
            
            <div className="p-8 md:p-12">
              <form onSubmit={handleSubmit} className="space-y-8">
                <div>
                  <label 
                    htmlFor="inviteLink" 
                    className="block text-sm font-bold text-gray-200 mb-4 tracking-wide uppercase"
                  >
                    Code d'invitation
                  </label>
                  <div className="relative">
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
                      </svg>
                    </div>
                    <input
                      type="text"
                      id="inviteLink"
                      value={inviteLink}
                      onChange={handleLinkChange}
                      placeholder="123RgtDfgh"
                      required
                      className="w-full pl-6 pr-5 py-5 bg-zinc-950/60 border-2 border-orange-500/50 rounded-2xl text-white placeholder-gray-600 
                               focus:border-orange-500 focus:ring-4 focus:ring-orange-500/20 focus:outline-none
                               transition-all duration-300 hover:border-orange-600/70 text-lg font-mono"
                    />
                  </div>
                  <p className="text-gray-600 text-xs mt-3 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    Entrez directement le code de 10 caractères (123RgtDfgh)
                  </p>
                  {error && (
                    <p className="text-red-500 text-sm mt-2 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      {error}
                    </p>
                  )}
                </div>

                {serverPreview && (
                  <div className="bg-zinc-950/60 border border-zinc-800/30 rounded-2xl p-6 animate-fade-in">
                    <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <svg className="w-4 h-4 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Aperçu du serveur
                    </h3>
                    
                    <div className="flex items-center gap-4">
                      <div className="w-20 h-20 bg-gradient-to-br from-orange-600 to-orange-500 rounded-2xl flex items-center justify-center text-4xl shadow-lg">
                        {serverPreview.icon}
                      </div>
                      <div className="flex-1">
                        <h4 className="text-xl font-bold text-white mb-2">
                          {serverPreview.name}
                        </h4>
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1.5">
                            <span className="text-gray-400">
                              <span className="text-white font-semibold">{serverPreview.members}</span> membres
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                
                <button
                  type="submit"
                  disabled={!inviteLink || !serverPreview || isJoining}
                  className="w-full py-5 px-6 bg-gradient-to-r from-orange-600 to-orange-500 
                           hover:from-orange-500 hover:to-orange-400
                           text-white font-bold text-lg rounded-2xl
                           transform transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]
                           relative overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent 
                                translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700"></div>
                  
                  <span className="relative flex items-center justify-center gap-3">
                    {isJoining ? (
                      <>
                        <svg className="animate-spin h-6 w-6" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Connexion en cours...
                      </>
                    ) : (
                      <>
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                        Rejoindre le serveur
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
  );
}
