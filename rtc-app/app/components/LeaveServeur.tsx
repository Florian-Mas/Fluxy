// apparition de la page RolesServeur quand un owner veut quitter le serveur, afin qu'il mette une autre personne à sa place avant de partir//

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface LeaveServeurProps {
  serverId: number | null;
}

interface Permission {
  id: string;
  name: string;
  description: string;
}

interface Role {
  id: string;
  name: string;
  color: string;
  permissions: string[]; // IDs des permissions accordées
  membersCount: number;
  isDefault?: boolean; // Les rôles par défaut ne peuvent pas être supprimés
}

const AVAILABLE_PERMISSIONS: Permission[] = [
  { id: 'manage_server', name: 'Gérer le serveur', description: 'Modifier les paramètres du serveur' },
  { id: 'manage_roles', name: 'Gérer les rôles', description: 'Créer, modifier et supprimer les rôles' },
  { id: 'manage_channels', name: 'Gérer les channels', description: 'Créer, modifier et supprimer les channels' },
  { id: 'kick_members', name: 'Expulser des membres', description: 'Expulser des utilisateurs du serveur' },
  { id: 'ban_members', name: 'Bannir des membres', description: 'Bannir définitivement des utilisateurs' },
  { id: 'manage_messages', name: 'Gérer les messages', description: 'Supprimer et épingler les messages' },
  { id: 'mention_everyone', name: 'Mentionner @everyone', description: 'Mentionner tous les membres' },
  { id: 'view_logs', name: 'Voir les logs', description: 'Accéder à l\'historique des actions' },
  { id: 'manage_webhooks', name: 'Gérer les webhooks', description: 'Créer et gérer les webhooks' },
  { id: 'manage_emojis', name: 'Gérer les émojis', description: 'Ajouter et supprimer des émojis personnalisés' },
];



export default function LeaveServeur({ serverId }: LeaveServeurProps) {
  const router = useRouter();
  const [isOwner, setIsOwner] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [error, setError] = useState('');
  const [membersFromApi, setMembersFromApi] = useState<Array<{ user_id: number; role: string }>>([]);
  const [usernamesById, setUsernamesById] = useState<Record<number, string>>({});
  const [newOwnerId, setNewOwnerId] = useState<number | null>(null);

  useEffect(() => {
    const checkUserRole = async () => {
      if (!serverId) {
        router.push('/channels');
        return;
      }

      try {
        const response = await fetch(`http://localhost:3000/api/user-servers`, {
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          if (data.servers && Array.isArray(data.servers)) {
            const server = data.servers.find((s: any) => s.id === serverId);
            if (server) {
              setIsOwner(server.is_owner || false);
            } else {
              router.push('/channels');
            }
          }
        }
      } catch (err) {
        console.error('Erreur lors de la vérification du rôle:', err);
        router.push('/channels');
      }
    };

    checkUserRole();
  }, [serverId, router]);

  // Charger la liste réelle des membres du serveur + usernames
  useEffect(() => {
    const loadMembersAndUsers = async () => {
      if (!serverId) return;
      try {
        const resMembers = await fetch(
          `http://localhost:3000/api/server-members?server_id=${serverId}`,
          { credentials: 'include' }
        );
        if (resMembers.ok) {
          const data = await resMembers.json();
          if (data.members && Array.isArray(data.members)) {
            setMembersFromApi(data.members);
          }
        }

        const resUsers = await fetch("/api/allusers", {
          credentials: "include",
        });
        if (resUsers.ok) {
          const dataUsers = await resUsers.json();
          const map: Record<number, string> = {};
          if (Array.isArray(dataUsers)) {
            dataUsers.forEach((u: any) => {
              if (u.id !== undefined) {
                const idNum = Number(u.id);
                if (!Number.isNaN(idNum)) {
                  map[idNum] = u.username || u.email || String(u.id);
                }
              }
            });
          }
          setUsernamesById(map);
        }
      } catch (err) {
        console.error("Erreur lors du chargement des membres/utilisateurs:", err);
      }
    };

    loadMembersAndUsers();
  }, [serverId]);
  const [roles, setRoles] = useState<Role[]>([
  {
    id: 'owner',
    name: 'Owner',
    color: '#f97316',
    permissions: AVAILABLE_PERMISSIONS.map(p => p.id), 
    membersCount: 1,
    isDefault: true,
  },
  {
    id: 'admin',
    name: 'Admin',
    color: '#ef4444',
    permissions: [
      'manage_channels',
      'kick_members',
      'ban_members',
      'manage_messages',
    ],
    membersCount: 2,
    isDefault: true,
  },
  {
    id: 'member',
    name: 'Membre',
    color: '#99aab5',
    permissions: [],
    membersCount: 12,
    isDefault: true,
  },
]);

  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(roles[0].id);
  const [isCreating, setIsCreating] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);

  const selectedRole = roles.find(r => r.id === selectedRoleId);

  const handleCreateRole = () => {
    const newRole: Role = {
      id: Date.now().toString(),
      name: 'Nouveau rôle',
      color: '#99aab5',
      permissions: [],
      membersCount: 0,
      isDefault: false,
    };
    setRoles([...roles, newRole]);
    setSelectedRoleId(newRole.id);
    setIsCreating(true);
    setEditingRole(newRole);
  };

  const handleUpdateRole = (roleId: string, updates: Partial<Role>) => {
    setRoles(roles.map(role => 
      role.id === roleId ? { ...role, ...updates } : role
    ));
  };

  const handleDeleteRole = (roleId: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce rôle ?')) {
      setRoles(roles.filter(role => role.id !== roleId));
      setSelectedRoleId(roles[0]?.id || null);
      setEditingRole(null);
    }
  };

  const togglePermission = (roleId: string, permissionId: string) => {
    const role = roles.find(r => r.id === roleId);
    if (!role) return;

    const hasPermission = role.permissions.includes(permissionId);
    const newPermissions = hasPermission
      ? role.permissions.filter(p => p !== permissionId)
      : [...role.permissions, permissionId];

    handleUpdateRole(roleId, { permissions: newPermissions });
  };

  interface ServerMember {
  id: string;
  username: string;
  roleId: 'owner' | 'admin' | 'member';
}

