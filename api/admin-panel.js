const { verifyAdminSession } = require("../lib/admin-session");

module.exports = function handler(request, response) {
  if (!verifyAdminSession(request)) {
    response.status(401).setHeader("Location", "/admin").setHeader("Cache-Control", "no-store").end();
    return;
  }

  response.status(302).setHeader("Location", "/admin-panel").setHeader("Cache-Control", "no-store").end();
};
