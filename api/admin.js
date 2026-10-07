const crypto = require("crypto");

const COOKIE_NAME = "fuego_admin_session";
const COOKIE_MAX_AGE = 60 * 60 * 8;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const ADMIN_SESSION_SECRET = process.env.ADMIN_SESSION_SECRET;

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
      const key = decodeURIComponent(part.slice(0, separator));
      const value = decodeURIComponent(part.slice(separator + 1));
      cookies[key] = value;
      return cookies;
    }, {});
}

function base64UrlEncode(value) {
  return Buffer.from(value).toString("base64url");
}

function base64UrlDecode(value) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function signToken(payload) {
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = crypto
    .createHmac("sha256", ADMIN_SESSION_SECRET)
    .update(encodedPayload)
    .digest("base64url");
  return `${encodedPayload}.${signature}`;
}

function verifyToken(token) {
  if (!token || !ADMIN_SESSION_SECRET) return null;

  const separator = token.lastIndexOf(".");
  if (separator === -1) return null;

  const encodedPayload = token.slice(0, separator);
  const providedSignature = token.slice(separator + 1);
  const expectedSignature = crypto
    .createHmac("sha256", ADMIN_SESSION_SECRET)
    .update(encodedPayload)
    .digest("base64url");

  const expectedBuffer = Buffer.from(expectedSignature, "base64url");
  const providedBuffer = Buffer.from(providedSignature, "base64url");
  if (
    expectedBuffer.length !== providedBuffer.length ||
    !crypto.timingSafeEqual(expectedBuffer, providedBuffer)
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload));
    if (payload.exp <= Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch (error) {
    return null;
  }
}

function getSession(request) {
  const token = parseCookies(request)[COOKIE_NAME];
  return verifyToken(token);
}

async function readJsonBody(request) {
  const rawBody = request.body;
  if (rawBody == null) return {};
  if (typeof request.json === "function") return request.json();
  if (typeof rawBody === "string") return JSON.parse(rawBody);
  if (
    typeof rawBody === "object" &&
    !Symbol.asyncIterator in rawBody &&
    !Symbol.iterator in rawBody
  ) {
    return rawBody;
  }

  const chunks = [];
  for await (const chunk of rawBody) {
    chunks.push(chunk);
  }
  const body = Buffer.concat(chunks).toString("utf8");
  return body ? JSON.parse(body) : {};
}

function secureCookie(value, maxAge = COOKIE_MAX_AGE) {
  const secure = process.env.VERCEL_ENV === "production" ? "; Secure" : "";
  return `${COOKIE_NAME}=${encodeURIComponent(value)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAge}${secure}`;
}

function isCorrectPassword(password) {
  if (!ADMIN_PASSWORD || !password) return false;
  const expected = Buffer.from(String(ADMIN_PASSWORD));
  const provided = Buffer.from(String(password));
  return (
    expected.length === provided.length &&
    crypto.timingSafeEqual(expected, provided)
  );
}

module.exports = async function handler(request, response) {
  if (!ADMIN_PASSWORD || !ADMIN_SESSION_SECRET) {
    sendJson(response, 503, { error: "Configuración administrativa incompleta." });
    return;
  }

  const method = request.method || "GET";

  if (method === "GET") {
    const session = getSession(request);
    if (!session) {
      sendJson(response, 401, { authenticated: false });
      return;
    }
    sendJson(response, 200, { authenticated: true });
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

      if (!isCorrectPassword(body.password)) {
        sendJson(response, 401, { error: "Credenciales inválidas." });
        return;
      }

      const token = signToken({
        sub: "administrator",
        exp: Math.floor(Date.now() / 1000) + COOKIE_MAX_AGE
      });
      response.setHeader("Set-Cookie", secureCookie(token));
      sendJson(response, 200, { authenticated: true });
    } catch (error) {
      sendJson(response, 400, { error: "La petición no es válida." });
    }
    return;
  }

  sendJson(response, 405, { error: "Método no permitido." });
};
