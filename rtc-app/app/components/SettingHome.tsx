'use client';

import { useState } from 'react';

interface Permission {
  name: string;
  description: string;
  granted: boolean;
}

interface Role {
  name: string;
  color: string;
  gradient: string;
  description: string;
  badge?: string;
  permissions: Permission[];
}

export default function RolesPermissionsPage() {
  const roles: Role[] = [
    {
      name: 'Administrateur',
      color: 'oklch(70.5% 0.213 47.604)',
      gradient: 'from-orange-600 to-orange-500',
      badge: 'Rôle Global',
      description: 'Contrôle total de la plateforme et de tous les serveurs',
      permissions: [
        { name: 'Gérer le serveur', description: 'Modifier les paramètres du serveur', granted: true },
        { name: 'Gérer les rôles', description: 'Créer, modifier et supprimer les rôles', granted: true },
        { name: 'Gérer les channels', description: 'Créer, modifier et supprimer les channels', granted: true },
        { name: 'Expulser des membres', description: 'Expulser des utilisateurs du serveur', granted: true },
        { name: 'Bannir des membres', description: 'Bannir définitivement des utilisateurs', granted: true },
        { name: 'Gérer les messages', description: 'Supprimer et épingler les messages', granted: true },
        { name: 'Mentionner @everyone', description: 'Mentionner tous les membres', granted: true },
        { name: 'Voir les logs', description: 'Accéder à l\'historique des actions', granted: true },
        { name: 'Gérer les webhooks', description: 'Créer et gérer les webhooks', granted: true },
        { name: 'Gérer les émojis', description: 'Ajouter et supprimer des émojis personnalisés', granted: true },
        { name: 'Transférer la propriété', description: 'Transférer le serveur à un autre utilisateur', granted: true },
        { name: 'Supprimer le serveur', description: 'Supprimer définitivement le serveur', granted: true },
      ],
    },
    {
      name: 'Modérateur',
      color: 'oklch(70.5% 0.213 47.604)',
      gradient: 'from-orange-600 to-orange-500',
      badge: 'Créateur de serveur',
      description: 'Propriétaire et créateur du serveur avec tous les droits de gestion',
      permissions: [
        { name: 'Gérer le serveur', description: 'Modifier les paramètres du serveur', granted: true },
        { name: 'Gérer les rôles', description: 'Créer, modifier et supprimer les rôles', granted: true },
        { name: 'Gérer les channels', description: 'Créer, modifier et supprimer les channels', granted: true },
        { name: 'Expulser des membres', description: 'Expulser des utilisateurs du serveur', granted: true },
        { name: 'Bannir des membres', description: 'Bannir définitivement des utilisateurs', granted: true },
        { name: 'Gérer les messages', description: 'Supprimer et épingler les messages', granted: true },
        { name: 'Mentionner @everyone', description: 'Mentionner tous les membres', granted: true },
        { name: 'Voir les logs', description: 'Accéder à l\'historique des actions', granted: true },
        { name: 'Gérer les webhooks', description: 'Créer et gérer les webhooks', granted: true },
        { name: 'Gérer les émojis', description: 'Ajouter et supprimer des émojis personnalisés', granted: true },
        { name: 'Transférer la propriété', description: 'Transférer le serveur à un autre utilisateur', granted: true },
        { name: 'Supprimer le serveur', description: 'Supprimer définitivement le serveur', granted: true },
      ],
    },
    {
      name: 'Membre',
      color: 'oklch(70.5% 0.213 47.604)',
      gradient: 'from-orange-600 to-orange-500',
      badge: 'Utilisateur Standard',
      description: 'Membre standard avec permissions de base - peut créer ses propres serveurs',
      permissions: [
        { name: 'Gérer le serveur', description: 'Modifier les paramètres du serveur', granted: false },
        { name: 'Gérer les rôles', description: 'Créer, modifier et supprimer les rôles', granted: false },
        { name: 'Gérer les channels', description: 'Créer, modifier et supprimer les channels', granted: false },
        { name: 'Expulser des membres', description: 'Expulser des utilisateurs du serveur', granted: false },
        { name: 'Bannir des membres', description: 'Bannir définitivement des utilisateurs', granted: false },
        { name: 'Gérer les messages', description: 'Supprimer et épingler les messages', granted: false },
        { name: 'Mentionner @everyone', description: 'Mentionner tous les membres', granted: false },
        { name: 'Voir les logs', description: 'Accéder à l\'historique des actions', granted: false },
        { name: 'Gérer les webhooks', description: 'Créer et gérer les webhooks', granted: false },
        { name: 'Gérer les émojis', description: 'Ajouter et supprimer des émojis personnalisés', granted: false },
        { name: 'Transférer la propriété', description: 'Transférer le serveur à un autre utilisateur', granted: false },
        { name: 'Supprimer le serveur', description: 'Supprimer définitivement le serveur', granted: false },
      ],
    },
  ];

  const [selectedRole, setSelectedRole] = useState<string>(roles[1].name); 
  const currentRole = roles.find(r => r.name === selectedRole) || roles[1];

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 -left-20 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 -right-20 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-12 md:py-20">
        <div className="max-w-5xl mx-auto mb-12 text-center">
          <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 bg-orange-500/10 border border-orange-500/30 rounded-full backdrop-blur-sm">
            <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></span>
            <span className="text-orange-400 text-sm font-semibold tracking-wider uppercase">
              Paramètres
            </span>
          </div>
          
          <h1 className="text-6xl md:text-7xl font-black mb-6 leading-none tracking-tight">
            <span className="bg-gradient-to-br from-white via-gray-200 to-gray-300 bg-clip-text text-transparent">
              Rôles &
            </span>
            <br />
            <span className="bg-gradient-to-r from-orange-500 via-orange-400 to-orange-500 bg-clip-text text-transparent">
              Permissions
            </span>
          </h1>
          
          <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto font-light leading-relaxed">
            Découvrez les différents rôles et leurs permissions associées
          </p>
        </div>

        {}
        <div className="max-w-5xl mx-auto mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {roles.map((role) => (
              <button
                key={role.name}
                onClick={() => setSelectedRole(role.name)}
                className={`p-6 rounded-2xl border-2 transition-all duration-300 ${
                  selectedRole === role.name
                    ? 'border-orange-500 bg-orange-500/10 shadow-lg shadow-orange-500/20 scale-105'
                    : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-700 hover:bg-zinc-900/70'
                }`}
              >
                <div className="flex flex-col items-center gap-3">
                  <h3 className="text-xl font-bold text-white">{role.name}</h3>
                  {role.badge && (
                    <span className="text-xs px-3 py-1 bg-zinc-800 text-gray-400 rounded-full font-medium">
                      {role.badge}
                    </span>
                  )}
                  <div
                    className="w-16 h-1 rounded-full"
                    style={{ backgroundColor: role.color }}
                  ></div>
                </div>
              </button>
            ))}
          </div>
        </div>

        
        <div className="max-w-5xl mx-auto">
          <div className="bg-zinc-900/50 backdrop-blur-xl border border-orange-500/50 rounded-3xl overflow-hidden transition-all duration-300 shadow-lg shadow-orange-600/30">
            
            <div
              className="h-2 bg-gradient-to-r"
              style={{
                background: `linear-gradient(to right, ${currentRole.color}, ${currentRole.color}dd)`,
              }}
            ></div>

            <div className="p-8 md:p-12">
              
              {}
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-3xl font-black text-white">{currentRole.name}</h2>
                  {currentRole.badge && (
                    <span className="text-xs px-3 py-1 bg-orange-500/20 text-orange-400 rounded-full font-semibold border border-orange-500/30">
                      {currentRole.badge}
                    </span>
                  )}
                </div>
                <p className="text-gray-400 text-lg">{currentRole.description}</p>
              </div>

              <div className="h-px bg-zinc-800/50 mb-8"></div>

              {}
              <div>
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                  <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  Permissions
                </h3>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {currentRole.permissions.map((permission, index) => (
                    <div
                      key={index}
                      className={`p-5 rounded-xl border transition-all duration-300 ${
                        permission.granted
                          ? 'bg-green-500/5 border-green-500/30 hover:border-green-500/50'
                          : 'bg-red-500/5 border-red-500/30 hover:border-red-500/50'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
                          permission.granted ? 'bg-green-500/20' : 'bg-red-500/20'
                        }`}>
                          {permission.granted ? (
                            <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className={`font-semibold mb-1 ${
                            permission.granted ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {permission.name}
                          </h4>
                          <p className="text-sm text-gray-500 leading-relaxed">
                            {permission.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {}
              <div className="mt-8 pt-8 border-t border-zinc-800/50">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-6 bg-zinc-950/40 rounded-xl border border-zinc-800/30">
                    <div className="text-4xl font-black text-white mb-2">
                      {currentRole.permissions.filter(p => p.granted).length}
                    </div>
                    <div className="text-sm text-gray-500 uppercase tracking-wide font-semibold">
                      Permissions accordées
                    </div>
                  </div>
                  <div className="text-center p-6 bg-zinc-950/40 rounded-xl border border-zinc-800/30">
                    <div className="text-4xl font-black text-white mb-2">
                      {currentRole.permissions.filter(p => !p.granted).length}
                    </div>
                    <div className="text-sm text-gray-500 uppercase tracking-wide font-semibold">
                      Permissions refusées
                    </div>
                  </div>
                  <div className="text-center p-6 bg-zinc-950/40 rounded-xl border border-zinc-800/30">
                    <div className="text-4xl font-black text-white mb-2">
                      {Math.round((currentRole.permissions.filter(p => p.granted).length / currentRole.permissions.length) * 100)}%
                    </div>
                    <div className="text-sm text-gray-500 uppercase tracking-wide font-semibold">
                      Niveau d'accès
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {}
          <div className="mt-8 p-6 bg-orange-500/10 border border-orange-500/30 rounded-2xl backdrop-blur-sm">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="text-orange-400 font-bold mb-2">À propos de la hiérarchie</h4>
                <p className="text-gray-400 text-sm leading-relaxed mb-3">
                  <strong className="text-orange-300">Administrateurs</strong> ont un contrôle total sur la plateforme. 
                  Les <strong className="text-orange-300">Modérateurs</strong> sont les créateurs et propriétaires de leurs serveurs avec tous les droits de gestion. 
                  Les <strong className="text-orange-300">Membres</strong> peuvent rejoindre des serveurs et créer leurs propres serveurs 
                  (devenant ainsi Modérateurs de leurs serveurs créés).
                </p>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Tout membre peut créer un serveur et devenir Modérateur de ce serveur</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
