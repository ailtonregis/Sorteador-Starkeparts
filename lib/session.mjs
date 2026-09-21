import { createHmac, timingSafeEqual } from 'node:crypto';

export const COOKIE_NAME = 'starke_master_session';
export const SESSION_SECONDS = 8 * 60 * 60;

export const json = (body, status = 200, headers = {}) => Response.json(body, {
  status,
  headers: { 'Cache-Control': 'no-store', ...headers },
});

export function sameValue(left, right) {
  const a = Buffer.from(String(left));
  const b = Buffer.from(String(right));
  return a.length === b.length && timingSafeEqual(a, b);
}

function signature(payload, secret) {
  return createHmac('sha256', secret).update(payload).digest('base64url');
}

export function createToken(secret) {
  const payload = Buffer.from(JSON.stringify({ role: 'master', exp: Date.now() + SESSION_SECONDS * 1000 })).toString('base64url');
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

export function authConfig() {
  const login = process.env.MASTER_ADMIN_LOGIN?.trim().toLowerCase();
  const password = process.env.MASTER_ADMIN_PASSWORD;
  const secret = process.env.AUTH_SESSION_SECRET;
  const name = process.env.MASTER_ADMIN_NAME?.trim() || 'Administrador Master';
  return { login, password, secret, name, ready: Boolean(login && password && secret && secret.length >= 32) };
}

export function publicUser(settings) {
  return { id: 'master', name: settings.name, login: settings.login, role: 'master', status: 'ativo' };
}

export function isMasterRequest(request) {
  const settings = authConfig();
  return settings.ready && validToken(readCookie(request), settings.secret);
}

export function sessionCookie(value, maxAge) {
  const secure = process.env.VERCEL ? '; Secure' : '';
  return `${COOKIE_NAME}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${secure}`;
}
