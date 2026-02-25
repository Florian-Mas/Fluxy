import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    try {
        const response = await fetch('http://127.0.0.1:3000/api/user-servers', {
            method: 'GET',
            headers: {
                'Cookie': request.headers.get('cookie') || '',
            },
            credentials: 'include',
        });

        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json(
                { error: data.error || 'Erreur lors de la récupération des serveurs', servers: [] },
                { status: response.status }
            );
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('Erreur proxy /api/user-servers:', error);
        return NextResponse.json(
            { error: 'Erreur serveur', servers: [] },
            { status: 500 }
        );
    }
}

