const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const COOKIE_NAME = "fuego_admin_session";
const ADMIN_SESSION_SECRET = process.env.ADMIN_SESSION_SECRET;
const PAGE_PATH = path.join(__dirname, "..", "private", "admin-panel.html");

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

function verifySession(request) {
  const token = parseCookies(request)[COOKIE_NAME];
  if (!token || !ADMIN_SESSION_SECRET) return false;
  const separator = token.lastIndexOf(".");
  if (separator === -1) return false;
  const encodedPayload = token.slice(0, separator);
  const providedSignature = token.slice(separator + 1);
  const expectedSignature = crypto.createHmac("sha256", ADMIN_SESSION_SECRET).update(encodedPayload).digest("base64url");
  const expectedBuffer = Buffer.from(expectedSignature, "base64url");
  const providedBuffer = Buffer.from(providedSignature, "base64url");
  if (expectedBuffer.length !== providedBuffer.length || !crypto.timingSafeEqual(expectedBuffer, providedBuffer)) return false;
  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8"));
    return Boolean(payload.exp && payload.exp > Math.floor(Date.now() / 1000));
  } catch (error) {
    return false;
  }
}

module.exports = function handler(request, response) {
  if (!verifySession(request)) {
    response.status(401).setHeader("Location", "/admin").setHeader("Cache-Control", "no-store").end();
    return;
  }

  try {
    const html = fs.readFileSync(PAGE_PATH, "utf8");
    response.status(200).setHeader("Content-Type", "text/html; charset=utf-8").setHeader("Cache-Control", "no-store").send(html);
  } catch (error) {
    response.status(500).setHeader("Cache-Control", "no-store").json({ error: "No se pudo cargar el panel." });
  }
};
