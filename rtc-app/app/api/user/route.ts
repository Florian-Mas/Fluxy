import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    try {
        const response = await fetch('http://127.0.0.1:3000/api/user', {
            method: 'GET',
            headers: {
                'Cookie': request.headers.get('cookie') || '',
            },
            credentials: 'include',
        });

        const data = await response.json();
        const headers = new Headers();
        
        // Copier les cookies de la réponse Rust
        const setCookie = response.headers.get('set-cookie');
        if (setCookie) {
            headers.set('set-cookie', setCookie);
        }

        return NextResponse.json(data, { headers });
    } catch (error) {
        console.error('Erreur proxy /api/user:', error);
        return NextResponse.json(
            { error: 'Erreur serveur' },
            { status: 500 }
        );
    }
}

