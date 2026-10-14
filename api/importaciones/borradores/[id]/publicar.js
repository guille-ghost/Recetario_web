import { handle } from '../../../../lib/importaciones.js';

export default (req, res) => handle(req, res, { resource: 'publicar', id: req.query.id });
