"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sendchat from "../components/Sendchat";

interface UserData {
    user_id: string | null;
    email: string | null;
}

export default function Dashboard() {
    const [user, setUser] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const router = useRouter();

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await fetch("http://127.0.0.1:3000/api/user", {
                    credentials: "include",
                });

                if (res.ok) {
                    const data = await res.json();
                    if (data.user_id && data.email) {
                        setUser(data);
                    } else {
                        // Pas de session, rediriger vers login
                        router.push("/");
                    }
                } else {
                    // Pas connecté, rediriger vers login
                    router.push("/");
                }
            } catch (err) {
                setError("Erreur lors de la récupération des données utilisateur.");
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, [router]);

    const handleLogout = async () => {
        try {
            const res = await fetch("/api/logout", {
                method: "POST",
                credentials: "include",
            });

            if (res.ok) {
                router.push("/");
            }
        } catch (err) {
            setError("Erreur lors de la déconnexion.");
        }
    };

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
            <div className="container mx-auto px-4 py-8">
                <div className="max-w-4xl mx-auto">
                    <div className="mb-8 flex justify-between items-center">
                        <h1 className="text-3xl font-bold text-orange-600">Dashboard</h1>
                        <button
                            onClick={handleLogout}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-xl transition-colors"
                        >
                            Déconnexion
                        </button>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-md">
                            <p className="text-red-600 text-sm">{error}</p>
                        </div>
                    )}

                    <div className="bg-zinc-800 border border-orange-500 rounded-2xl p-6 shadow-lg shadow-orange-600/50">
                        <h2 className="text-xl font-semibold text-orange-600 mb-4">
                            Informations du compte
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">
                                    Email
                                </label>
                                <p className="text-white">{user.email}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">
                                    User ID
                                </label>
                                <p className="text-white font-mono text-sm">{user.user_id}</p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8">
                        <Sendchat />
                    </div>
                </div>
            </div>
        </div>
    );
}

