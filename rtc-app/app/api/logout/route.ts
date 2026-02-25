import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const response = await fetch('http://127.0.0.1:3000/api/logout', {
            method: 'POST',
            headers: {
                'Cookie': request.headers.get('cookie') || '',
            },
            credentials: 'include',
        });

        const data = await response.json();
        const headers = new Headers();
        
        // Copier les cookies de la réponse Rust (qui devrait contenir la suppression du cookie)
        const setCookie = response.headers.get('set-cookie');
        if (setCookie) {
            headers.set('set-cookie', setCookie);
        }
        
        // Supprimer explicitement tous les cookies de session possibles
        // Actix-web utilise "actix-session" par défaut
        const cookiesToDelete = [
            'actix-session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax',
            'actix-session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax; Secure',
        ];
        
        // Ajouter tous les cookies de suppression
        cookiesToDelete.forEach(cookie => {
            headers.append('set-cookie', cookie);
        });

        return NextResponse.json(data, { headers });
    } catch (error) {
        console.error('Erreur proxy /api/logout:', error);
        return NextResponse.json(
            { error: 'Erreur serveur' },
            { status: 500 }
        );
    }
}

