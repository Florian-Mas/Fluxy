'use client'

import React from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Users, User, Settings } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();

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
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-start p-8">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold text-orange-500 mb-4">
          Bienvenue sur <span className="text-orange-500">Fluxy</span>
        </h1>
        <p className="text-white text-lg">
          Choisissez une action pour commencer
        </p>
      </div>

     
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

      
    </div>
  );
}