"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sendchat from "../components/Sendchat";

interface UserData {
    user_id: string | null;
    email: string | null;
}

export default function SendchatPage() {
    const [user, setUser] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await fetch("/api/user", {
                    credentials: "include",
                });

                console.log("SendchatPage - Status réponse:", res.status);
                
                if (res.ok) {
                    const data = await res.json();
                    console.log("SendchatPage - Données reçues:", data);
                    if (data.user_id && data.email) {
                        setUser(data);
                    } else {
                        console.warn("SendchatPage - Session invalide (pas de user_id ou email)");
                        router.push("/");
                    }
                } else {
                    const errorText = await res.text().catch(() => "Erreur inconnue");
                    console.error("SendchatPage - Erreur API:", res.status, errorText);
                    router.push("/");
                }
            } catch (err) {
                console.error("Erreur lors de la récupération des données utilisateur:", err);
                router.push("/");
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, [router]);

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-zinc-950">
                <div className="text-white">Chargement...</div>
            </div>
        );
    }

    if (!user) {
        return null; // La redirection est en cours
    }

    return (
        <div className="min-h-screen bg-zinc-950 text-white">
            <div className="container">
                <div className="w-screen">
                    <Sendchat />
                </div>
            </div>
        </div>
    );
}


