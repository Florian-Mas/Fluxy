"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import HomePage from "../components/HomePage";
import HomePage2 from "../components/HomePage2";

interface UserData {
    user_id: string | null;
    email: string | null;
}

export default function Home() {
    const [user, setUser] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);
    const [hasServers, setHasServers] = useState<boolean | null>(null);
    const router = useRouter();

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await fetch("/api/user", {
                    credentials: "include",
                });

                if (res.ok) {
                    const data = await res.json();
                    if (data.user_id && data.email) {
                        setUser(data);
                        
                        // Vérifier si l'utilisateur possède des serveurs
                        const serversRes = await fetch("/api/has-servers", {
                            credentials: "include",
                        });
                        
                        if (serversRes.ok) {
                            const serversData = await serversRes.json();
                            setHasServers(serversData.has_servers || false);
                        } else {
                            setHasServers(false);
                        }
                    } else {
                        router.push("/");
                    }
                } else {
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
        return null;
    }

    if (hasServers) {
        return <HomePage2 />;
    }

    return <HomePage />;
}

