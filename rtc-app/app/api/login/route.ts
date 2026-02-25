import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        // Lire le body comme texte (URLSearchParams est envoyé comme string)
        const bodyText = await request.text();
        console.log('API /api/login appelée, body:', bodyText);
        
        const rustUrl = 'http://127.0.0.1:3000/login';
        console.log('Tentative de connexion au serveur Rust:', rustUrl);
        
        const response = await fetch(rustUrl, {
            method: 'POST',
            headers: {
                'Cookie': request.headers.get('cookie') || '',
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: bodyText,
        }).catch((err) => {
            console.error('Erreur de connexion au serveur Rust:', err);
            throw new Error(`Impossible de se connecter au serveur Rust sur ${rustUrl}. Vérifiez que le serveur est démarré.`);
        });

        const headers = new Headers();
        
        // Copier les cookies de la réponse Rust
        const setCookie = response.headers.get('set-cookie');
        if (setCookie) {
            headers.set('set-cookie', setCookie);
        }

        if (response.ok) {
            const data = await response.json();
            return NextResponse.json(data, { headers });
        } else {
            const text = await response.text();
            return new NextResponse(text, { 
                status: response.status, 
                headers: {
                    ...Object.fromEntries(headers),
                    'Content-Type': 'text/plain; charset=utf-8',
                }
            });
        }
    } catch (error: any) {
        console.error('Erreur proxy /login:', error);
        return NextResponse.json(
            { error: 'Erreur serveur', details: error?.message || String(error) },
            { status: 500 }
        );
    }
}

