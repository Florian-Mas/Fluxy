"use client";
import React, { useEffect, useState } from "react";
import "../styles/global.css";

export default function ForgotSentPage() {
    const [countdown, setCountdown] = useState(5);

    useEffect(() => {
        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    window.location.href = "/";
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, []);

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

                <div className="mb-6 p-6 bg-green-50 border-l-4 border-green-500 rounded-md">
                    <div className="flex items-start">
                        <div className="flex-shrink-0">
                            <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <div className="ml-3 flex-1">
                            <h3 className="text-sm font-medium text-green-800 mb-2">
                                Email de réinitialisation envoyé !
                            </h3>
                            <p className="text-sm text-green-700 mb-3">
                                Un email de réinitialisation de mot de passe a été envoyé. Veuillez vérifier votre boîte de réception et suivre les instructions pour réinitialiser votre mot de passe.
                            </p>
                            <p className="text-xs text-green-600">
                                Redirection vers la page de connexion dans {countdown} seconde{countdown > 1 ? 's' : ''}...
                            </p>
                        </div>
                    </div>
                </div>

                <div className="mt-6 text-center">
                    <a 
                        href="/" 
                        className="font-medium text-orange-600 hover:text-orange-500 transition-colors"
                    >
                        Retour à la page de connexion
                    </a>
                </div>
            </div>
        </div>
    );
}

