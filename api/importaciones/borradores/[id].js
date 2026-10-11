const { handle } = require("../../../lib/importaciones");
module.exports = (req, res) => handle(req, res, { resource: "borrador", id: req.query.id });
