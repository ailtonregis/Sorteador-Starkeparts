import { isMasterRequest, json } from '../lib/session.mjs';
import { readState, writeState } from '../lib/supabase.mjs';

export async function GET(request) {
  if (!isMasterRequest(request)) return json({ error: 'Sessão não autenticada.' }, 401);
  try { return json({ state: await readState() }); }
  catch (error) {
    console.error('state.GET', error);
    const invalidKey = String(error?.message || '').includes('Supabase GET 401');
    return json({
      error: invalidKey
        ? 'A chave do Supabase configurada na Vercel é inválida. Atualize SUPABASE_SECRET_KEY e publique novamente.'
        : 'Não foi possível carregar os dados do Supabase.',
    }, 503);
  }
}

export async function PUT(request) {
  if (!isMasterRequest(request)) return json({ error: 'Sessão não autenticada.' }, 401);
  const length = Number(request.headers.get('content-length') || 0);
  if (length > 4_000_000) return json({ error: 'O banco excedeu o limite de 4 MB por gravação.' }, 413);
  try {
    const body = await request.json();
    if (!body?.state || body.state.version !== 3) return json({ error: 'Estado inválido.' }, 400);
    await writeState(body.state);
    return json({ ok: true });
  } catch (error) {
    console.error('state.PUT', error);
    return json({ error: 'Não foi possível salvar os dados no Supabase.' }, 503);
  }
}
