import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const rustUrl = 'http://127.0.0.1:3000/api/kick-member';

        const response = await fetch(rustUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': request.headers.get('cookie') || '',
            },
            body: JSON.stringify(body),
            credentials: 'include',
        });

        const data = await response.json();

        if (response.ok) {
            return NextResponse.json(data);
        } else {
            return NextResponse.json(data, { status: response.status });
        }
    } catch (error: any) {
        console.error('Erreur proxy /api/kick-member:', error);
        return NextResponse.json(
            { error: 'Erreur serveur', details: error?.message || String(error) },
            { status: 500 }
        );
    }
}

