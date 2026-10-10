const crypto = require("crypto");

const COOKIE_NAME = "fuego_admin_session";
const COOKIE_MAX_AGE = 60 * 60 * 8;
const ADMIN_SESSION_SECRET = process.env.ADMIN_SESSION_SECRET;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_API_KEY = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY;
const SUPABASE_ADMIN_EMAIL = (process.env.SUPABASE_ADMIN_EMAIL || "").trim().toLowerCase();

function sendJson(response, statusCode, body) {
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("Cache-Control", "no-store");
  response.status(statusCode).json(body);
}

function parseCookies(request) {
  return (request.headers.cookie || "")
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce((cookies, part) => {
      const separator = part.indexOf("=");
      if (separator === -1) return cookies;
      cookies[decodeURIComponent(part.slice(0, separator))] = decodeURIComponent(part.slice(separator + 1));
      return cookies;
    }, {});
}

function signToken(payload) {
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto.createHmac("sha256", ADMIN_SESSION_SECRET).update(encoded).digest("base64url");
  return `${encoded}.${signature}`;
}

function verifyToken(token) {
  if (!token || !ADMIN_SESSION_SECRET) return null;
  const separator = token.lastIndexOf(".");
  if (separator < 0) return null;
  const encoded = token.slice(0, separator);
  const signature = token.slice(separator + 1);
  const expected = crypto.createHmac("sha256", ADMIN_SESSION_SECRET).update(encoded).digest("base64url");
  const expectedBytes = Buffer.from(expected, "base64url");
  const signatureBytes = Buffer.from(signature, "base64url");
  if (expectedBytes.length !== signatureBytes.length || !crypto.timingSafeEqual(expectedBytes, signatureBytes)) return null;
  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
    return payload.exp > Math.floor(Date.now() / 1000) ? payload : null;
  } catch {
    return null;
  }
}

async function readJsonBody(request) {
  if (request.body == null) return {};
  if (typeof request.json === "function") return request.json();
  if (typeof request.body === "string") return JSON.parse(request.body);
  if (Buffer.isBuffer(request.body)) return request.body.length ? JSON.parse(request.body.toString("utf8")) : {};
  return request.body;
}

function secureCookie(value, maxAge = COOKIE_MAX_AGE) {
  const secure = process.env.VERCEL_ENV === "production" ? "; Secure" : "";
  return `${COOKIE_NAME}=${encodeURIComponent(value)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAge}${secure}`;
}

async function getAuthorizedUser(accessToken) {
  if (!accessToken) return null;
  const result = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: SUPABASE_API_KEY, Authorization: `Bearer ${accessToken}` }
  });
  if (!result.ok) return null;
  const user = await result.json();
  return (user.email || "").trim().toLowerCase() === SUPABASE_ADMIN_EMAIL ? user : null;
}

module.exports = async function handler(request, response) {
  if (!ADMIN_SESSION_SECRET || !SUPABASE_URL || !SUPABASE_API_KEY || !SUPABASE_ADMIN_EMAIL) {
    sendJson(response, 503, { error: "Falta configurar la autenticación de Supabase en el servidor." });
    return;
  }

  const method = request.method || "GET";
  if (method === "GET") {
    const session = verifyToken(parseCookies(request)[COOKIE_NAME]);
    sendJson(response, session ? 200 : 401, { authenticated: Boolean(session) });
    return;
  }

  if (method === "POST") {
    try {
      const body = await readJsonBody(request);
      if (body.action === "logout") {
        response.setHeader("Set-Cookie", secureCookie("", 0));
        sendJson(response, 200, { authenticated: false });
        return;
      }

      const user = await getAuthorizedUser(body.access_token);
      if (!user) {
        sendJson(response, 401, { error: "La cuenta no está autorizada para administrar el sitio." });
        return;
      }

      const token = signToken({
        sub: user.id,
        email: user.email,
        exp: Math.floor(Date.now() / 1000) + COOKIE_MAX_AGE
      });
      response.setHeader("Set-Cookie", secureCookie(token));
      sendJson(response, 200, { authenticated: true });
    } catch (error) {
      console.error("Error de autenticación del administrador:", error);
      sendJson(response, 400, { error: "No se pudo completar el inicio de sesión." });
    }
    return;
  }

  sendJson(response, 405, { error: "Método no permitido." });
};
