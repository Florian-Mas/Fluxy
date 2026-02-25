"use client"
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import ProfileCard from "./ProfileCard";

interface Message {
  id: number;
  text: string;
  sender: "user" | "bot" | "system";
  timestamp: Date;
  author?: string;
  userId?: number | null;
  usernameFromBackend?: string;
}

interface ChannelChatProps {
  serverId: number;
  channelId: number;
  channelName: string;
  onChannelDeleted?: () => void;
  canManageMessages?: boolean;
}

export default function ChannelChat({ serverId, channelId, channelName, onChannelDeleted, canManageMessages }: ChannelChatProps) {
  const router = useRouter();
  const [username, setUsername] = useState("Username");
  const [email, setEmail] = useState<string>("");
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [usernamesById, setUsernamesById] = useState<Record<number, string>>({});
  const [avatarsById, setAvatarsById] = useState<Record<number, string>>({});
  const [emailsById, setEmailsById] = useState<Record<number, string>>({});
  const [currentUserAvatar, setCurrentUserAvatar] = useState<string | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<{
    userId: number;
    username: string;
    avatar: string;
    email?: string;
  } | null>(null);
  const [currentUserServers, setCurrentUserServers] = useState<Array<{ id: number; name: string; image?: string }>>([]);
  const [commonServers, setCommonServers] = useState<Array<{ id: number; name: string; image?: string }>>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageIdRef = useRef(0);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Charger la liste de tous les utilisateurs pour mapper userId -> username / avatar
  useEffect(() => {
    const loadUsernames = async () => {
      try {
        const res = await fetch("/api/allusers", { credentials: "include" });
        if (!res.ok) return;
        const data = await res.json();
        // L'API renvoie directement un tableau d'utilisateurs (pas { users: [...] })
        const users = Array.isArray(data) ? data : data.users;
        if (!users || !Array.isArray(users)) return;

        const nameMap: Record<number, string> = {};
        const avatarMap: Record<number, string> = {};
        const emailMap: Record<number, string> = {};
        for (const u of users) {
          if (u.id !== undefined) {
            const idNum = Number(u.id);
            if (!Number.isNaN(idNum)) {
              if (u.username) {
                nameMap[idNum] = u.username;
              }
              if (u.avatar && typeof u.avatar === "string") {
                avatarMap[idNum] = u.avatar;
              }
              if (u.email && typeof u.email === "string") {
                emailMap[idNum] = u.email;
              }
            }
          }
        }
        setUsernamesById(nameMap);
        setAvatarsById(avatarMap);
        setEmailsById(emailMap);
      } catch (e) {
        console.error("Erreur lors du chargement des utilisateurs:", e);
      }
    };

    loadUsernames();
  }, []);

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
            const formatted = data.servers.map((s: any) => ({
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

  // Calculer les serveurs en commun quand un profil est sélectionné
  useEffect(() => {
    if (!selectedProfile || currentUserServers.length === 0) {
      setCommonServers([]);
      return;
    }

    const loadCommonServers = async () => {
      try {
        // Vérifier pour chaque serveur si l'utilisateur sélectionné est aussi membre
        const common: Array<{ id: number; name: string; image?: string }> = [];
        
        for (const server of currentUserServers) {
          try {
            const res = await fetch(
              `http://localhost:3000/api/server-members?server_id=${server.id}`,
              { credentials: "include" }
            );
            if (res.ok) {
              const data = await res.json();
              if (data.members && Array.isArray(data.members)) {
                // Vérifier si l'utilisateur sélectionné est dans ce serveur
                const isMember = data.members.some((m: any) => m.user_id === selectedProfile.userId);
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

    loadCommonServers();
  }, [selectedProfile, currentUserServers]);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const res = await fetch(
          `http://localhost:3000/api/channel-messages?channel_id=${channelId}`,
          { credentials: "include" }
        );
        if (!res.ok) return;
        const data = await res.json();
        if (!data.messages || !Array.isArray(data.messages)) return;

        const history: Message[] = data.messages.map((m: any) => ({
          id: m.id ?? messageIdRef.current++,
          text: m.message ?? "",
          sender: "bot",
          timestamp: m.time ? new Date(m.time) : new Date(),
          userId:
            typeof m.user === "number"
              ? m.user
              : typeof m.user === "string"
              ? Number(m.user)
              : null,
          usernameFromBackend:
            typeof m.username === "string" ? m.username : undefined,
        }));
        setMessages(history);
      } catch (e) {
        console.error("Erreur lors du chargement de l'historique:", e);
      }
    };

    if (channelId) {
      loadHistory();
    }
  }, [channelId]);

  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimeout: NodeJS.Timeout | null = null;
    let isCleaningUp = false;

    const initWebSocket = async () => {
      if (isCleaningUp) return;

      try {
        const response = await fetch("/api/user", {
          credentials: "include",
        });

        if (!response.ok) {
          return;
        }

        const user = await response.json();
        if (user.email) {
          setEmail(user.email);
          setUsername(user.username || user.email.split("@")[0] || "User");
        }
        if (user.user_id) {
          const parsedId = Number(user.user_id);
          if (!Number.isNaN(parsedId)) {
            setCurrentUserId(parsedId);
          }
        }
        if (user.avatar && typeof user.avatar === "string") {
          setCurrentUserAvatar(user.avatar);
        }

        const wsUrl = `ws://localhost:3000/ws?server_id=${serverId}&channel_id=${channelId}`;
        ws = new WebSocket(wsUrl);

        ws.addEventListener("open", () => {
          if (isCleaningUp) {
            ws?.close();
            return;
          }
          setConnected(true);
          setSocket(ws);
        });

        ws.addEventListener("message", (event) => {
          if (isCleaningUp) return;

          const text = event.data;

          setMessages((prev) => {
            const isSystemMessage =
              text.includes("a rejoint") || text.includes("a quitté");
            const newMessage: Message = {
              id: messageIdRef.current++,
              text: text,
              sender: isSystemMessage ? "system" : "bot",
              timestamp: new Date(),
            };

            return [...prev, newMessage];
          });
        });

        ws.addEventListener("close", () => {
          if (isCleaningUp) return;
          setConnected(false);
          setSocket(null);
          reconnectTimeout = setTimeout(initWebSocket, 3000);
        });

        ws.addEventListener("error", (error) => {
          if (isCleaningUp) return;
          console.error("Erreur WebSocket:", error);
          setConnected(false);
        });
      } catch (error) {
        console.error("Erreur lors de l'initialisation du WebSocket:", error);
      }
    };

    if (serverId && channelId) {
      initWebSocket();
    }

    return () => {
      isCleaningUp = true;
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      if (ws) {
        ws.close();
      }
      if (socket) {
        socket.close();
      }
    };
  }, [serverId, channelId]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();

    if (!inputMessage.trim()) {
      return;
    }

    if (!socket) {
      console.error("WebSocket non initialisé");
      return;
    }

    if (socket.readyState !== WebSocket.OPEN) {
      console.error("WebSocket non connecté, état:", socket.readyState);
      return;
    }

    socket.send(inputMessage);
    setInputMessage("");
  };

  const handleDeleteMessage = async (messageId: number) => {
    const confirmed = window.confirm("Voulez-vous supprimer ce message ?");
    if (!confirmed) return;

    try {
      const res = await fetch("http://localhost:3000/api/message/delete", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message_id: messageId }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Erreur lors de la suppression du message");
        return;
      }

      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    } catch (err) {
      console.error("Erreur lors de la suppression du message:", err);
      alert("Erreur réseau lors de la suppression du message.");
    }
  };

  return (
    <div className="flex flex-col bg-zinc-800 border border-orange-500 rounded-2xl shadow-lg shadow-orange-600/50 h-full overflow-hidden">
      <div className="bg-zinc-900 border-b border-orange-500 p-4 shadow-lg flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              connected ? "bg-green-500" : "bg-red-500"
            }`}
          ></div>
          <h1 className="text-2xl font-bold text-orange-500">{channelName}</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (serverId && channelId) {
                router.push(
                  `/modify-channel?channel_id=${channelId}&server_id=${serverId}`,
                );
              }
            }}
            className="px-3 py-1 text-xs md:text-sm rounded-lg bg-orange-500 hover:bg-orange-600 text-white border border-orange-500"
          >
            Modifier le channel
          </button>
          <button
            onClick={async () => {
              if (!serverId || !channelId) return;

              const confirmDelete = window.confirm(
                "Supprimer définitivement ce channel ?",
              );
              if (!confirmDelete) return;

              try {
                const res = await fetch("http://localhost:3000/api/channel/delete", {
                  method: "POST",
                  credentials: "include",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    server_id: serverId,
                    channel_id: channelId,
                  }),
                });

                const data = await res.json();

                if (!res.ok) {
                  alert(
                    data.error ||
                      "Erreur lors de la suppression du channel.",
                  );
                  return;
                }

                if (onChannelDeleted) {
                  onChannelDeleted();
                } else {
                  // Fallback: recharger la page channels
                  router.push(`/channels?server_id=${serverId}`);
                }
              } catch (err) {
                console.error(
                  "Erreur lors de la suppression du channel:",
                  err,
                );
                alert("Erreur réseau lors de la suppression du channel.");
              }
            }}
            className="px-3 py-1 text-xs md:text-sm rounded-lg bg-red-500 hover:bg-red-600 text-white border border-red-500"
          >
            Supprimer le channel
          </button>
        </div>
      </div>

      {/* Zone de messages scrollable */}
      <div className="flex-1 p-4 space-y-4 overflow-y-auto max-h-[calc(100vh-220px)]">
        {messages.map((message) => {
          if (message.sender === "system") {
            return (
              <p
                key={message.id}
                className="text-s text-gray-200 mb-1 px-2 text-center font-sans"
              >
                {message.text}
              </p>
            );
          }

          const parts = message.text.split(": ");
          const hasPrefix = parts.length > 1;
          const isUserByName =
            hasPrefix && (parts[0] === username || parts[0] === email);

          const isUserMessage =
            (message.userId !== null &&
              message.userId !== undefined &&
              currentUserId !== null &&
              message.userId === currentUserId) ||
            message.sender === "user" ||
            isUserByName;

          const displayText =
            isUserMessage && message.sender !== "user" && hasPrefix
              ? parts.slice(1).join(": ")
              : message.text;
          const authorFromBackend = message.usernameFromBackend;
          const authorFromId =
            message.userId != null && usernamesById[message.userId]
              ? usernamesById[message.userId]
              : undefined;
          const author =
            authorFromBackend ||
            authorFromId ||
            (isUserMessage
              ? username
              : parts.length > 1
              ? parts[0]
              : "Inconnu");

          const avatarFromId =
            message.userId != null && avatarsById[message.userId]
              ? avatarsById[message.userId]
              : undefined;
          // Utiliser en priorité l'avatar stocké, sinon celui de l'utilisateur courant (pour ses propres messages),
          // sinon générer un avatar Dicebear basé sur le username pour éviter la simple lettre.
          const fallbackAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
            author,
          )}`;
          const avatarUrl =
            avatarFromId ||
            (isUserMessage && currentUserAvatar ? currentUserAvatar : fallbackAvatar);

          const canDelete =
            (message.userId != null &&
              currentUserId != null &&
              message.userId === currentUserId) ||
            (!!canManageMessages && currentUserId != null);

          return (
            <div
              key={message.id}
              className={`flex ${
                isUserMessage ? "justify-end" : "justify-start"
              }`}
            >
              {!isUserMessage && (
                <div 
                  className="mr-2 mt-5 w-8 h-8 rounded-full overflow-hidden bg-zinc-800 flex items-center justify-center text-xs cursor-pointer hover:ring-2 hover:ring-orange-500 transition-all"
                  onClick={() => {
                    if (message.userId != null) {
                      setSelectedProfile({
                        userId: message.userId,
                        username: author,
                        avatar: avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${author}`,
                        email: emailsById[message.userId],
                      });
                    }
                  }}
                >
                  <img
                    src={avatarUrl}
                    alt={author}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div
                className={`flex flex-col ${
                  isUserMessage ? "items-end" : "items-start"
                }`}
              >
                <p 
                  className="text-xs text-gray-400 mb-1 px-2 cursor-pointer hover:text-orange-400 transition-colors"
                  onClick={() => {
                    if (message.userId != null) {
                      setSelectedProfile({
                        userId: message.userId,
                        username: author,
                        avatar: avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${author}`,
                        email: emailsById[message.userId],
                      });
                    }
                  }}
                >
                  {author}
                </p>
                <div
                  className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-2 rounded-2xl ${
                    isUserMessage
                      ? "shadow-lg bg-orange-500 text-gray-200 shadow-orange-600/50 rounded-2xl border border-orange-500 transition-all duration-300 ease-out hover:shadow-2xl hover:shadow-orange-600/70 hover:-translate-y-2"
                      : "shadow-lg bg-zinc-800 text-gray-200 shadow-zinc-900/70 rounded-2xl border border-zinc-800 transition-all duration-300 ease-out hover:shadow-2xl hover:shadow-orange-500/70 hover:-translate-y-2"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <p className="text-sm flex-1 break-words">{displayText}</p>
                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => handleDeleteMessage(message.id)}
                        className="text-xs text-zinc-400 hover:text-red-400 transition-colors ml-1"
                        title="Supprimer le message"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  <p className="text-xs mt-1 opacity-70">
                    {message.timestamp.toLocaleTimeString("fr-FR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
              {isUserMessage && (
                <div 
                  className="ml-2 mt-5 w-8 h-8 rounded-full overflow-hidden bg-zinc-800 flex items-center justify-center text-xs cursor-pointer hover:ring-2 hover:ring-orange-500 transition-all"
                  onClick={() => {
                    if (message.userId != null) {
                      setSelectedProfile({
                        userId: message.userId,
                        username: author,
                        avatar: avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${author}`,
                        email: emailsById[message.userId],
                      });
                    }
                  }}
                >
                  <img
                    src={avatarUrl}
                    alt={author}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="bg-zinc-900 border-t border-zinc-900 p-4">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Écrivez votre message..."
            className="flex-1 px-4 py-3 bg-zinc-800 border border-orange-500 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all text-gray-200 placeholder-gray-500"
          />
          <button
            type="submit"
            className="px-6 py-3 bg-orange-500 text-gray-200 rounded-xl hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-colors font-medium shadow-sm"
          >
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
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          </button>
        </form>
      </div>

      {selectedProfile && (
        <ProfileCard
          userId={selectedProfile.userId}
          username={selectedProfile.username}
          avatar={selectedProfile.avatar}
          email={selectedProfile.email}
          commonServers={commonServers}
          onClose={() => setSelectedProfile(null)}
        />
      )}
    </div>
  );
}


