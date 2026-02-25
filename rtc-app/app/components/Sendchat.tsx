"use client"
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Message {
    id: number;
    messageId?: string;
    text: string;
    sender: "user" | "bot" | "system";
    timestamp: Date;
    author?: string;
}

export default function Sendchat() {
    const router = useRouter();
    const [username, setUsername] = useState("Username");
    const [email, setEmail] = useState<string>("");
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputMessage, setInputMessage] = useState("");
    const [socket, setSocket] = useState<WebSocket | null>(null);
    const [connected, setConnected] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messageIdRef = useRef(0);
    const [typingUsers, setTypingUsers] = useState<string[]>([]);
    const [isTyping, setIsTyping] = useState(false);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Initialiser le WebSocket
    useEffect(() => {
        let ws: WebSocket | null = null;
        let reconnectTimeout: NodeJS.Timeout | null = null;
        let isCleaningUp = false;

        const initWebSocket = async () => {
            if (isCleaningUp) return;
            
            try {
                // Vérifier l'authentification d'abord
                const response = await fetch("/api/user", {
                    credentials: "include"
                });

                if (!response.ok) {
                    return;
                } 

                const user = await response.json();
                if (user.email) {
                    setEmail(user.email);
                    setUsername(user.username || user.email.split("@")[0] || "User");
                }

                // Se connecter au WebSocket
                const wsUrl = "ws://localhost:3000/ws";
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

                    try {
        // Essayer de parser comme JSON pour les événements spéciaux
        const data = JSON.parse(event.data);
        
        if (data.type === "typing") {
            // Quelqu'un est en train d'écrire
            setTypingUsers(prev => {
                if (!prev.includes(data.username)) {
                    return [...prev, data.username];
                }
                return prev;
            });
            
            // Retirer l'utilisateur après 3 secondes
            setTimeout(() => {
                setTypingUsers(prev => prev.filter(u => u !== data.username));
            }, 3000);
            return;
        }

        if (data.type === "message_deleted") {
        // Supprimer le message pour tous les clients
        setMessages(prev => prev.filter(msg => msg.messageId !== data.messageId));
        return;
    }
        
        if (data.type === "stop_typing") {
            // L'utilisateur a arrêté d'écrire
            setTypingUsers(prev => prev.filter(u => u !== data.username));
            return;
        }

    } catch {
        // Si ce n'est pas du JSON, c'est un message texte normal
                    
                    const text = event.data;
                    
                    // Éviter les doublons
                    setMessages(prev => {
                        const now = new Date();
                        const isDuplicate = prev.some(msg => 
                            msg.text === text && 
                            Math.abs(now.getTime() - msg.timestamp.getTime()) < 1000
                        );
                        
                        if (isDuplicate) {
                            return prev;
                        }
                        
                        const isSystemMessage = text.includes("a rejoint") || text.includes("a quitté");
                        const newMessage: Message = {
                            id: messageIdRef.current++,
                            text: text,
                            sender: isSystemMessage ? "system" : "bot",
                            timestamp: now,
                        };
                        
                        return [...prev, newMessage];
                    });
            }});

                ws.addEventListener("close", () => {
                    if (isCleaningUp) return;
                    setConnected(false);
                    setSocket(null);
                    // Tentative de reconnexion après 3 secondes
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

        initWebSocket();

        // Nettoyer la connexion à la fermeture
        return () => {
            isCleaningUp = true;
            if (reconnectTimeout) {
                clearTimeout(reconnectTimeout);
            }
            if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
            }
            if (ws) {
                ws.close();
            }
            if (socket) {
                socket.close();
            }
        };
    }, []);

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

         // Arrêter l'indicateur de frappe
    setIsTyping(false);
    if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
    }
    socket.send(JSON.stringify({
        type: "stop_typing",
        username: username
    }));

        // Envoyer le message via WebSocket
        // Le serveur renverra le message formaté comme "username: message"
        socket.send(inputMessage);
        setInputMessage("");
    };

    const handleLogout = async () => {
        setIsLoggingOut(true);
        try {
            // Fermer la connexion WebSocket
            if (socket) {
                socket.close();
            }

            // Appeler l'API de déconnexion
            const res = await fetch("/api/logout", {
                method: "POST",
                credentials: "include",
            });

            if (res.ok) {
                router.push("/");
            } else {
                console.error("Erreur lors de la déconnexion");
                router.push("/");
            }
        } catch (err) {
            console.error("Erreur réseau lors de la déconnexion:", err);
            router.push("/");
        } finally {
            setIsLoggingOut(false);
        }
    };

    const handleDeleteChannel = async () => {
    const confirmed = window.confirm("Êtes-vous sûr de vouloir supprimer ce channel ?");
    
    if (!confirmed) return;
    
    try {
        const res = await fetch("/api/delete-channel", {
            method: "DELETE",
            credentials: "include",
        });

        if (res.ok) {
            router.push("/HomePage2");
        } else {
            console.error("Erreur lors de la suppression du channel");
        }
    } catch (err) {
        console.error("Erreur réseau lors de la suppression:", err);
    }
};

const handleDeleteMessage = async (messageId: number, serverMessageId?: string) => {
    const confirmed = window.confirm("Voulez-vous supprimer ce message ?");
    
    if (!confirmed) return;
    
    try {
        // Supprimer localement
        setMessages(prev => prev.filter(msg => msg.id !== messageId));
        
        // Si on a un ID serveur, notifier le serveur
        if (serverMessageId && socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({
                type: "delete_message",
                messageId: serverMessageId,
                username: username
            }));
        }
    } catch (err) {
        console.error("Erreur lors de la suppression du message:", err);
    }
};

