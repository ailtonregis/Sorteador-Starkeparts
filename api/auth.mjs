import { SESSION_SECONDS, authConfig, createToken, isMasterRequest, json, publicUser, sameValue, sessionCookie } from '../lib/session.mjs';

export async function POST(request) {
  const settings = authConfig();
  if (!settings.ready) return json({ error: 'A conta Master ainda não foi configurada na Vercel.' }, 503);

  let credentials;
  try { credentials = await request.json(); }
  catch { return json({ error: 'Requisição inválida.' }, 400); }

  const login = String(credentials?.login || '').trim().toLowerCase();
  const password = String(credentials?.password || '');
  if (!sameValue(login, settings.login) || !sameValue(password, settings.password)) {
    return json({ error: 'Login ou senha incorretos.' }, 401);
  }

  return json({ user: publicUser(settings) }, 200, {
    'Set-Cookie': sessionCookie(createToken(settings.secret), SESSION_SECONDS),
  });
}

export function GET(request) {
  const settings = authConfig();
  if (!settings.ready) return json({ error: 'A conta Master ainda não foi configurada na Vercel.' }, 503);
  if (!isMasterRequest(request)) return json({ error: 'Sessão não autenticada.' }, 401);
  return json({ user: publicUser(settings) });
}

export function DELETE() {
  return json({ ok: true }, 200, { 'Set-Cookie': sessionCookie('', 0) });
}
