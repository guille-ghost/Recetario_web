const { handle } = require("../../../../lib/importaciones");
module.exports = (req, res) => handle(req, res, { resource: "publicar", id: req.query.id });
