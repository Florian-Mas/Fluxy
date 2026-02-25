'use client';

import { useState, useEffect } from 'react';
import ProfileCard from './ProfileCard';

interface User {
  id: number;
  username: string;
  avatar: string;
  email?: string;
  status: 'online' | 'offline';
  role: string;
  roleColor: string;
}
interface CurrentUser extends User {}

interface MembersSidebarProps {
  members?: User[];
  currentUser: CurrentUser;
  currentServerId?: number;
}

interface Server {
  id: number;
  name: string;
  image?: string;
}

export default function MemberServeur({ members = [], currentUser, currentServerId }: MembersSidebarProps) {
  const safeMembers = members || [];
  const [selectedMember, setSelectedMember] = useState<User | null>(null);
  const [currentUserServers, setCurrentUserServers] = useState<Server[]>([]);
  const [commonServers, setCommonServers] = useState<Server[]>([]);
  const [isKicking, setIsKicking] = useState(false);

  // Vérifier si l'utilisateur actuel peut exclure des membres
  const canKickMembers = currentUser && (currentUser.role === "Fondateur" || currentUser.role === "Admin");


  // Charger les serveurs de l'utilisateur actuel
  useEffect(() => {
    const loadCurrentUserServers = async () => {
      try {
        const res = await fetch("http://localhost:3000/api/user-servers", {
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          if (data.servers && Array.isArray(data.servers)) {
            const formatted: Server[] = data.servers.map((s: any) => ({
              id: s.id || s.server_id,
              name: s.name || s.server_name || "Serveur sans nom",
              image: s.image || s.server_image,
            }));
            setCurrentUserServers(formatted);
          }
        }
      } catch (error) {
        console.error("Erreur lors du chargement des serveurs:", error);
      }
    };

    loadCurrentUserServers();
  }, []);

  // Calculer les serveurs en commun quand un membre est sélectionné
  useEffect(() => {
    if (!selectedMember || currentUserServers.length === 0) {
      setCommonServers([]);
      return;
    }

    const loadMemberServers = async () => {
      try {
        // Vérifier pour chaque serveur si le membre sélectionné est aussi membre
        const common: Server[] = [];
        
        for (const server of currentUserServers) {
          try {
            const res = await fetch(
              `http://localhost:3000/api/server-members?server_id=${server.id}`,
              { credentials: "include" }
            );
            if (res.ok) {
              const data = await res.json();
              if (data.members && Array.isArray(data.members)) {
                // Vérifier si le membre sélectionné est dans ce serveur
                const isMember = data.members.some((m: any) => m.user_id === selectedMember.id);
                if (isMember) {
                  common.push(server);
                }
              }
            }
          } catch (error) {
            console.error(`Erreur lors de la vérification du serveur ${server.id}:`, error);
          }
        }
        
        setCommonServers(common);
      } catch (error) {
        console.error("Erreur lors du calcul des serveurs en commun:", error);
        setCommonServers([]);
      }
    };

    loadMemberServers();
  }, [selectedMember, currentUserServers]);

  const StatusIndicator = ({ status }: { status: User['status'] }) => {
    return (
      <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#2f3136] ${
        status === 'online' ? 'bg-green-500' : 'bg-gray-500'
      }`}></div>
    );
  };

  const handleKickMember = async (memberId: number, memberRole: string) => {
    if (!currentServerId) return;
    
    // Ne pas permettre d'exclure le fondateur
    if (memberRole === "Fondateur") {
      alert("Vous ne pouvez pas exclure le fondateur du serveur");
      return;
    }

    // Un admin ne peut pas exclure un autre admin (seul le fondateur peut)
    if (currentUser?.role === "Admin" && memberRole === "Admin") {
      alert("Seul le fondateur peut exclure un administrateur");
      return;
    }

    if (!window.confirm(`Êtes-vous sûr de vouloir exclure ce membre du serveur ?`)) {
      return;
    }

    setIsKicking(true);
    try {
      const res = await fetch('/api/kick-member', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          server_id: currentServerId,
          user_id: memberId,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        // Recharger la page pour mettre à jour la liste des membres
        window.location.reload();
      } else {
        alert(data.error || 'Erreur lors de l\'exclusion du membre');
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de l\'exclusion du membre');
    } finally {
      setIsKicking(false);
    }
  };

  const MemberItem = ({ member }: { member: User }) => {
    const canKickThisMember = canKickMembers && 
      currentUser && 
      currentUser.id !== member.id && 
      member.role !== "Fondateur" &&
      (currentUser.role === "Fondateur" || member.role !== "Admin");

    return (
      <div 
        className="flex items-center px-2 py-1.5 mx-2 rounded cursor-pointer hover:bg-[#40444b] group"
        onClick={() => setSelectedMember(member)}
      >
        <div className="relative flex-shrink-0 w-8 h-8">
          <img
            src={member.avatar}
            alt={member.username}
            className="w-full h-full rounded-full object-cover"
            onError={(e) => {
              // Fallback si l'image ne charge pas
              const target = e.target as HTMLImageElement;
              target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.username}`;
            }}
          />
          <StatusIndicator status={member.status} />
        </div>
        <div className="ml-2 flex-1 min-w-0">
          <div 
            className="text-sm font-medium group-hover:text-white truncate" 
            style={{ color: '#dcddde' }}
          >
            {member.username}
          </div>
          <div 
            className="text-xs truncate" 
            style={{ color: member.roleColor }}
          >
            {member.role}
          </div>
        </div>
        {canKickThisMember && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleKickMember(member.id, member.role);
            }}
            disabled={isKicking}
            className="ml-2 px-2 py-1 text-xs bg-red-600 hover:bg-red-700 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
            title="Exclure ce membre"
          >
            {isKicking ? '...' : '✕'}
          </button>
        )}
      </div>
    );
  };

  const MemberGroup = ({ title, count, members }: { title: string; count: number; members: User[] }) => (
    <>
      {members.length > 0 && (
        <div className="mt-4">
          <div className="px-2 mb-1">
            <span className="text-xs font-semibold text-[#8e9297] uppercase tracking-wide">
              {title} - {count}
            </span>
          </div>
          {members.map((member) => (
            <MemberItem key={member.id} member={member} />
          ))}
        </div>
      )}
    </>
  );
  const UserProfileBar = ({ user }: { user: User }) => (
  <div className="h-14 bg-[#292b2f] border-t border-black/20 px-3 flex items-center">
    <div className="relative w-9 h-9">
      <img
        src={user.avatar}
        alt={user.username}
        className="w-full h-full rounded-full object-cover"
        onError={(e) => {
          // Fallback si l'image ne charge pas
          const target = e.target as HTMLImageElement;
          target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`;
        }}
      />
      <StatusIndicator status={user.status} />
    </div>

    <div className="ml-3 min-w-0">
      <div className="text-sm font-medium text-white truncate">
        {user.username}
      </div>
    </div>
  </div>
);


  return (
    <>
      <div className="w-60 bg-[#2f3136] flex flex-col border-l border-black/20">
        <div className="h-12 border-b border-black/20 flex items-center px-4 shadow-sm">
          <span className="text-sm font-semibold text-orange-500">
            Membres - ({safeMembers.length})
          </span>
        </div>

        
        <div className="flex-1 overflow-y-auto scrollbar-hide py-3">
          {safeMembers.length === 0 ? (
            <div className="text-center text-[#8e9297] text-sm mt-8 px-4">
              Aucun membre dans ce serveur
            </div>
          ) : (
            <>
              {safeMembers.map((member) => (
                <MemberItem key={member.id} member={member} />
              ))}
            </>
          )}
        </div>
      </div>

      {selectedMember && (
        <ProfileCard
          userId={selectedMember.id}
          username={selectedMember.username}
          avatar={selectedMember.avatar}
          email={selectedMember.email}
          status={selectedMember.status}
          role={selectedMember.role}
          roleColor={selectedMember.roleColor}
          commonServers={commonServers}
          onClose={() => setSelectedMember(null)}
          canKick={
            canKickMembers && 
            currentUser && 
            currentUser.id !== selectedMember.id && 
            selectedMember.role !== "Fondateur" &&
            (currentUser.role === "Fondateur" || selectedMember.role !== "Admin")
          }
          onKick={() => handleKickMember(selectedMember.id, selectedMember.role)}
          isKicking={isKicking}
        />
      )}
    </>
  );
}

// Données d'exemple pour tester
export const mockMembers: User[] = [
  {
    id: 1,
    username: 'Admin',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin',
    status: 'online',
    role: 'Administrateur',
    roleColor: 'oklch(70.5% 0.213 47.604)',
  },
  {
    id: 2,
    username: 'Modérateur',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Moderator',
    status: 'online',
    role: 'Modérateur',
    roleColor: 'oklch(70.5% 0.213 47.604)',
  },
  {
    id: 3,
    username: 'JeanDupont',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jean',
    status: 'online',
    role: 'Membre',
    roleColor: 'oklch(70.5% 0.213 47.604)',
  },
  {
    id: 4,
    username: 'MarieMartin',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marie',
    status: 'online',
    role: 'Membre',
    roleColor: 'oklch(70.5% 0.213 47.604)',
  },
  {
    id: 5,
    username: 'PaulDurand',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Paul',
    status: 'offline',
    role: 'Administrateur ',
    roleColor: 'oklch(70.5% 0.213 47.604)',
  },
  {
    id: 6,
    username: 'SophieBernard',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sophie',
    status: 'offline',
    role: 'Membre',
    roleColor: 'oklch(70.5% 0.213 47.604)',
  },
  {
    id: 7,
    username: 'LucasRobert',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lucas',
    status: 'online',
    role: 'Membre',
    roleColor: 'oklch(70.5% 0.213 47.604)',
  },
];




