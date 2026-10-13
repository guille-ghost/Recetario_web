const {
  COOKIE_MAX_AGE,
  adminSessionCookie,
  getAuthorizedAdmin,
  signAdminSession,
  verifyAdminSession,
} = require('../lib/admin-session');

function sendJson(response, statusCode, body) {
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.setHeader('Cache-Control', 'no-store');
  response.status(statusCode).json(body);
}

async function readJsonBody(request) {
  if (request.body == null) return {};
  if (typeof request.json === 'function') return request.json();
  if (typeof request.body === 'string') return JSON.parse(request.body);
  if (Buffer.isBuffer(request.body)) return request.body.length ? JSON.parse(request.body.toString('utf8')) : {};
  return request.body;
}

module.exports = async function handler(request, response) {
  const { ADMIN_SESSION_SECRET, SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, SUPABASE_ANON_KEY, SUPABASE_ADMIN_EMAIL } = process.env;
  if (!ADMIN_SESSION_SECRET || !SUPABASE_URL || !(SUPABASE_PUBLISHABLE_KEY || SUPABASE_ANON_KEY) || !SUPABASE_ADMIN_EMAIL) {
    sendJson(response, 503, { error: 'Falta configurar la autenticación de Supabase en el servidor.' });
    return;
  }

  if (request.method === 'GET') {
    const session = verifyAdminSession(request);
    sendJson(response, session ? 200 : 401, { authenticated: Boolean(session) });
    return;
  }

  if (request.method === 'POST') {
    try {
      const body = await readJsonBody(request);
      if (body.action === 'logout') {
        response.setHeader('Set-Cookie', adminSessionCookie('', 0));
        sendJson(response, 200, { authenticated: false });
        return;
      }

      const user = await getAuthorizedAdmin(body.access_token);
      if (!user) {
        sendJson(response, 401, { error: 'La cuenta no está autorizada para administrar el sitio.' });
        return;
      }

      const token = signAdminSession({
        sub: user.id,
        email: user.email,
        exp: Math.floor(Date.now() / 1000) + COOKIE_MAX_AGE,
      });
      response.setHeader('Set-Cookie', adminSessionCookie(token));
      sendJson(response, 200, { authenticated: true });
    } catch (error) {
      console.error('Error de autenticación del administrador:', error);
      sendJson(response, 400, { error: 'No se pudo completar el inicio de sesión.' });
    }
    return;
  }

  sendJson(response, 405, { error: 'Método no permitido.' });
};
