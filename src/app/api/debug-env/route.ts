import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'NOT SET',
    AUTH_SPOTIFY_ID: process.env.AUTH_SPOTIFY_ID ? 'SET' : 'NOT SET',
    AUTH_SPOTIFY_SECRET: process.env.AUTH_SPOTIFY_SECRET ? 'SET' : 'NOT SET',
    OPENAI_API_KEY: process.env.OPENAI_API_KEY ? 'SET' : 'NOT SET',
    NODE_ENV: process.env.NODE_ENV,
  })
}