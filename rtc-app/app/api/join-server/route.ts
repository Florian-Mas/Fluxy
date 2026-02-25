import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { server_id } = body;

    if (!server_id) {
      return NextResponse.json(
        { error: "server_id est requis" },
        { status: 400 }
      );
    }

    const response = await fetch("http://localhost:3000/api/join-server", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ server_id }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Erreur lors de la requête join-server:", error);
    return NextResponse.json(
      { error: "Erreur lors de la requête" },
      { status: 500 }
    );
  }
}

