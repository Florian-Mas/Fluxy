"use client";
import React, { useState } from "react";

export default function Forgotpwd() {
    const [email, setEmail] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email) {
            setError("L'email est obligatoire.");
            return;
        }

        setError("");
        setLoading(true);

        try {
            const body = new URLSearchParams();
            body.append("email", email);

            const res = await fetch("/api/forgot", {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body,
                credentials: "include",
            });

            if (res.ok) {
                const data = await res.json();
                if (data.success) {
                    // Rediriger vers la page de confirmation
                    window.location.href = "/forgot-sent";
                } else {
                    setError(data.error || "Erreur lors de la demande de réinitialisation.");
                }
            } else {
                const text = await res.text();
                setError(
                    text || "Erreur lors de la demande de réinitialisation."
                );
            }
        } catch (err) {
            setError("Erreur réseau lors de la communication avec le serveur.");
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

                <h2 className="text-2xl font-bold text-orange-600 mb-6 text-center uppercase">
                    Mot de passe oublié ?
                </h2>

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

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-orange-600  text-white py-3 px-4 rounded-xl hover:bg-orange-500 disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-600 transition-colors text-sm font-medium shadow-sm"
                    >
                        {loading ? "Envoi en cours..." : "Réinitialiser"}
                        
                    </button>


                    <div className="mt-6 text-center text-sm">
                        <a href="/" className="font-medium text-orange-600 hover:text-orange-500 transition-colors">
                            ↽ Retour à la page de connexion
                        </a>
                        <p className="text-gray-500 mt-4">
                            Vous recevrez dans votre boîte mail un email de réinitialisation.
                        </p>
                    </div>
                </form>

                
            </div>
        </div>
        
    );
}