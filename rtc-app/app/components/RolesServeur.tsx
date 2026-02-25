'use client';

import { useState, useEffect } from 'react';

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

interface RolesServeurProps {
  serverId: number;
  members: Array<{ user_id: number; role: string }>;
  usernamesByNumericId: Record<number, string>;
  onClose: () => void;
}

export default function RolesServeur({ serverId, members, usernamesByNumericId, onClose }: RolesServeurProps) {
  // Calculer les rôles à partir des membres réels
  const [roles, setRoles] = useState<Role[]>(() => {
    const ownerCount = members.filter(m => m.role === 'fondateur').length;
    const adminCount = members.filter(m => m.role === 'admin').length;
    const memberCount = members.filter(m => m.role === 'membre').length;
    
    return [
      {
        id: 'fondateur',
        name: 'Fondateur',
        color: '#f97316',
        permissions: AVAILABLE_PERMISSIONS.map(p => p.id), 
        membersCount: ownerCount,
        isDefault: true,
      },
      {
        id: 'admin',
        name: 'Admin',
        color: '#ef4444',
        permissions: [
          'manage_channels',
          'manage_messages',
        ],
        membersCount: adminCount,
        isDefault: true,
      },
      {
        id: 'membre',
        name: 'Membre',
        color: '#99aab5',
        permissions: [],
        membersCount: memberCount,
        isDefault: true,
      },
    ];
  });

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
    id: number;
    username: string;
    roleId: 'fondateur' | 'admin' | 'membre';
  }

  const [serverMembers, setServerMembers] = useState<ServerMember[]>(() => {
    return members.map(m => ({
      id: m.user_id,
      username: usernamesByNumericId[m.user_id] || `User ${m.user_id}`,
      roleId: (m.role === 'fondateur' ? 'fondateur' : m.role === 'admin' ? 'admin' : 'membre') as 'fondateur' | 'admin' | 'membre',
    }));
  });

  const [isUpdating, setIsUpdating] = useState(false);

  const handleSwitchOwner = async (memberId: number) => {
    if (!window.confirm("Donner le rôle Fondateur à cet utilisateur ? Vous perdrez ce rôle.")) {
      return;
    }
    setIsUpdating(true);
    try {
      const res = await fetch("http://localhost:3000/api/switch-owner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          server_id: serverId,
          new_owner_id: memberId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Erreur lors du transfert de propriété");
        return;
      }

      // Mettre à jour localement : l'ancien fondateur devient membre, le nouveau devient fondateur
      setServerMembers((prev) =>
        prev.map((m) => {
          if (m.id === memberId) {
            return { ...m, roleId: "fondateur" };
          }
          if (m.roleId === "fondateur" && m.id !== memberId) {
            return { ...m, roleId: "membre" };
          }
          return m;
        }),
      );
    } catch (err) {
      console.error("Erreur lors du transfert de propriété:", err);
      alert("Erreur réseau lors du transfert de propriété");
    } finally {
      setIsUpdating(false);
    }
  };

  const addMemberToRole = async (memberId: number, roleId: 'fondateur' | 'admin' | 'membre') => {
    // Ne pas permettre de changer le rôle du fondateur via cette fonction (géré par switch_owner)
    const member = serverMembers.find(m => m.id === memberId);
    if (member?.roleId === 'fondateur') {
      alert('Le rôle du fondateur ne peut pas être modifié');
      return;
    }

    setIsUpdating(true);
    try {
      const res = await fetch('/api/update-member-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          server_id: serverId,
          user_id: memberId,
          role: roleId,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        // Mettre à jour l'état local
        setServerMembers(prev =>
          prev.map(m =>
            m.id === memberId ? { ...m, roleId } : m
          )
        );
        
        // Mettre à jour les compteurs de rôles
        setRoles(prev => prev.map(role => {
          if (role.id === roleId) {
            return { ...role, membersCount: role.membersCount + 1 };
          } else if (member && role.id === member.roleId) {
            return { ...role, membersCount: Math.max(0, role.membersCount - 1) };
          }
          return role;
        }));
      } else {
        alert(data.error || 'Erreur lors de la mise à jour du rôle');
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la mise à jour du rôle');
    } finally {
      setIsUpdating(false);
    }
  };



  // Mettre à jour les compteurs quand les membres changent
  useEffect(() => {
    setRoles(prev => prev.map(role => {
      const count = serverMembers.filter(m => m.roleId === role.id).length;
      return { ...role, membersCount: count };
    }));
  }, [serverMembers]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-6xl max-h-[90vh] overflow-y-auto bg-black rounded-2xl border-2 border-orange-500 shadow-2xl shadow-orange-600/50 m-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 -left-20 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 -right-20 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 md:py-12">
        <div className="flex items-center justify-between mb-6 px-6 pt-6">
          <h1 className="text-3xl md:text-4xl font-black text-white">
            <span className="bg-gradient-to-r from-orange-500 via-orange-400 to-orange-500 bg-clip-text text-transparent">
              Gérer les Rôles
            </span>
          </h1>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center bg-zinc-800 hover:bg-zinc-700 rounded-full text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="max-w-6xl mx-auto mb-8 text-center">
          <p className="text-gray-400 text-sm md:text-base max-w-2xl mx-auto font-light leading-relaxed">
            Personnalisez les rôles de votre serveur. Le fondateur peut tout faire, l'admin peut gérer les channels et messages.
          </p>
        </div>

        
        <div className="max-w-6xl mx-auto">
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
                        {(selectedRole.id === 'fondateur'
                          ? serverMembers.filter(m => m.roleId !== 'fondateur')
                          : serverMembers.filter(m => m.roleId === selectedRole.id)
                        ).map(member => (
                            <div
                              key={member.id}
                              className="flex items-center justify-between px-4 py-3 bg-zinc-950/60 border border-zinc-800 rounded-xl"
                            >
                              <span className="text-white font-medium">
                                {member.username}
                              </span>

                              {selectedRole.id === 'fondateur' ? (
                                // Depuis l'onglet Fondateur : proposer de transférer le rôle à ce membre (s'il n'est pas déjà fondateur)
                                member.roleId !== 'fondateur' && (
                                  <button
                                    onClick={() => handleSwitchOwner(member.id)}
                                    className="text-orange-400 hover:text-orange-300 text-xs font-semibold"
                                    disabled={isUpdating}
                                  >
                                    Donner le rôle Fondateur
                                  </button>
                                )
                              ) : (
                                // Pour les autres rôles : bouton "Retirer" classique
                                <button
                                  onClick={() => {
                                    if (member.roleId !== 'membre') {
                                      addMemberToRole(member.id, 'membre');
                                    }
                                  }}
                                  className="text-red-400 hover:text-red-300 text-sm font-semibold"
                                  disabled={isUpdating}
                                >
                                  Retirer
                                </button>
                              )}
                            </div>
                          ))}

                        {(selectedRole.id === 'fondateur'
                          ? serverMembers.filter(m => m.roleId !== 'fondateur')
                          : serverMembers.filter(m => m.roleId === selectedRole.id)
                        ).length === 0 && (
                        <p className="text-sm text-gray-500">
                            Aucun membre avec ce rôle
                        </p>
                        )}

                        {selectedRole.id !== 'fondateur' && (
                            <div className="mt-6">
                                <label className="block text-sm font-bold text-gray-200 mb-3 tracking-wide uppercase">
                                    Ajouter un membre
                                </label>

                                <select
                                    defaultValue=""
                                    onChange={(e) => {
                                        if (!e.target.value) return;
                                        addMemberToRole(Number(e.target.value), selectedRole.id as 'admin' | 'membre');
                                        e.currentTarget.value = '';
                                    }}
                                    disabled={isUpdating}
                                    className="w-full px-4 py-3 bg-zinc-950/60 border-2 border-zinc-800 rounded-xl text-white focus:border-orange-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <option value="">Sélectionner un membre</option>
                                    {serverMembers
                                    .filter(m => m.roleId !== selectedRole.id && m.roleId !== 'fondateur')
                                    .map(member => (
                                        <option key={member.id} value={member.id}>
                                        {member.username}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                    </div>
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
        </div>
      </div>
      </div>
    </div>
  );
}
