"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LogoutPage() {
    const router = useRouter();

    useEffect(() => {
        const handleLogout = async () => {
            try {
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
            }
        };

        handleLogout();
    }, [router]);

    return (
        <div className="flex min-h-screen items-center justify-center bg-zinc-950">
            <div className="text-white">Déconnexion en cours...</div>
        </div>
    );
}

