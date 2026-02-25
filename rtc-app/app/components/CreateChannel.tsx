'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function CreateDiscordServerPage() {
  const [serverName, setServerName] = useState('');
  const [serverImage, setServerImage] = useState<string | null>(null);
  const [template, setTemplate] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

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
    
    if (!serverName || serverName.trim() === '') {
      setError('Le nom du serveur est requis');
      return;
    }
    
    setIsCreating(true);
    
    try {
      const response = await fetch('/api/create-server', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ name: serverName.trim() }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setError(data.error || 'Erreur lors de la création du serveur');
        setIsCreating(false);
        return;
      }
      
      // Rediriger vers la page Channels après succès
      router.push('/channels');
    } catch (err) {
      console.error('Erreur lors de la création du channel:', err);
      setError('Erreur réseau lors de la création du channel');
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">

      <div className="relative z-10 container mx-auto px-4 py-12 md:py-16">
        <div className="max-w-3xl mx-auto mb-12 text-center">
          <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 bg-orange-500/10 border border-orange-500/30 rounded-full backdrop-blur-sm">
            <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></span>
            <span className="text-orange-400 text-sm font-semibold tracking-wider uppercase">
              Nouveau channel 
            </span>
          </div>
          
          <h1 className="text-6xl md:text-7xl font-black mb-6 leading-none tracking-tight">
            <span className="bg-gradient-to-br from-white via-gray-200 to-gray-300 bg-clip-text text-transparent">
              Crée ton
            </span>
            <br />
            <span className="bg-gradient-to-r from-orange-500 via-orange-400 to-orange-500 bg-clip-text text-transparent">
              channel 
            </span>
          </h1>
          
          <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto font-light leading-relaxed">
            Avec les channels, tu crées des espaces pour organiser des discussions. 
          </p>
        </div>
   
        <div className="w-full mx-auto px-4 md:px-8 lg:px-16 grid gap-16">
          <div className="order-2 lg:order-1 w-full">
            <div className="bg-zinc-900/50 backdrop-blur-xl border border-orange-500/50 rounded-3xl  overflow-hidden transition-all duration-300 hover:border-orange-600/50 group  shadow-lg shadow-orange-600/30 ease-out hover:shadow-2xl hover:shadow-orange-600/70 hover:-translate-y-2">
              <div className="h-2 bg-gradient-to-r from-orange-600 via-orange-500 to-orange-600"></div>
              
                <div className="p-8 md:p-10 xl:p-16">
                    <form onSubmit={handleSubmit} className="space-y-7">
                        
                  <div>
                    <label 
                      htmlFor="serverName" 
                      className="block text-sm font-bold text-gray-200 mb-3 tracking-wide uppercase"
                    >
                      Nom du channel 
                    </label>
                    <input
                      type="text"
                      id="channelName"
                      value={serverName}
                      onChange={(e) => setServerName(e.target.value)}
                      placeholder="Mon salon de discussion"
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
                    disabled={!serverName || isCreating}
                    className="w-full py-5 px-6
                            bg-orange-500 hover:bg-orange-400
                            text-white font-bold text-lg rounded-2xl
                            transform transition-all duration-300
                            hover:scale-[1.02] active:scale-[0.98]
                            relative overflow-hidden group"

                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent 
                                  translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700"></div>
                    
                    <span className="relative flex items-center justify-center gap-3">
                      {isCreating ? (
                        <>
                          <svg className="animate-spin h-6 w-6" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Création en cours...
                        </>
                      ) : (
                        <>
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          Créer un channel
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