const [members, setMembers] = useState<ServerMember[]>([
  { id: '1', username: 'OwnerUser', roleId: 'owner' },
  { id: '2', username: 'AdminUser', roleId: 'admin' },
  { id: '3', username: 'Jean', roleId: 'member' },
  { id: '4', username: 'Marie', roleId: 'member' },
]);

const addMemberToRole = (memberId: string, roleId: 'owner' | 'admin' | 'member') => {
  setMembers(prev =>
    prev.map(m =>
      m.id === memberId ? { ...m, roleId } : m
    )
  );
};



  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 -left-20 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 -right-20 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-12 md:py-20">
        <div className="max-w-6xl mx-auto mb-12 text-center">
        
          
         
          
          <p className="text-white text-lg md:text-xl max-w-2xl mx-auto font-light leading-relaxed">
            {isOwner 
              ? "Avant de quitter le serveur, vous devez donner le rôle de owner à un autre utilisateur."
              : "Vous êtes sur le point de quitter ce serveur. Cette action est irréversible."
            }
          </p>
        </div>

        
        <div className="max-w-6xl mx-auto">
          {isOwner ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
            <div className="w-full max-w-md p-8 shadow-lg shadow-orange-600/50 rounded-2xl border border-orange-500 transition-all duration-300 ease-out hover:shadow-2xl hover:shadow-orange-600/70 hover:-translate-y-2">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-white">Rôles</h2>
                 
                </div>

                <div className="space-y-2">
                  {roles.map((role) => (
                    <button
                      key={role.id}
                      onClick={() => {
                        setSelectedRoleId(role.id);
                        setIsCreating(false);
                        setEditingRole(null);
                      }}
                      className={`w-full p-4 rounded-xl border-2 transition-all duration-300 text-left ${
                        selectedRoleId === role.id
                          ? 'border-orange-500 bg-orange-500/10'
                          : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded-full flex-shrink-0"
                          style={{ backgroundColor: role.color }}
                        ></div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-white truncate">{role.name}</div>
                          <div className="text-xs text-gray-500">{role.membersCount} membre{role.membersCount > 1 ? 's' : ''}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            
            <div className="lg:col-span-2">
              {selectedRole ? (
                <div className="bg-zinc-900/50 backdrop-blur-xl border border-orange-500/50 rounded-2xl overflow-hidden shadow-lg shadow-orange-600/30 transition-all duration-300 ease-out hover:shadow-2xl hover:shadow-orange-600/70 hover:-translate-y-2">

                  <div
                    className="h-2 bg-gradient-to-r"
                    style={{ backgroundColor: selectedRole.color }}
                  ></div>

                  <div className="p-8">
                    <div className="mb-8">
                      <label className="block text-sm font-bold text-gray-200 mb-3 tracking-wide uppercase">
                        Nom du rôle
                      </label>
                      <input
                        type="text"
                        value={selectedRole.name}
                        onChange={(e) => handleUpdateRole(selectedRole.id, { name: e.target.value })}
                        disabled={selectedRole.isDefault}
                        className="w-full px-4 py-3 bg-zinc-950/60 border-2 border-zinc-800 rounded-xl text-white focus:border-orange-500 focus:outline-none transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </div>

                                        
                    <div className="mt-8">
                    <label className="block text-sm font-bold text-gray-200 mb-4 tracking-wide uppercase">
                        Membres avec ce rôle
                    </label>

                    <div className="space-y-2">
                        {members
                        .filter(m => m.roleId === selectedRole.id)
                        .map(member => (
                            <div
                            key={member.id}
                            className="flex items-center justify-between px-4 py-3 bg-zinc-950/60 border border-zinc-800 rounded-xl"
                            >
                            <span className="text-white font-medium">
                                {member.username}
                            </span>

                            {(selectedRole.id === 'owner' || selectedRole.id === 'admin' || selectedRole.id === 'member') && (
                                <button
                                onClick={() =>
                                    setMembers(members.filter(m => m.id !== member.id))
                                }
                                className="text-red-400 hover:text-red-300 text-sm font-semibold"
                                >
                                Retirer
                                </button>
                            )}
                            </div>
                        ))}

                        {members.filter(m => m.roleId === selectedRole.id).length === 0 && (
                        <p className="text-sm text-gray-500">
                            Aucun membre avec ce rôle
                        </p>
                        )}

                                                <div className="mt-6">
                        <label className="block text-sm font-bold text-gray-200 mb-3 tracking-wide uppercase">
                            Ajouter un membre
                        </label>

                        <select
                            defaultValue=""
                            onChange={(e) => {
                            if (!e.target.value) return;
                            addMemberToRole(e.target.value, selectedRole.id as any);
                            e.currentTarget.value = '';
                            }}
                            className="w-full px-4 py-3 bg-zinc-950/60 border-2 border-zinc-800 rounded-xl text-white focus:border-orange-500 focus:outline-none"
                        >
                            <option value="">Sélectionner un membre</option>
                            {members
                            .filter(m => m.roleId !== selectedRole.id)
                            .map(member => (
                                <option key={member.id} value={member.id}>
                                {member.username}
                                </option>
                            ))}
                        </select>
                        </div>
                    </div>
                    </div>

                       {}
                    <div className="mt-8 pt-6 border-t border-zinc-800/50">
                      {error && (
                        <div className="mb-4 bg-red-500/10 border border-red-500/50 rounded-xl p-4">
                          <p className="text-red-400 text-sm">{error}</p>
                        </div>
                      )}
                      {isOwner && (
                        <div className="mb-6">
                          <label className="block text-sm font-bold text-gray-200 mb-3 tracking-wide uppercase">
                            Choisir le nouveau fondateur
                          </label>
                          <select
                            value={newOwnerId ?? ""}
                            onChange={(e) => {
                              const v = e.target.value;
                              setNewOwnerId(v ? Number(v) : null);
                            }}
                            className="w-full px-4 py-3 bg-zinc-950/60 border-2 border-zinc-800 rounded-xl text-white focus:border-orange-500 focus:outline-none"
                          >
                            <option value="">Sélectionner un membre</option>
                            {membersFromApi
                              .filter((m) => m.role !== "fondateur")
                              .map((m) => (
                                <option key={m.user_id} value={m.user_id}>
                                  {usernamesById[m.user_id] || `Membre #${m.user_id}`}{" "}
                                  {m.role === "admin" ? "(Admin)" : ""}
                                </option>
                              ))}
                          </select>
                          <p className="text-xs text-gray-500 mt-1">
                            Le membre choisi deviendra le nouveau fondateur. Vous perdrez ce rôle.
                          </p>
                        </div>
                      )}
                      <button
                        onClick={async () => {
                          if (!serverId) return;

                          if (isOwner) {
                            if (!newOwnerId || Number.isNaN(newOwnerId)) {
                              setError('Vous devez choisir un nouveau fondateur avant de quitter.');
                              return;
                            }
                          }
                          
                          // Confirmer l'action
                          if (!window.confirm('Êtes-vous sûr de vouloir quitter le serveur ? Cette action est irréversible.')) {
                            return;
                          }

                          setIsLeaving(true);
                          setError('');

                          try {
                            // Si owner : transférer la propriété avant de quitter
                            if (isOwner && newOwnerId && !Number.isNaN(newOwnerId)) {
                              const resSwitch = await fetch('http://localhost:3000/api/switch-owner', {
                                method: 'POST',
                                headers: {
                                  'Content-Type': 'application/json',
                                },
                                credentials: 'include',
                                body: JSON.stringify({ server_id: serverId, new_owner_id: newOwnerId }),
                              });

                              const dataSwitch = await resSwitch.json();
                              if (!resSwitch.ok) {
                                setError(dataSwitch.error || 'Erreur lors du transfert de propriété.');
                                setIsLeaving(false);
                              return;
                            }
                          }
                            const response = await fetch('http://localhost:3000/api/leave-server', {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json',
                              },
                              credentials: 'include',
                              body: JSON.stringify({ server_id: serverId }),
                            });

                            const data = await response.json();

                            if (!response.ok) {
                              setError(data.error || 'Erreur lors de la sortie du serveur.');
                              setIsLeaving(false);
                              return;
                            }

                            // Rediriger vers la page channels après succès
                            router.push('/channels');
                          } catch (err) {
                            console.error('Erreur lors de la sortie du serveur:', err);
                            setError('Erreur réseau lors de la sortie du serveur.');
                            setIsLeaving(false);
                          }
                        }}
                        disabled={isLeaving}
                        className="w-full py-5 px-6
                                 bg-gradient-to-r from-red-600 to-red-500
                                 hover:from-red-500 hover:to-red-600
                                 text-white font-bold text-lg rounded-2xl
                                 transform transition-all duration-300
                                 hover:scale-[1.02] active:scale-[0.98]
                                 relative overflow-hidden group
                                 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent 
                                      translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700"></div>
                        
                        <span className="relative flex items-center justify-center gap-3">
                          {isLeaving ? (
                            <>
                              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Sortie en cours...
                            </>
                          ) : (
                            <>
                              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {isOwner ? 'Valider et quitter le serveur' : 'Quitter le serveur'}
                            </>
                          )}
                        </span>
                      </button>
                    </div>

                    <div className="h-px bg-zinc-800/50 mb-8"></div>
                 </div>


                </div>
              ) : (
                <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-2xl p-12 text-center">
                  <p className="text-gray-500">Sélectionnez un rôle pour le modifier</p>
                </div>
              )}
            </div>
          </div>
          ) : (
            // Interface simplifiée pour les admins/membres
            <div className="max-w-2xl mx-auto">
              <div className="bg-zinc-900/50 backdrop-blur-xl border border-orange-500/50 rounded-2xl overflow-hidden shadow-lg shadow-orange-600/30 p-8">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-white mb-4">Quitter le serveur</h2>
                  <p className="text-gray-400">
                    Êtes-vous sûr de vouloir quitter ce serveur ? Vous perdrez l'accès à tous les channels et messages.
                  </p>
                </div>

                {error && (
                  <div className="mb-6 bg-red-500/10 border border-red-500/50 rounded-xl p-4">
                    <p className="text-red-400 text-sm">{error}</p>
                  </div>
                )}

                <div className="flex gap-4">
                  <button
                    onClick={() => router.push('/channels')}
                    className="flex-1 py-3 px-6 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-xl transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={async () => {
                      if (!serverId) return;

                      if (!window.confirm('Êtes-vous sûr de vouloir quitter le serveur ? Cette action est irréversible.')) {
                        return;
                      }

                      setIsLeaving(true);
                      setError('');

                      try {
                        const response = await fetch('http://localhost:3000/api/leave-server', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                          },
                          credentials: 'include',
                          body: JSON.stringify({ server_id: serverId }),
                        });

                        const data = await response.json();

                        if (!response.ok) {
                          setError(data.error || 'Erreur lors de la sortie du serveur.');
                          setIsLeaving(false);
                          return;
                        }

                        router.push('/channels');
                      } catch (err) {
                        console.error('Erreur lors de la sortie du serveur:', err);
                        setError('Erreur réseau lors de la sortie du serveur.');
                        setIsLeaving(false);
                      }
                    }}
                    disabled={isLeaving}
                    className="flex-1 py-3 px-6 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-600 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLeaving ? 'Sortie en cours...' : 'Quitter le serveur'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}