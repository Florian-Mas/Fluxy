'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface ModifyChannelProps {
  channelId: number | null;
  serverId: number | null;
}

export default function ModifyChannel({ channelId, serverId }: ModifyChannelProps) {
  const [channelName, setChannelName] = useState('');
  const [position, setPosition] = useState(0);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchChannelData = async () => {
      if (!channelId || !serverId) {
        router.push('/channels');
        return;
      }

      try {
        const response = await fetch(`http://localhost:3000/api/server-channels?server_id=${serverId}`, {
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          if (data.channels && Array.isArray(data.channels)) {
            const channel = data.channels.find((c: any) => c.id === channelId);
            if (channel) {
              setChannelName(channel.name || '');
              setPosition(channel.position || 0);
            } else {
              router.push('/channels');
            }
          }
        }
      } catch (err) {
        console.error('Erreur lors de la récupération du channel:', err);
        router.push('/channels');
      } finally {
        setLoading(false);
      }
    };

    fetchChannelData();
  }, [channelId, serverId, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!channelId || !serverId) {
      setError('Aucun channel sélectionné');
      return;
    }
    
    if (!channelName || channelName.trim() === '') {
      setError('Le nom du channel est requis');
      return;
    }
    
    setIsUpdating(true);
    
    try {
      const response = await fetch('/api/channel/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ 
          server_id: serverId,
          channel_id: channelId,
          name: channelName.trim(),
          position: position
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setError(data.error || 'Erreur lors de la modification du channel');
        setIsUpdating(false);
        return;
      }
      
      // Rediriger vers la page Channels après succès
      router.push('/channels');
    } catch (err) {
      console.error('Erreur lors de la modification du channel:', err);
      setError('Erreur réseau lors de la modification du channel');
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
            Tu peux modifier le nom de ton channel.
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
                      htmlFor="channelName" 
                      className="block text-sm font-bold text-gray-200 mb-3 tracking-wide uppercase"
                    >
                      Nom du channel 
                    </label>
                    <input
                      type="text"
                      id="channelName"
                      value={channelName}
                      onChange={(e) => setChannelName(e.target.value)}
                      placeholder="Mon salon de discussion"
                      required
                      maxLength={50}
                      className="w-full px-5 py-4 bg-zinc-950/60 border-2 border-zinc-500/40 rounded-2xl text-white placeholder-gray-600 
                               focus:border-orange-500 focus:ring-4 focus:ring-orange-500/20 focus:outline-none
                               transition-all duration-300 hover:border-zinc-700/70 text-lg font-medium"
                    />
                    <p className="text-gray-600 text-xs mt-2">{channelName.length}/50 caractères</p>
                  </div>


                  {error && (
                    <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-4">
                      <p className="text-red-400 text-sm">{error}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={!channelName || isUpdating}
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
                          Modifier le channel 
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
