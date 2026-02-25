"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "../components/Channels";
import ChannelChat from "../components/ChannelChat";
import MemberServeur from "../components/MemberServeur";
import RolesServeur from "../components/RolesServeur";

interface Server {
  id: number;
  name: string;
  image: string;
  is_owner?: boolean;
  is_admin?: boolean;
}

interface Channel {
  id: number;
  name: string;
  position: number;
}

interface ServerMember {
  user_id: number;
  role: "fondateur" | "admin" | "membre" | string;
  status?: "online" | "offline";
}

export default function ChannelsPage() {
  const router = useRouter();
  const [servers, setServers] = useState<Server[]>([]);
  const [selectedServerId, setSelectedServerId] = useState<number | null>(null);
  const [channelsByServer, setChannelsByServer] = useState<Record<number, Channel[]>>({});
  const [loadingServers, setLoadingServers] = useState(true);
  const [loadingChannels, setLoadingChannels] = useState(false);
  const [name, setName] = useState("");
  const [position, setPosition] = useState<number>(0);
  const [selectedChannelForEdit, setSelectedChannelForEdit] = useState<Channel | null>(null);
  const [selectedChannelForChat, setSelectedChannelForChat] = useState<Channel | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sidebarWidth, setSidebarWidth] = useState<number>(40);
  const isResizingRef = useRef(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinServerId, setJoinServerId] = useState<string>("");
  const [joinError, setJoinError] = useState<string | null>(null);
  const [serverMembers, setServerMembers] = useState<ServerMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [membersWidth, setMembersWidth] = useState<number>(280);
  const isResizingMembersRef = useRef(false);
  const [usernamesByNumericId, setUsernamesByNumericId] = useState<Record<number, string>>({});
  const [avatarsByNumericId, setAvatarsByNumericId] = useState<Record<number, string>>({});
  const [emailsByNumericId, setEmailsByNumericId] = useState<Record<number, string>>({});
  const [currentUser, setCurrentUser] = useState<{ id: number; username: string; avatar: string } | null>(null);
  const [showRolesModal, setShowRolesModal] = useState(false);

  const handleResizeMouseDown = () => {
    isResizingRef.current = true;
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizingRef.current) return;
      const container = document.body;
      const totalWidth = container.clientWidth || window.innerWidth;
      const newWidthPct = Math.min(
        70,
        Math.max(20, (e.clientX / totalWidth) * 100)
      );
      setSidebarWidth(newWidthPct);
    };

    const handleMouseUp = () => {
      if (isResizingRef.current) {
        isResizingRef.current = false;
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);


  useEffect(() => {
    const loadUsers = async () => {
      try {
        // Charger l'utilisateur actuel et le marquer comme connecté
        const userRes = await fetch("/api/user", {
          credentials: "include",
        });
        if (userRes.ok) {
          const userData = await userRes.json();
          if (userData.user_id) {
            const userId = Number(userData.user_id);
            if (!Number.isNaN(userId)) {
              setCurrentUser({
                id: userId,
                username: userData.username || userData.email?.split("@")[0] || "User",
                avatar: userData.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.username || userData.email}`,
              });
            }
          }
        }

        // Charger tous les utilisateurs
        const res = await fetch("http://localhost:3000/api/allusers", {
          credentials: "include",
        });
        if (!res.ok) return;
        const data = await res.json();
        if (!Array.isArray(data)) return;

        const nameMap: Record<number, string> = {};
        const avatarMap: Record<number, string> = {};
        const emailMap: Record<number, string> = {};
        data.forEach((u: any) => {
          // Mapper par id (numérique)
          if (u.id !== undefined && u.id !== null) {
            const n = Number(u.id);
            if (!Number.isNaN(n)) {
              nameMap[n] = u.username || u.email || String(u.id);
              if (u.avatar && typeof u.avatar === "string" && u.avatar.trim() !== '') {
                avatarMap[n] = u.avatar;
              }
              if (u.email && typeof u.email === "string") {
                emailMap[n] = u.email;
              }
            }
          }
          // Mapper aussi par auth_id si c'est un nombre (pour compatibilité)
          if (u.auth_id) {
            const authIdNum = Number(u.auth_id);
            if (!Number.isNaN(authIdNum)) {
              if (!nameMap[authIdNum]) {
                nameMap[authIdNum] = u.username || u.email || String(u.auth_id);
              }
              if (u.avatar && typeof u.avatar === "string" && u.avatar.trim() !== '' && !avatarMap[authIdNum]) {
                avatarMap[authIdNum] = u.avatar;
              }
              if (u.email && typeof u.email === "string" && !emailMap[authIdNum]) {
                emailMap[authIdNum] = u.email;
              }
            }
          }
        });

        setUsernamesByNumericId(nameMap);
        setAvatarsByNumericId(avatarMap);
        setEmailsByNumericId(emailMap);
      } catch {
      }
    };

    loadUsers();
  }, []);

  const handleMembersResizeMouseDown = () => {
    isResizingMembersRef.current = true;
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizingMembersRef.current) return;
      const totalWidth = document.body.clientWidth || window.innerWidth;
      const newWidth = Math.min(
        500,
        Math.max(200, totalWidth - e.clientX)
      );
      setMembersWidth(newWidth);
    };

    const handleMouseUp = () => {
      if (isResizingMembersRef.current) {
        isResizingMembersRef.current = false;
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  const formatServers = (raw: any[]): Server[] =>
    raw.map((server: any) => ({
      id: server.id || 0,
      name: server.name || "Serveur sans nom",
      image: server.image || "/logo_fluxy.png",
      is_owner: !!server.is_owner,
      is_admin: !!server.is_admin,
    }));

  const formatChannels = (raw: any[]): Channel[] =>
    raw
      .map((ch: any) => ({
        id: ch.id || 0,
        name: ch.name || "Channel sans nom",
        position: ch.position ?? 0,
      }))
      .sort((a, b) => a.position - b.position);

  const loadChannels = useCallback(async (serverId: number) => {
    setLoadingChannels(true);
    setError(null);
    try {
      const res = await fetch(`http://localhost:3000/api/server-channels?server_id=${serverId}`, {
        credentials: "include",
      });

      if (!res.ok) {
        setError("Erreur lors de la récupération des channels");
        return;
      }

      const data = await res.json();
      if (data.channels && Array.isArray(data.channels)) {
        const formatted = formatChannels(data.channels);
        setChannelsByServer(prev => ({
          ...prev,
          [serverId]: formatted,
        }));
        return formatted;
      }
    } catch {
      setError("Erreur réseau lors de la récupération des channels");
    } finally {
      setLoadingChannels(false);
    }
  }, []);

  const handleSelectServer = (serverId: number) => {
    setSelectedServerId(serverId);
    setSelectedChannelForChat(null);
    setSelectedChannelForEdit(null);
    setIsCreating(false);
    setName("");
    setPosition(0);
  };

  useEffect(() => {
    const fetchServers = async () => {
      try {
        const res = await fetch("http://localhost:3000/api/user-servers", {
          credentials: "include",
        });

        if (res.ok) {
          const data = await res.json();
          if (data.servers && Array.isArray(data.servers)) {
            const formattedServers = formatServers(data.servers);
            setServers(formattedServers);
            if (formattedServers.length > 0) {
              setSelectedServerId(formattedServers[0].id);
            }
          }
        } else {
          setError("Erreur lors de la récupération des serveurs");
        }
      } catch {
        setError("Erreur réseau lors de la récupération des serveurs");
      } finally {
        setLoadingServers(false);
      }
    };

    fetchServers();
  }, []);

  // Charger les channels pour tous les serveurs afin de les afficher dans la navbar
  useEffect(() => {
    if (!servers.length) return;

    const loadAll = async () => {
      for (const s of servers) {
        await loadChannels(s.id);
      }
    };

    loadAll();
  }, [servers, loadChannels]);

  useEffect(() => {
    const fetchChannels = async () => {
      if (selectedServerId === null) return;
      const updated = await loadChannels(selectedServerId);

      // Quand on change de serveur, ouvrir directement un channel (par ex. le premier)
      if (updated && updated.length > 0) {
        setSelectedChannelForChat(updated[0]);
        setSelectedChannelForEdit(null);
        setIsCreating(false);
      } else {
        setSelectedChannelForChat(null);
        setSelectedChannelForEdit(null);
      }
    };

    fetchChannels();
  }, [selectedServerId, loadChannels]);

  // Rafraîchissement régulier des channels pour les voir en quasi temps réel dans la navbar
  useEffect(() => {
    if (selectedServerId === null) return;

    const intervalId = setInterval(() => {
      loadChannels(selectedServerId);
    }, 5000); // toutes les 5 secondes

    return () => clearInterval(intervalId);
  }, [selectedServerId, loadChannels]);

  useEffect(() => {
    const loadMembers = async () => {
      if (!selectedServerId) {
        setServerMembers([]);
        return;
      }
      setLoadingMembers(true);
      try {
        // Marquer l'utilisateur actuel comme connecté avant de charger les membres
        await fetch("/api/user", {
          credentials: "include",
        });
        
        const res = await fetch(
          `http://localhost:3000/api/server-members?server_id=${selectedServerId}`,
          { credentials: "include" }
        );
        if (!res.ok) {
          setServerMembers([]);
          return;
        }
        const data = await res.json();
        if (data.members && Array.isArray(data.members)) {
          const formatted: ServerMember[] = data.members.map((m: any) => ({
            user_id: m.user_id,
            role: m.role || "membre",
            status: m.status || "offline",
          }));
          setServerMembers(formatted);
        } else {
          setServerMembers([]);
        }
      } catch {
        setServerMembers([]);
      } finally {
        setLoadingMembers(false);
      }
    };

    loadMembers();
  }, [selectedServerId, selectedChannelForChat]);

  const handleCreate = async () => {
    if (!selectedServerId || !name.trim()) return;
    setError(null);

    try {
      const res = await fetch("http://localhost:3000/api/channel/create", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          server_id: selectedServerId,
          name,
          position,
        }),
      });

      if (!res.ok) {
        setError("Erreur lors de la création du channel");
        return;
      }

      // Recharger les channels et sélectionner automatiquement le nouveau
      const updated = await loadChannels(selectedServerId);
      if (updated && updated.length > 0) {
        const lastChannel = updated[updated.length - 1];
        setSelectedChannelForChat(lastChannel);
        setSelectedChannelForEdit(null);
      }

      setName("");
      setPosition(0);
      setIsCreating(false);
    } catch {
      setError("Erreur réseau lors de la création du channel");
    }
  };

  const handleUpdate = async () => {
    if (!selectedServerId || !selectedChannelForEdit) return;
    if (!name.trim()) return;
    setError(null);

    try {
      const res = await fetch("http://localhost:3000/api/channel/update", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          server_id: selectedServerId,
          channel_id: selectedChannelForEdit.id,
          name,
          position,
        }),
      });

      if (!res.ok) {
        setError("Erreur lors de la mise à jour du channel");
        return;
      }

      setSelectedChannelForEdit(null);
      setName("");
      setPosition(0);
      await loadChannels(selectedServerId);
    } catch {
      setError("Erreur réseau lors de la mise à jour du channel");
    }
  };

  const handleDelete = async (channel: Channel) => {
    if (!selectedServerId) return;
    setError(null);

    try {
      const res = await fetch("http://localhost:3000/api/channel/delete", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          server_id: selectedServerId,
          channel_id: channel.id,
        }),
      });

      if (!res.ok) {
        setError("Erreur lors de la suppression du channel");
        return;
      }

      if (selectedChannelForEdit && selectedChannelForEdit.id === channel.id) {
        setSelectedChannelForEdit(null);
        setName("");
        setPosition(0);
      }

      await loadChannels(selectedServerId);
    } catch {
      setError("Erreur réseau lors de la suppression du channel");
    }
  };

  const onSelectChannelForEdit = (channel: Channel) => {
    setSelectedChannelForEdit(channel);
    setName(channel.name);
    setIsCreating(false);
  };

  const onSelectChannelForChat = (channel: Channel, serverId?: number) => {
    const targetServerId = serverId ?? selectedServerId;
    if (targetServerId) {
      setSelectedServerId(targetServerId);
    }
    setSelectedChannelForChat(channel);
    setSelectedChannelForEdit(null);
    setIsCreating(false);
  };

  const handleDeleteCurrentServer = async () => {
    if (!selectedServerId) return;
    const current = servers.find((s) => s.id === selectedServerId);
    const confirmDelete = window.confirm(
      `Supprimer définitivement le serveur "${current?.name ?? selectedServerId}" ?`
    );
    if (!confirmDelete) return;

    try {
      const res = await fetch("http://localhost:3000/api/delete-server", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ server_id: selectedServerId }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(
          data.error ||
            "Erreur lors de la suppression du serveur. Vérifiez que vous êtes le fondateur."
        );
        return;
      }

      const updatedServers = servers.filter((s) => s.id !== selectedServerId);
      setServers(updatedServers);
      if (updatedServers.length > 0) {
        const nextId = updatedServers[0].id;
        setSelectedServerId(nextId);
        await loadChannels(nextId);
      } else {
        setSelectedServerId(null);
      }
    } catch (err) {
      console.error("Erreur lors de la suppression du serveur:", err);
      alert("Erreur réseau lors de la suppression du serveur.");
    }
  };

  const handleEditCurrentServer = async () => {
    if (!selectedServerId) return;
    const current = servers.find((s) => s.id === selectedServerId);
    const newName = window.prompt(
      "Nouveau nom du serveur :",
      current?.name ?? ""
    );
    if (!newName || !newName.trim()) return;

    try {
      const res = await fetch("http://localhost:3000/api/update-server", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          server_id: selectedServerId,
          name: newName.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(
          data.error ||
            "Erreur lors de la mise à jour du serveur. Vérifiez que vous êtes le fondateur."
        );
        return;
      }

      setServers((prev) =>
        prev.map((s) =>
          s.id === selectedServerId ? { ...s, name: newName.trim() } : s
        )
      );
    } catch (err) {
      console.error("Erreur lors de la mise à jour du serveur:", err);
      alert("Erreur réseau lors de la mise à jour du serveur.");
    }
  };

  const handleJoinServer = async () => {
    setJoinError(null);
    const raw = joinServerId.trim();
    if (!raw) {
      setJoinError("Veuillez entrer un code ou un lien d'invitation valide");
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

    try {
      const res = await fetch("http://localhost:3000/api/join-server-by-link", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ link: linkCode }),
      });

      const data = await res.json();

      if (!res.ok) {
        setJoinError(data.error || "Erreur lors de la jointure du serveur");
        return;
      }

      const serversRes = await fetch("http://localhost:3000/api/user-servers", {
        credentials: "include",
      });
      if (serversRes.ok) {
        const serversData = await serversRes.json();
        if (serversData.servers && Array.isArray(serversData.servers)) {
          const formattedServers = formatServers(serversData.servers);
          setServers(formattedServers);
        }
      }

      setShowJoinModal(false);
      setJoinServerId("");
    } catch {
      setJoinError("Erreur réseau lors de la jointure du serveur");
    }
  };

  const copyServerId = async (serverId: number) => {
    try {
      // Demander au backend de créer un nouveau lien d'invitation
      const res = await fetch("http://localhost:3000/api/create-invite-link", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ server_id: serverId }),
      });

      const data = await res.json();

      if (!res.ok || !data.link) {
        alert(
          data.error ||
            "Impossible de créer un lien d'invitation. Seuls le fondateur ou les admins peuvent créer un lien."
        );
        return;
      }

      // Lien partageable : l'app front pourra lire ?id=CODE et appeler /api/join-server-by-link
      const link = `${data.link}`;

      try {
        await navigator.clipboard.writeText(link);
        alert(`Nouveau lien du serveur copié : ${link}`);
      } catch (err) {
        console.error("Erreur lors de la copie:", err);
        const textArea = document.createElement("textarea");
        textArea.value = link;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
        alert(`Nouveau lien du serveur copié : ${link}`);
      }
    } catch (err) {
      console.error("Erreur lors de la création du lien d'invitation:", err);
      alert("Erreur réseau lors de la création du lien d'invitation.");
    }
  };

  const currentChannels: Channel[] =
    selectedServerId !== null ? channelsByServer[selectedServerId] || [] : [];

  const currentServer = selectedServerId
    ? servers.find((s) => s.id === selectedServerId) || null
    : null;
  const canManageChannels =
    currentServer?.is_owner || currentServer?.is_admin;

  if (loadingServers) {
    return (
      <div className="flex items-center justify-center h-screen bg-zinc-950">
        <div className="text-white">Chargement des serveurs...</div>
      </div>
    );
  }

  if (!servers.length) {
    return (
      <div className="flex items-center justify-center h-screen bg-zinc-950">
        <div className="text-white">Aucun serveur trouvé.</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-zinc-950 text-white">
      <nav className="h-16 bg-zinc-900 flex items-center justify-between px-4 shadow-lg shadow-orange-600/50 border-b border-orange-500">
        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="px-4 py-2 bg-zinc-900 rounded-lg hover:bg-orange-700">
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
                  onSelect={() => (window.location.href = "/home")}
                >
                  Home
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-zinc-700" />
                <DropdownMenuItem
                  className="hover:bg-zinc-700"
                  onSelect={() => (window.location.href = "/profil")}
                >
                  Profil
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="hover:bg-zinc-700"
                  onSelect={() => (window.location.href = "/profil")}
                >
                  Paramètres
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator className="bg-zinc-700" />
              <DropdownMenuItem
                className="hover:bg-zinc-700 text-red-500"
                onSelect={async (e) => {
                  e.preventDefault();
                  console.log("🔴 Déconnexion initiée par l'utilisateur");
                  try {
                    console.log("📡 Appel de l'API /api/logout...");
                    // Appeler l'API de logout via la route Next.js (qui fait le proxy vers le serveur Rust)
                    const res = await fetch("/api/logout", {
                      method: "POST",
                      credentials: "include",
                    });
                    console.log("✅ Réponse de l'API logout:", res.status, res.statusText);
                    
                    const data = await res.json();
                    console.log("📦 Données de réponse:", data);
                    
                    // Forcer la suppression de tous les cookies de session
                    console.log("🍪 Suppression des cookies de session...");
                    const cookies = document.cookie.split(";");
                    console.log("🍪 Cookies actuels:", cookies);
                    cookies.forEach((cookie) => {
                      const eqPos = cookie.indexOf("=");
                      const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
                      // Supprimer tous les cookies qui pourraient être des cookies de session
                      if (name && (name.toLowerCase().includes("session") || name.toLowerCase().includes("actix"))) {
                        console.log(`🗑️ Suppression du cookie: ${name}`);
                        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
                        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`;
                        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.${window.location.hostname}`;
                      }
                    });
                    
                    console.log("🍪 Cookies après suppression:", document.cookie);
                    console.log("🔄 Redirection vers la page de login...");
                    
                    // Forcer un rechargement complet de la page pour vider le cache
                    window.location.replace("/");
                  } catch (err) {
                    console.error("❌ Erreur lors de la déconnexion:", err);
                    // Même en cas d'erreur, on redirige
                    console.log("🔄 Redirection vers la page de login (en cas d'erreur)...");
                    window.location.replace("/");
                  }
                }}
              >
                Déconnexion
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex-1 flex items-center justify-center gap-3">
          {servers.map((server) => (
            <DropdownMenu key={server.id}>
              <DropdownMenuTrigger asChild>
                <button
                  className={`relative w-12 h-12 rounded-full overflow-hidden ring-2 ${
                    selectedServerId === server.id
                      ? "ring-orange-600 shadow-lg shadow-orange-600/60"
                      : "ring-transparent hover:ring-orange-500"
                  }`}
                  onClick={() => {
                    handleSelectServer(server.id);
                    router.push(`/channels?server_id=${server.id}`);
                  }}
                >
                  <img
                    src={server.image}
                    alt={server.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = `https://via.placeholder.com/48/${Math.random()
                        .toString(16)
                        .substr(2, 6)}/ffffff?text=${server.name.charAt(0)}`;
                    }}
                  />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-zinc-800 text-white border-zinc-700">
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="text-orange-600 flex items-center justify-between">
                    <span>{server.name}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        copyServerId(server.id);
                      }}
                      className="ml-2 p-1 hover:bg-zinc-700 rounded transition-colors"
                      title="Copier l'ID du serveur"
                    >
                      <svg
                        className="w-4 h-4 text-zinc-400 hover:text-orange-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                    </button>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-zinc-700" />
                  {(channelsByServer[server.id] || []).length > 0 ? (
                    (channelsByServer[server.id] || []).map((channel) => (
                      <DropdownMenuItem
                        key={channel.id}
                        className="hover:bg-zinc-700"
                        onClick={() => onSelectChannelForChat(channel, server.id)}
                      >
                        {channel.name}
                      </DropdownMenuItem>
                    ))
                  ) : (
                    <DropdownMenuItem className="text-xs text-zinc-500" disabled>
                      Aucun channel pour ce serveur
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator className="bg-zinc-700" />
                  {(server.is_owner || server.is_admin) && (
                    <DropdownMenuItem
                      className="hover:bg-zinc-700 text-sm text-orange-400"
                      onClick={() => {
                        handleSelectServer(server.id);
                        setSelectedChannelForEdit(null);
                        setSelectedChannelForChat(null);
                        setName("");
                        setPosition(0);
                        setIsCreating(true);
                      }}
                    >
                      Créer un channel
                    </DropdownMenuItem>
                  )}
                  {server.is_owner && (
                    <>
                      <DropdownMenuItem
                        className="hover:bg-zinc-700 text-sm"
                        onClick={() => {
                          // Sélectionner ce serveur puis ouvrir les rôles (Paramètres)
                          handleSelectServer(server.id);
                          setShowRolesModal(true);
                        }}
                      >
                        Paramètres
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="hover:bg-zinc-700 text-sm"
                        onClick={() => {
                          // Modifier ce serveur (page existante)
                          handleSelectServer(server.id);
                          if (server.id) {
                            router.push(`/modify-serveur?server_id=${server.id}`);
                          }
                        }}
                      >
                        Modifier le serveur
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="hover:bg-zinc-700 text-sm text-red-500"
                        onClick={async () => {
                          const confirmDelete = window.confirm(
                            `Supprimer définitivement le serveur "${server.name}" ?`
                          );
                          if (!confirmDelete) return;

                          try {
                            const res = await fetch("http://localhost:3000/api/delete-server", {
                              method: "POST",
                              credentials: "include",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ server_id: server.id }),
                            });

                            const data = await res.json();

                            if (!res.ok) {
                              alert(
                                data.error ||
                                  "Erreur lors de la suppression du serveur. Vérifiez que vous êtes le fondateur."
                              );
                              return;
                            }

                            setServers((prev) => {
                              const updated = prev.filter((s) => s.id !== server.id);
                              if (selectedServerId === server.id) {
                                if (updated.length > 0) {
                                  const nextId = updated[0].id;
                                  setSelectedServerId(nextId);
                                  loadChannels(nextId);
                                } else {
                                  setSelectedServerId(null);
                                }
                              }
                              return updated;
                            });
                          } catch (err) {
                            console.error("Erreur lors de la suppression du serveur:", err);
                            alert("Erreur réseau lors de la suppression du serveur.");
                          }
                        }}
                      >
                        Supprimer le serveur
                      </DropdownMenuItem>
                    </>
                  )}
                  {!server.is_owner && (
                    <DropdownMenuItem
                      className="hover:bg-zinc-700 text-sm text-orange-400"
                      onClick={() => {
                        router.push(`/leave-serveur?server_id=${server.id}`);
                      }}
                    >
                      Quitter le serveur
                    </DropdownMenuItem>
                  )}
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          ))}
          <button
            onClick={() => (window.location.href = "/create-serveur")}
            className="w-12 h-12 flex items-center justify-center rounded-full border-2 border-dashed border-orange-500 text-orange-500 hover:bg-orange-700/20 hover:border-orange-400 text-2xl font-bold transition-colors"
            aria-label="Ajouter un serveur"
          >
            +
          </button>
          <button
            onClick={() => setShowJoinModal(true)}
            className="w-12 h-12 flex items-center justify-center rounded-full border-2 border-dashed border-orange-500 hover:bg-orange-700/20 hover:border-orange-400 bg-transparent transition-colors"
            aria-label="Rejoindre un serveur"
          >
            <img
              src="/right.png"
              alt="Rejoindre un serveur"
              className="w-6 h-6 object-contain"
            />
          </button>
        </div>
      </nav>

      <main className="flex-1 flex flex-row bg-zinc-950">

        <div
          className="hidden md:flex w-1 cursor-col-resize bg-zinc-900 hover:bg-orange-600/70 transition-colors"
          onMouseDown={handleResizeMouseDown}
        />

        <section
          className="p-6 flex flex-row gap-4"
          style={{ width: `100vw` }}
        >
          <div className="flex-1 flex flex-col gap-2">
            {error && (
              <div className="mb-4 rounded-lg border border-red-500 bg-red-950 px-4 py-2 text-sm text-red-200">
                {error}
              </div>
            )}

            <div>
              {canManageChannels && (isCreating || selectedChannelForEdit) && (
                <div className="max-w-xl">
                  <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 bg-orange-500/10 border border-orange-500/30 rounded-full backdrop-blur-sm">
                    <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></span>
                    <span className="text-orange-400 text-xs font-semibold tracking-wider uppercase">
                      {selectedChannelForEdit ? "Modifier le channel" : "Nouveau channel"}
                    </span>
                  </div>

                  <div className="bg-zinc-900/50 backdrop-blur-xl border border-orange-500/50 rounded-3xl overflow-hidden transition-all duration-300 hover:border-orange-600/50 shadow-lg shadow-orange-600/30 ease-out hover:shadow-2xl hover:shadow-orange-600/70 hover:-translate-y-1">
                    <div className="h-1 bg-gradient-to-r from-orange-600 via-orange-500 to-orange-600"></div>
                    <div className="p-6 md:p-8">
                      <div className="space-y-5">
                        <div>
                          <label
                            htmlFor="channelNameInline"
                            className="block text-xs font-bold text-gray-200 mb-2 tracking-wide uppercase"
                          >
                            Nom du channel
                          </label>
                          <input
                            id="channelNameInline"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Mon salon de discussion"
                            maxLength={50}
                            className="w-full px-4 py-3 bg-zinc-950/60 border-2 border-zinc-500/40 rounded-2xl text-white placeholder-gray-600 
                                     focus:border-orange-500 focus:ring-4 focus:ring-orange-500/20 focus:outline-none
                                     transition-all duration-300 hover:border-zinc-700/70 text-sm md:text-base"
                          />
                          <p className="text-gray-600 text-[11px] mt-1">{name.length}/50 caractères</p>
                        </div>

                        <div className="flex gap-3 pt-1">
                          <button
                            onClick={selectedChannelForEdit ? handleUpdate : handleCreate}
                            className="flex-1 py-3 px-4 bg-orange-500 hover:bg-orange-400 text-white font-semibold text-sm rounded-2xl
                                       transform transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]
                                       relative overflow-hidden group"
                          >
                            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent 
                                            translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />
                            <span className="relative flex items-center justify-center gap-2">
                              {selectedChannelForEdit ? "Enregistrer" : "Créer le channel"}
                            </span>
                          </button>
                          <button
                            onClick={() => {
                              setSelectedChannelForEdit(null);
                              setName("");
                              setIsCreating(false);
                            }}
                            className="px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-gray-200 rounded-2xl text-sm border border-zinc-700"
                          >
                            Annuler
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex-1 min-h-0">
              {selectedServerId &&
              selectedChannelForChat &&
              !selectedChannelForEdit &&
              !isCreating ? (
                <ChannelChat
                  serverId={selectedServerId}
                  channelId={selectedChannelForChat.id}
                  channelName={selectedChannelForChat.name}
                  canManageMessages={!!canManageChannels}
                  onChannelDeleted={async () => {
                    if (selectedServerId) {
                      await loadChannels(selectedServerId);
                    }
                    setSelectedChannelForChat(null);
                    setSelectedChannelForEdit(null);
                  }}
                />
              ) : (
                <div className="h-full flex items-center justify-center text-zinc-400 border border-dashed border-zinc-700 rounded-xl">
                  {selectedChannelForEdit || isCreating
                    ? "Remplissez le formulaire pour créer ou modifier un channel."
                    : "Sélectionnez un channel pour ouvrir le chat."}
                </div>
              )}
            </div>
          </div>

          <div
            className="hidden md:flex w-1 cursor-col-resize bg-zinc-900 hover:bg-orange-600/70 transition-colors"
            onMouseDown={handleMembersResizeMouseDown}
          />

          <aside
            className="hidden md:flex"
            style={{ width: `${membersWidth}px` }}
          >
            {loadingMembers ? (
              <div className="flex flex-col gap-4 border-l border-zinc-800 pl-4 w-full">
                <h2 className="text-lg font-semibold text-orange-500">
                  Membres du serveur
                </h2>
                <div className="text-zinc-400 text-sm">Chargement des membres...</div>
              </div>
            ) : (
              <MemberServeur
                currentServerId={selectedServerId || undefined}
                members={serverMembers.map((m) => {
                  const username = usernamesByNumericId[m.user_id] || "Inconnu";
                  // S'assurer qu'on a toujours un avatar valide
                  let avatar = avatarsByNumericId[m.user_id];
                  if (!avatar || avatar.trim() === '') {
                    avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(username)}`;
                  }
                  const roleColor = 
                    m.role === "fondateur"
                      ? "#f97316" // orange
                      : m.role === "admin"
                      ? "#10b981" // emerald
                      : "#6b7280"; // zinc
                  
                  return {
                    id: m.user_id,
                    username: username,
                    avatar: avatar,
                    email: emailsByNumericId[m.user_id],
                    status: (m.status === "online" ? 'online' : 'offline') as 'online' | 'offline',
                    role: m.role === "fondateur" ? "Fondateur" : m.role === "admin" ? "Admin" : "Membre",
                    roleColor: roleColor,
                  };
                })}
                currentUser={currentUser ? {
                  id: currentUser.id,
                  username: currentUser.username,
                  avatar: currentUser.avatar,
                  status: 'online' as const,
                  role: serverMembers.find(m => m.user_id === currentUser.id)?.role === "fondateur" 
                    ? "Fondateur" 
                    : serverMembers.find(m => m.user_id === currentUser.id)?.role === "admin"
                    ? "Admin"
                    : "Membre",
                  roleColor: serverMembers.find(m => m.user_id === currentUser.id)?.role === "fondateur"
                    ? "#f97316"
                    : serverMembers.find(m => m.user_id === currentUser.id)?.role === "admin"
                    ? "#10b981"
                    : "#6b7280",
                } : {
                  id: 0,
                  username: "",
                  avatar: "",
                  status: 'offline' as const,
                  role: "",
                  roleColor: "",
                }}
              />
            )}
          </aside>
        </section>
      </main>

      {showJoinModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-zinc-900 border-2 border-orange-500 rounded-2xl p-6 w-full max-w-md shadow-lg shadow-orange-600/50">
            <h2 className="text-2xl font-bold text-orange-500 mb-4">
              Rejoindre un serveur
            </h2>
            <p className="text-zinc-300 mb-4">
              Entrez l'ID du serveur que vous souhaitez rejoindre
            </p>
            <div className="space-y-4">
              <input
                type="text"
                value={joinServerId}
                onChange={(e) => setJoinServerId(e.target.value)}
                placeholder="ID du serveur"
                className="w-full px-4 py-3 bg-zinc-800 border border-orange-500 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all text-gray-200 placeholder-gray-500"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleJoinServer();
                  }
                }}
              />
              {joinError && (
                <p className="text-red-500 text-sm">{joinError}</p>
              )}
              <div className="flex gap-3">
                <button
                  onClick={handleJoinServer}
                  className="flex-1 px-4 py-3 bg-orange-600 hover:bg-orange-700 text-gray-200 rounded-xl font-medium transition-colors"
                >
                  Rejoindre
                </button>
                <button
                  onClick={() => {
                    setShowJoinModal(false);
                    setJoinServerId("");
                    setJoinError(null);
                  }}
                  className="flex-1 px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-gray-200 rounded-xl font-medium transition-colors border border-zinc-700"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showRolesModal && selectedServerId && (
        <RolesServeur
          serverId={selectedServerId}
          members={serverMembers}
          usernamesByNumericId={usernamesByNumericId}
          onClose={async () => {
            setShowRolesModal(false);
            // Recharger les membres pour mettre à jour les rôles
            if (selectedServerId) {
              setLoadingMembers(true);
              try {
                const res = await fetch(
                  `http://localhost:3000/api/server-members?server_id=${selectedServerId}`,
                  { credentials: "include" }
                );
                if (res.ok) {
                  const data = await res.json();
                  if (data.members && Array.isArray(data.members)) {
                    setServerMembers(data.members.map((m: any) => ({
                      user_id: m.user_id,
                      role: m.role || "membre",
                      status: m.status || "offline",
                    })));
                  }
                }
              } catch (err) {
                console.error("Erreur lors du rechargement des membres:", err);
              } finally {
                setLoadingMembers(false);
              }
            }
          }}
        />
      )}
    </div>
  );
}
