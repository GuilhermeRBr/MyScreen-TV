/**
 * Rota de keep-alive: pinga o backend periodicamente para evitar cold start
 * no Render (plano gratuito hiberna após ~15 minutos sem requisições).
 *
 * Chamada pelo componente KeepAlive no layout raiz a cada 10 minutos.
 */
import { NextResponse } from 'next/server';

const BACKEND_URL =
  process.env.BACKEND_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  'http://localhost:3001';

// Evita que a Vercel faça cache desta rota
export const dynamic = 'force-dynamic';

export async function GET(): Promise<NextResponse> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`${BACKEND_URL}/health`, {
      method: 'GET',
      signal: controller.signal,
    });

    clearTimeout(timer);

    return NextResponse.json({ ok: response.ok }, { status: 200 });
  } catch {
    // Falha silenciosa — o keep-alive é melhor-esforço
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
