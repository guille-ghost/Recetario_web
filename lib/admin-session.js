import crypto from 'node:crypto';

export const COOKIE_NAME = 'fuego_admin_session';
export const COOKIE_MAX_AGE = 60 * 60 * 8;

function parseCookies(request) {
  return (request.headers.cookie || '').split(';').reduce((cookies, part) => {
    const separator = part.indexOf('=');
    if (separator < 0) return cookies;
    try {
      cookies[decodeURIComponent(part.slice(0, separator).trim())] = decodeURIComponent(part.slice(separator + 1).trim());
    } catch {
      // Ignore malformed cookie values; they cannot establish an admin session.
    }
    return cookies;
  }, {});
}

export function verifyAdminSession(request) {
  const token = parseCookies(request)[COOKIE_NAME];
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!token || !secret) return null;

  const separator = token.lastIndexOf('.');
  if (separator < 1) return null;
  const encodedPayload = token.slice(0, separator);
  const providedSignature = Buffer.from(token.slice(separator + 1), 'base64url');
  const expectedSignature = Buffer.from(crypto.createHmac('sha256', secret).update(encodedPayload).digest('base64url'), 'base64url');
  if (expectedSignature.length !== providedSignature.length || !crypto.timingSafeEqual(expectedSignature, providedSignature)) return null;

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'));
    return payload.exp > Math.floor(Date.now() / 1000) ? payload : null;
  } catch {
    return null;
  }
}

export function signAdminSession(payload) {
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', process.env.ADMIN_SESSION_SECRET).update(encodedPayload).digest('base64url');
  return `${encodedPayload}.${signature}`;
}

export function adminSessionCookie(value, maxAge = COOKIE_MAX_AGE) {
  const secure = process.env.VERCEL_ENV === 'production' ? '; Secure' : '';
  return `${COOKIE_NAME}=${encodeURIComponent(value)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAge}${secure}`;
}

export async function getAuthorizedAdmin(accessToken) {
  const url = process.env.SUPABASE_URL;
  const apiKey = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY;
  const adminEmail = (process.env.SUPABASE_ADMIN_EMAIL || '').trim().toLowerCase();
  if (!accessToken || !url || !apiKey || !adminEmail) return null;

  const response = await fetch(`${url}/auth/v1/user`, {
    headers: { apikey: apiKey, Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) return null;
  const user = await response.json();
  return (user.email || '').trim().toLowerCase() === adminEmail ? user : null;
}
