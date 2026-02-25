import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, image } = body;

        if (!name || name.trim() === '') {
            return NextResponse.json(
                { error: 'Le nom du serveur est requis' },
                { status: 400 }
            );
        }

        const response = await fetch('http://127.0.0.1:3000/api/create-server', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': request.headers.get('cookie') || '',
            },
            body: JSON.stringify({ name, image }),
            credentials: 'include',
        });

        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json(
                { error: data.error || 'Erreur lors de la création du serveur' },
                { status: response.status }
            );
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('Erreur proxy /api/create-server:', error);
        return NextResponse.json(
            { error: 'Erreur serveur' },
            { status: 500 }
        );
    }
}

