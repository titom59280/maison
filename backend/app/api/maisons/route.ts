import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*', 
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// Vérification du mot de passe
const checkAuth = (passwordFromUser: string) => {
  return passwordFromUser === process.env.APP_PASSWORD;
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET() {
  try {
    const result = await pool.query('SELECT * FROM maisons ORDER BY position ASC');
    return NextResponse.json(result.rows, { headers: corsHeaders });
  } catch (error) {
    return NextResponse.json({ error: "Erreur DB" }, { status: 500, headers: corsHeaders });
  }
}

export async function POST(request: Request) {
  try {
    const { password, data } = await request.json();

    // COMPARAISON AVEC LA VARIABLE D'ENVIRONNEMENT RENDER
    if (!checkAuth(password)) {
      return NextResponse.json({ error: "Mot de passe incorrect" }, { status: 401, headers: corsHeaders });
    }

    // Si ok, on met à jour la DB
    await pool.query('DELETE FROM maisons');
    for (let i = 0; i < data.length; i++) {
      const m = data[i];
      await pool.query(
        'INSERT INTO maisons (titre, prix, lieu, chambres, surface, lien, image, commentaire, position) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
        [m.titre, m.prix, m.lieu, m.chambres, m.surface, m.lien, m.image, m.commentaire, i]
      );
    }
    return NextResponse.json({ success: true }, { headers: corsHeaders });
  } catch (error) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500, headers: corsHeaders });
  }
}