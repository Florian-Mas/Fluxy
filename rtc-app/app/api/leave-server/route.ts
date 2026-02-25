import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const bodyText = JSON.stringify(body);
        
        const rustUrl = 'http://127.0.0.1:3000/api/leave-server';
        
        const response = await fetch(rustUrl, {
            method: 'POST',
            headers: {
                'Cookie': request.headers.get('cookie') || '',
                'Content-Type': 'application/json',
            },
            body: bodyText,
        });

        const headers = new Headers();
        
        // Copier les cookies de la réponse Rust
        const setCookie = response.headers.get('set-cookie');
        if (setCookie) {
            headers.set('set-cookie', setCookie);
        }

        const data = await response.json();

        if (response.ok) {
            return NextResponse.json(data, { headers });
        } else {
            return NextResponse.json(data, { 
                status: response.status,
                headers 
            });
        }
    } catch (error: any) {
        console.error('Erreur proxy /leave-server:', error);
        return NextResponse.json(
            { error: 'Erreur serveur', details: error?.message || String(error) },
            { status: 500 }
        );
    }
}

