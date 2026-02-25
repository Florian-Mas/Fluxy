"use client";
import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ModifyServeur from "../components/ModifyServeur";

interface UserData {
    user_id: string | null;
    email: string | null;
}

export default function ModifyServeurPage() {
    const [user, setUser] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const searchParams = useSearchParams();

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
                    } else {
                        router.push("/channels");
                    }
                } else {
                    router.push("/channels");
                }
            } catch (err) {
                console.error("Erreur lors de la récupération des données utilisateur:", err);
                router.push("/channels");
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

    const serverId = searchParams.get("server_id");
    
    return <ModifyServeur serverId={serverId ? parseInt(serverId) : null} />;
}

