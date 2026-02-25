'use client'

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Users, User, Settings } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from './Channels';

interface Server {
  id: number;
  name: string;
  image: string;
}

export default function HomePage2() {
  const router = useRouter();
  const [servers, setServers] = useState<Server[]>([]);
  const [loadingServers, setLoadingServers] = useState(true);

  useEffect(() => {
    const fetchServers = async () => {
      try {
        const res = await fetch('/api/user-servers', {
          credentials: 'include',
        });

        if (res.ok) {
          const data = await res.json();
          if (data.servers && Array.isArray(data.servers)) {
            const formattedServers = data.servers.map((server: any) => ({
              id: server.id || 0,
              name: server.name || 'Serveur sans nom',
              image: server.image || '/logo_fluxy.png',
            }));
            setServers(formattedServers);
          }
        } else {
          console.error('Erreur lors de la récupération des serveurs');
        }
      } catch (err) {
        console.error('Erreur réseau lors de la récupération des serveurs:', err);
      } finally {
        setLoadingServers(false);
      }
    };

    fetchServers();
  }, []);

  const actions = [
    {
      id: 1,
      title: 'Créer un serveur',
      description: 'Créez votre propre serveur et invitez vos amis',
      icon: Plus,
      color: 'orange',
      action: () => router.push('/create-serveur'),
    },
    {
      id: 2,
      title: 'Rejoindre un serveur',
      description: 'Rejoignez un serveur existant avec un code d\'invitation',
      icon: Users,
      color: 'blue',
      action: () => router.push('/join-serveur'),
    },
    {
      id: 3,
      title: 'Profil',
      description: 'Gérez votre profil et vos informations personnelles',
      icon: User,
      color: 'purple',
      action: () => router.push('/profil'),
    },
    {
      id: 4,
      title: 'Paramètres',
      description: 'Configurez vos préférences et paramètres',
      icon: Settings,
      color: 'green',
      action: () => {},
    },
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      orange: {
        bg: 'bg-orange-500/10',
        hover: 'hover:bg-orange-500/20',
        icon: 'text-orange-500',
        border: 'border-orange-500/30',
        shadow: 'hover:shadow-orange-500/50',
      },
      blue: {
        bg: 'bg-rose-500/10',
        hover: 'hover:bg-rose-500/20',
        icon: 'text-rose-500',
        border: 'border-rose-500/30',
        shadow: 'hover:shadow-rose-500/50',
      },
      purple: {
        bg: 'bg-rose-500/10',
        hover: 'hover:bg-rose-500/20',
        icon: 'text-rose-500',
        border: 'border-rose-500/30',
        shadow: 'hover:shadow-rose-500/50',
      },
      green: {
        bg: 'bg-orange-500/10',
        hover: 'hover:bg-orange-500/20',
        icon: 'text-orange-500',
        border: 'border-orange-500/30',
        shadow: 'hover:shadow-orange-500/50',
      },
    };
    return colors[color as keyof typeof colors];
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      <nav className="h-16 bg-zinc-900 flex items-center justify-between px-4 shadow-lg shadow-orange-600/50 border-b border-orange-500">
        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="px-4 py-2 bg-zinc-900 rounded-lg border-2 border-orange-500 hover:bg-orange-700">
                <img
                  src="logo_fluxy.png"
                  alt="logo"
                  className="w-10 h-10 object-cover"
                />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-zinc-800 text-white border-zinc-700">
              <DropdownMenuGroup>
                <DropdownMenuItem
                  className="text-orange-600"
                  onSelect={() => router.push('/home')}
                >
                  Home
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-zinc-700" />
                <DropdownMenuItem
                  className="hover:bg-zinc-700"
                  onSelect={() => router.push('/profil')}
                >
                  Profil
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="hover:bg-zinc-700"
                  onSelect={async (e) => {
                    e.preventDefault();
                    try {
                      const res = await fetch("/api/logout", {
                        method: "POST",
                        credentials: "include",
                      });
                      const data = await res.json();
                      router.push("/");
                    } catch (err) {
                      router.push("/");
                    }
                  }}
                >
                  Paramètres
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator className="bg-zinc-700" />
              <DropdownMenuItem
                className="hover:bg-zinc-700 text-red-500"
                onSelect={async (e) => {
                  e.preventDefault();
                  try {
                    const res = await fetch("/api/logout", {
                      method: "POST",
                      credentials: "include",
                    });
                    if (res.ok) {
                      router.push("/");
                    } else {
                      router.push("/");
                    }
                  } catch (err) {
                    router.push("/");
                  }
                }}
              >
                Déconnexion
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex-1 flex items-center justify-center gap-3">
          {loadingServers && (
            <span className="text-zinc-400 text-sm">Chargement des serveurs...</span>
          )}
          {!loadingServers && servers.length === 0 && (
            <span className="text-zinc-400 text-sm">Aucun serveur trouvé</span>
          )}
          {!loadingServers &&
            servers.map((server) => (
              <button
                key={server.id}
                className="relative w-12 h-12 rounded-full overflow-hidden ring-2 ring-transparent hover:ring-orange-500 transition"
                onClick={() => router.push(`/channels?server_id=${server.id}`)}
              >
                <img
                  src={server.image}
                  alt={server.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const img = e.currentTarget as HTMLImageElement;
                    img.src = `https://via.placeholder.com/48/${Math.random()
                      .toString(16)
                      .substr(2, 6)}/ffffff?text=${server.name.charAt(0)}`;
                  }}
                />
              </button>
            ))}
        </div>
      </nav>

      <main className="flex-1 flex items-center justify-center p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto w-full">
        {actions.map((action) => {
          const colors = getColorClasses(action.color);
          const Icon = action.icon;

          return (
            <button
              key={action.id}
              onClick={action.action}
              className={`
                group relative p-6 rounded-xl border-2 
                ${colors.bg} ${colors.hover} ${colors.border}
                transition-all duration-300 ease-out
                hover:scale-105 hover:shadow-2xl ${colors.shadow}
                text-left
              `}
            >
             
              <div className={`
                w-16 h-16 rounded-lg ${colors.bg} 
                flex items-center justify-center mb-4
                group-hover:scale-110 transition-transform duration-300
              `}>
                <Icon className={`w-8 h-8 ${colors.icon}`} />
              </div>

              
              <h3 className="text-xl font-semibold text-white mb-2">
                {action.title}
              </h3>
              <p className="text-zinc-400 text-sm">
                {action.description}
              </p>

              
              <div className={`
                absolute bottom-4 right-4 opacity-0 
                group-hover:opacity-100 transition-opacity duration-300
                ${colors.icon}
              `}>
                <svg 
                  className="w-5 h-5" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M9 5l7 7-7 7" 
                  />
                </svg>
              </div>
            </button>
          );
        })}
        </div>
      </main>
    </div>
  );
}