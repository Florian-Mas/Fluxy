// Login Form Component 

"use client";
import React, { useState, useEffect } from "react";

export default function LoginForm() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmationBanner, setShowConfirmationBanner] = useState(false);

    useEffect(() => {
        // Détecter si on a un token de confirmation d'email dans l'URL
        if (typeof window !== "undefined") {
            let accessToken: string | null = null;
            let typeParam: string | null = null;

            // Vérifier d'abord les query parameters
            const searchParams = new URLSearchParams(window.location.search);
            accessToken = searchParams.get("access_token");
            typeParam = searchParams.get("type");

            // Si pas trouvé, vérifier le hash fragment
            if (!accessToken && window.location.hash) {
                const hashParams = new URLSearchParams(window.location.hash.substring(1));
                accessToken = hashParams.get("access_token");
                typeParam = hashParams.get("type");
            }

            // Si c'est un token de confirmation d'email (signup ou email)
            if (accessToken && (typeParam === "signup" || typeParam === "email")) {
                setShowConfirmationBanner(true);
                // Nettoyer l'URL pour enlever le token
                const newUrl = window.location.pathname;
                window.history.replaceState({}, document.title, newUrl);
            }
        }
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email || !password) {
            setError("Les deux champs sont obligatoires.");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const body = new URLSearchParams();
            body.append("email", email);
            body.append("password", password);

            const res = await fetch("/api/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body,
                credentials: "include",
            });

            if (res.ok) {
                // Lire la réponse JSON
                try {
                    const data = await res.json();
                    
                    // Attendre un peu pour que la session soit bien établie
                    await new Promise(resolve => setTimeout(resolve, 100));
                    
                    // Rediriger vers la page d'accueil
                    window.location.href = "/home";
                } catch (_jsonError) {
                    window.location.href = "/home";
                }
            } else {
                // Lire le message d'erreur
                const text = await res.text().catch(() => "Erreur inconnue");
                console.error("Erreur de connexion:", res.status, text);
                setError(
                    text || "Email ou mot de passe incorrect. Veuillez réessayer."
                );
            }
        } catch (err) {
            console.error("Erreur réseau:", err);
            setError("Erreur réseau lors de la connexion au serveur Rust. Vérifiez que le serveur est démarré.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-zinc-950">
            <div className="w-full max-w-md p-8 shadow-lg shadow-orange-600/50 rounded-2xl border border-orange-500 transition-all duration-300 ease-out hover:shadow-2xl hover:shadow-orange-600/70 hover:-translate-y-2">
                
       
                
                <img 
                    src="/logo_fluxy.png" 
                    alt="Logo" 
                    className="mx-auto mb-9 mt-6 object-contain scale-125"
                    width={100}
                    height={100}
                />
        
                {showConfirmationBanner && (
                    <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 rounded-md">
                        <div className="flex items-start">
                            <div className="flex-shrink-0">
                                <svg className="w-5 h-5 text-green-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div className="ml-3 flex-1">
                                <h3 className="text-sm font-medium text-green-800 mb-1">
                                    Email confirmé avec succès !
                                </h3>
                                <p className="text-sm text-green-700">
                                    Vous pouvez maintenant vous connecter avec vos identifiants.
                                </p>
                            </div>
                            <button
                                onClick={() => setShowConfirmationBanner(false)}
                                className="ml-3 flex-shrink-0 text-green-500 hover:text-green-700"
                            >
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-md">
                        <p className="text-red-600 text-sm flex items-center">
                            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            {error}
                        </p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-orange-600 mb-1">Email</label>
                        <div className="relative rounded-md shadow-sm">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                                </svg>
                            </div>
                            <input
                                type="email"
                                className="text-white pl-10 w-full py-3 border border-zinc-700 rounded-xl focus:ring-2 focus:ring-orange-600 focus:border-transparent outline-none transition-all bg-zinc-800"
                                placeholder="mail@exemple.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-orange-600 mb-1">Mot de passe</label>
                        <div className="relative rounded-md shadow-sm">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <input
                                type={showPassword ? "text" : "password"}
                                className="text-white pl-10 w-full py-3 border border-zinc-700 rounded-xl focus:ring-2 focus:ring-orange-600 focus:border-transparent outline-none transition-all bg-zinc-800"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="text-gray-400 hover:text-gray-600 focus:outline-none"
                                >
                                    {showPassword ? (
                                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                                        </svg>
                                    ) : (
                                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                                            <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between">

                        <div className="text-sm">
                            <a href="/forgotpassword" className="font-medium text-orange-600 hover:text-orange-500">
                                Mot de passe oublié ?
                            </a>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-orange-600  text-white py-3 px-4 rounded-xl hover:bg-orange-500 disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-600 transition-colors text-sm font-medium shadow-sm"
                    >
                        {loading ? "Connexion..." : "Se connecter"}
                    </button>
                </form>

                <div className="mt-6 text-center text-sm">
                    <p className="text-gray-500">
                        Vous n&apos;avez pas de compte?{" "}
                        <a href="/register" className="font-medium text-orange-600 hover:text-orange-500">
                            S&apos;inscrire
                        </a>
                    </p>
                </div>
            </div>
        </div>
        
    );
}