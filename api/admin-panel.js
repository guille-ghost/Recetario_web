import { verifyAdminSession } from '../lib/admin-session.js';

export default function handler(request, response) {
  if (!verifyAdminSession(request)) {
    response.status(401).setHeader('Location', '/admin').setHeader('Cache-Control', 'no-store').end();
    return;
  }

  response.status(302).setHeader('Location', '/admin-panel').setHeader('Cache-Control', 'no-store').end();
};
