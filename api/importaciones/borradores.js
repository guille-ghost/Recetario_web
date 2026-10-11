const { handle } = require("../../lib/importaciones");
module.exports = (req, res) => handle(req, res, { resource: "borradores", onlyPending: true });
