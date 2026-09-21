import { createHmac, timingSafeEqual } from 'node:crypto';

const COOKIE_NAME = 'starke_master_session';
const SESSION_SECONDS = 8 * 60 * 60;

const json = (body, status = 200, headers = {}) => Response.json(body, {
  status,
  headers: { 'Cache-Control': 'no-store', ...headers },
});

function sameValue(left, right) {
  const a = Buffer.from(String(left));
  const b = Buffer.from(String(right));
  return a.length === b.length && timingSafeEqual(a, b);
}

function base64url(value) {
  return Buffer.from(value).toString('base64url');
}

function signature(payload, secret) {
  return createHmac('sha256', secret).update(payload).digest('base64url');
}

function createToken(secret) {
  const payload = base64url(JSON.stringify({ role: 'master', exp: Date.now() + SESSION_SECONDS * 1000 }));
  return `${payload}.${signature(payload, secret)}`;
}

function readCookie(request) {
  const cookies = request.headers.get('cookie') || '';
  const item = cookies.split(';').map(value => value.trim()).find(value => value.startsWith(`${COOKIE_NAME}=`));
  return item ? decodeURIComponent(item.slice(COOKIE_NAME.length + 1)) : '';
}

function validToken(token, secret) {
  const [payload, receivedSignature, extra] = token.split('.');
  if (!payload || !receivedSignature || extra || !sameValue(receivedSignature, signature(payload, secret))) return false;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return data.role === 'master' && Number(data.exp) > Date.now();
  } catch {
    return false;
  }
}

function config() {
  const login = process.env.MASTER_ADMIN_LOGIN?.trim().toLowerCase();
  const password = process.env.MASTER_ADMIN_PASSWORD;
  const secret = process.env.AUTH_SESSION_SECRET;
  const name = process.env.MASTER_ADMIN_NAME?.trim() || 'Administrador Master';
  return { login, password, secret, name, ready: Boolean(login && password && secret && secret.length >= 32) };
}

function sessionCookie(value, maxAge) {
  const secure = process.env.VERCEL ? '; Secure' : '';
  return `${COOKIE_NAME}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${secure}`;
}

function publicUser(settings) {
  return { id: 'master', name: settings.name, login: settings.login, role: 'master', status: 'ativo' };
}

export async function POST(request) {
  const settings = config();
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
  const settings = config();
  if (!settings.ready) return json({ error: 'A conta Master ainda não foi configurada na Vercel.' }, 503);
  if (!validToken(readCookie(request), settings.secret)) return json({ error: 'Sessão não autenticada.' }, 401);
  return json({ user: publicUser(settings) });
}

export function DELETE() {
  return json({ ok: true }, 200, { 'Set-Cookie': sessionCookie('', 0) });
}