const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputMessage(value);
    
    if (!socket || socket.readyState !== WebSocket.OPEN) return;
    
    // Envoyer l'événement "typing" si l'utilisateur écrit
    if (value && !isTyping) {
        setIsTyping(true);
        socket.send(JSON.stringify({
            type: "typing",
            username: username
        }));
    }
    
    // Réinitialiser le timeout
    if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
    }
    
    // Arrêter l'indicateur après 2 secondes d'inactivité
    typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({
                type: "stop_typing",
                username: username
            }));
        }
    }, 2000);
};

    return (
        <div className="flex flex-col bg-zinc-800 border border-orange-500 rounded-2xl shadow-lg shadow-orange-600/50" style={{ height: '100vh' }}>
           
            <div className="bg-zinc-900 border-b border-orange-500 p-4 shadow-lg flex justify-between items-center">
                 <h1 className="text-3xl md:text-4xl font-black mb-6 leading-none tracking-tight">
                    <span className="bg-gradient-to-br from-white via-gray-200 to-gray-300 bg-clip-text text-transparent ">
                     Nom du
                    </span>
                    <span className="bg-gradient-to-r from-orange-500 via-orange-400 to-orange-500 bg-clip-text text-transparent">
                     Channel
                    </span>
                </h1>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <span className="text-xs text-gray-400">{connected ? 'Connecté' : 'Déconnecté'}</span>
                    </div>

                         <button
                            onClick={handleDeleteChannel}
                            className="px-4 py-2 bg-orange-600 text-white rounded-xl hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-colors text-sm font-medium flex items-center gap-2"
                             title="Supprimer le channel"
                            >
                        <svg 
                        className="w-4 h-4" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                         >
                    <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" 
                    />
                    </svg>
                    Supprimer
                    </button>

                    <button
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                        className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors text-sm font-medium flex items-center gap-2"
                        title="Se déconnecter"
                    >
                        <svg 
                            className="w-4 h-4" 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                        >
                            <path 
                                strokeLinecap="round" 
                                strokeLinejoin="round" 
                                strokeWidth={2} 
                                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" 
                            />
                        </svg>
                        {isLoggingOut ? "Déconnexion..." : "Déconnexion"}
                    </button>
                </div>
            </div>

             

            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => {
                    if (message.sender === "system") {
                        return (
                            <p key={message.id} className="text-s text-gray-200 mb-1 px-2 text-center font-sans">
                                {message.text}
                            </p>
                        );
                    }
                    
                    // Parser le message pour extraire l'auteur si c'est au format "username: message"
                    const parts = message.text.split(": ");
                    // Vérifier si c'est notre message en comparant avec le username ou l'email (pour compatibilité)
                    const isUserMessage = message.sender === "user" || 
                        (parts.length > 1 && (parts[0] === username || parts[0] === email));
                    const displayText = isUserMessage && message.sender !== "user" ? parts.slice(1).join(": ") : message.text;
                    // Utiliser le username de l'auteur (qui vient maintenant de Supabase)
                    const author = isUserMessage ? username : (parts.length > 1 ? parts[0] : "Fluxy");
                    
                    return (
                        <div
                            key={message.id}
                            className={`flex flex-col ${isUserMessage ? "items-end" : "items-start"}`}
                        >
                            <p className="text-xs text-gray-400 mb-1 px-2">
                                {author}
                            </p>
                            <div className="relative">
                                
                            <div
                                className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-2 rounded-2xl ${
                                    isUserMessage
                                        ? "shadow-lg bg-orange-500 text-gray-200 shadow-orange-600/50 rounded-2xl border border-orange-500 transition-all duration-300 ease-out hover:shadow-2xl hover:shadow-orange-600/70 hover:-translate-y-2"
                                        : "shadow-lg bg-zinc-800 text-gray-200 shadow-zinc-900/70 rounded-2xl border border-zinc-800 transition-all duration-300 ease-out hover:shadow-2xl hover:shadow-orange-500/70 hover:-translate-y-2"
                                }`}
                            >
                                <p className="text-sm">{displayText}</p>
                                <p className="text-xs mt-1 opacity-70">
                                    {message.timestamp.toLocaleTimeString('fr-FR', { 
                                        hour: '2-digit', 
                                        minute: '2-digit' 
                                    })}
                                </p>
                            </div>
                                   {isUserMessage && (
                        <button
                            onClick={() => handleDeleteMessage(message.id, message.messageId)}
                            className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 
                                     bg-red-600 hover:bg-red-700 text-white rounded-full p-1.5
                                     transition-all duration-200 shadow-lg"
                            title="Supprimer le message"
                        >
                            <svg 
                                className="w-3 h-3" 
                                fill="none" 
                                stroke="currentColor" 
                                viewBox="0 0 24 24"
                            >
                                <path 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round" 
                                    strokeWidth={2} 
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" 
                                />
                            </svg>
                        </button>
                    )}
                </div>

                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
                
                {}
                {typingUsers.length > 0 && (
                    <div className="flex items-start">
                        <div className="max-w-xs px-4 py-2 rounded-2xl bg-zinc-800/50 text-gray-400 border border-zinc-700">
                            <div className="flex items-center gap-2">
                                <div className="flex gap-1">
                                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                                </div>
                                <p className="text-xs">
                                    {typingUsers.length === 1 
                                        ? `${typingUsers[0]} est en train d'écrire...`
                                        : typingUsers.length === 2
                                        ? `${typingUsers[0]} et ${typingUsers[1]} sont en train d'écrire...`
                                        : `${typingUsers[0]} et ${typingUsers.length - 1} autres sont en train d'écrire...`
                                    }
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

           
            <div className="bg-zinc-900 border-t border-zinc-900 p-4">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                    <input
                        type="text"
                        value={inputMessage}
                        onChange={handleInputChange}
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
        </div>
    );
}