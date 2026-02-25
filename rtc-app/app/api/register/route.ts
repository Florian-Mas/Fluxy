import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.text();
        
        const response = await fetch('http://127.0.0.1:3000/register', {
            method: 'POST',
            headers: {
                'Cookie': request.headers.get('cookie') || '',
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: body,
            credentials: 'include',
        });

        const headers = new Headers();
        
        // Copier les cookies de la réponse Rust
        const setCookie = response.headers.get('set-cookie');
        if (setCookie) {
            headers.set('set-cookie', setCookie);
        }

        if (response.ok) {
            const text = await response.text();
            return new NextResponse(text, { 
                status: 200,
                headers: {
                    ...Object.fromEntries(headers),
                    'Content-Type': 'text/html; charset=utf-8',
                }
            });
        } else {
            const text = await response.text();
            return new NextResponse(text, { 
                status: response.status,
                headers: {
                    ...Object.fromEntries(headers),
                    'Content-Type': 'text/html; charset=utf-8',
                }
            });
        }
    } catch (error) {
        console.error('Erreur proxy /register:', error);
        return NextResponse.json(
            { error: 'Erreur serveur' },
            { status: 500 }
        );
    }
}

