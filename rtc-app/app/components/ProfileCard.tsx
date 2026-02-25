'use client';

import { useEffect, useRef } from 'react';

interface Server {
  id: number;
  name: string;
  image?: string;
}

interface ProfileCardProps {
  userId: number;
  username: string;
  avatar: string;
  email?: string;
  status?: 'online' | 'offline';
  role?: string;
  roleColor?: string;
  commonServers?: Server[];
  onClose: () => void;
  position?: { x: number; y: number };
  canKick?: boolean;
  onKick?: () => void;
  isKicking?: boolean;
}

export default function ProfileCard({
  userId,
  username,
  avatar,
  email,
  status = 'offline',
  role,
  roleColor,
  commonServers = [],
  onClose,
  position,
  canKick = false,
  onKick,
  isKicking = false,
}: ProfileCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  useEffect(() => {
    if (cardRef.current && position) {
      const card = cardRef.current;
      const rect = card.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let x = position.x;
      let y = position.y;

      // Ajuster horizontalement si la carte dépasse
      if (x + rect.width > viewportWidth) {
        x = viewportWidth - rect.width - 10;
      }
      if (x < 10) {
        x = 10;
      }

      // Ajuster verticalement si la carte dépasse
      if (y + rect.height > viewportHeight) {
        y = viewportHeight - rect.height - 10;
      }
      if (y < 10) {
        y = 10;
      }

      card.style.left = `${x}px`;
      card.style.top = `${y}px`;
    }
  }, [position]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div
        ref={cardRef}
        className={`relative w-80 bg-zinc-900 border-2 border-orange-500 rounded-2xl shadow-2xl shadow-orange-600/50 overflow-hidden ${
          position ? 'absolute' : ''
        }`}
        style={position ? {} : {}}
      >
        {/* Header avec gradient */}
        <div className="h-24 bg-gradient-to-r from-orange-600 via-orange-500 to-orange-600 relative">
          <button
            onClick={onClose}
            className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center bg-black/30 hover:bg-black/50 rounded-full text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Avatar */}
        <div className="relative -mt-12 flex justify-center mb-4">
          <div className="relative">
            <div className="w-24 h-24 rounded-full border-4 border-zinc-900 overflow-hidden bg-zinc-800">
              <img
                src={avatar}
                alt={username}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`;
                }}
              />
            </div>
            <div className={`absolute bottom-0 right-0 w-6 h-6 rounded-full border-4 border-zinc-900 ${
              status === 'online' ? 'bg-green-500' : 'bg-gray-500'
            }`}></div>
          </div>
        </div>

        {/* Contenu */}
        <div className="px-6 pb-6 space-y-4">
          {/* Nom d'utilisateur */}
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-1">{username}</h2>
            {role && (
              <div
                className="inline-block px-3 py-1 rounded-full text-xs font-semibold"
                style={{ backgroundColor: `${roleColor}20`, color: roleColor || '#fff' }}
              >
                {role}
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="h-px bg-zinc-800"></div>

          {/* Informations */}
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-400 uppercase tracking-wide">Statut</p>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${status === 'online' ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                  <p className="text-white capitalize">{status === 'online' ? 'En ligne' : 'Hors ligne'}</p>
                </div>
              </div>
            </div>

            {commonServers.length > 0 && (
              <div className="flex items-start gap-3 text-sm">
                <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">
                    Serveurs en commun ({commonServers.length})
                  </p>
                  <div className="space-y-1.5 max-h-32 overflow-y-auto">
                    {commonServers.map((server) => (
                      <div
                        key={server.id}
                        className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 transition-colors"
                      >
                        {server.image ? (
                          <img
                            src={server.image}
                            alt={server.name}
                            className="w-5 h-5 rounded-full object-cover flex-shrink-0"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              if (target.nextElementSibling) {
                                (target.nextElementSibling as HTMLElement).style.display = 'flex';
                              }
                            }}
                          />
                        ) : null}
                        <div
                          className={`w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0 ${server.image ? 'hidden' : 'flex'}`}
                        >
                          {server.name.charAt(0).toUpperCase()}
                        </div>
                        <p className="text-white text-xs truncate flex-1">{server.name}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bouton d'exclusion */}
          {canKick && onKick && (
            <>
              <div className="h-px bg-zinc-800"></div>
              <button
                onClick={onKick}
                disabled={isKicking}
                className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-800 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors"
              >
                {isKicking ? 'Exclusion...' : 'Exclure du serveur'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

