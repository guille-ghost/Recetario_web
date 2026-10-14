import crypto from 'node:crypto';
import { verifyAdminSession } from './admin-session.js';

const URL = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const MAX_BODY = 1024 * 1024;
const EQUIPOS = new Set(['caja-china', 'cilindro', 'parrilla', 'horno-barro', 'cocina-convencional', 'airfryer']);
const CARNES = new Set(['res', 'cerdo', 'pollo', 'cordero', 'pescado']);

function reply(res, code, data) { res.setHeader('Content-Type', 'application/json; charset=utf-8'); res.setHeader('Cache-Control', 'no-store'); res.status(code).json(data); }
function readBody(req) { return typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {}; }
function secureEq(a, b) { const x = Buffer.from(a || ''), y = Buffer.from(b || ''); return x.length > 0 && x.length === y.length && crypto.timingSafeEqual(x, y); }
function isAuthorizedIntegration(req) {
  const legacySecret = process.env.N8N_IMPORT_SECRET;
  const secret = process.env.PORTAL_IMPORT_SECRET || legacySecret;
  return secureEq((req.headers.authorization || '').replace(/^Bearer\s+/i, ''), secret);
}
async function db(path, options = {}) {
  const response = await fetch(`${URL}/rest/v1/${path}`, { ...options, headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json', ...(options.headers || {}) } });
  const raw = await response.text(); if (!response.ok) throw new Error(`Supabase ${response.status}: ${raw.slice(0, 400)}`); return raw ? JSON.parse(raw) : [];
}
function validateRecipe(r) {
  const errors = [];
  if (!r || typeof r !== 'object' || Array.isArray(r)) return ['recipe debe ser un objeto'];
  for (const key of ['titulo', 'descripcion', 'tiempoPrep', 'tiempoCoccion']) if (typeof r[key] !== 'string' || !r[key].trim() || r[key].length > 2000) errors.push(`${key} es obligatorio (máximo 2000 caracteres)`);
  if (!EQUIPOS.has(r.equipo)) errors.push('equipo no reconocido');
  if (!CARNES.has(r.carne)) errors.push('carne no reconocida');
  if (!Number.isInteger(Number(r.porciones)) || Number(r.porciones) < 1 || Number(r.porciones) > 1000) errors.push('porciones debe ser un entero entre 1 y 1000');
  for (const key of ['ingredientes', 'pasos']) if (!Array.isArray(r[key]) || !r[key].length || r[key].length > 300 || r[key].some(x => typeof x !== 'string' || !x.trim() || x.length > 2000)) errors.push(`${key} requiere entre 1 y 300 líneas de texto`);
  for (const key of ['maridajeSalsas', 'maridajeEnsaladas', 'maridajeBebidas']) if (r[key] !== undefined && (!Array.isArray(r[key]) || r[key].length > 100 || r[key].some(x => typeof x !== 'string' || x.length > 200))) errors.push(`${key} debe ser una lista válida`);
  if (r.imagen && (typeof r.imagen !== 'string' || r.imagen.length > 2000 || !/^https:\/\//i.test(r.imagen))) errors.push('imagen debe ser una URL HTTPS válida');
  return errors;
}
function validateItem(item, contentType) {
  const errors = [];
  const allowed = contentType === 'catalogo' ? new Set(['salsa', 'acompanamiento', 'ensalada']) : new Set(['coctel', 'vino', 'cerveza', 'sin-alcohol']);
  if (!item || typeof item !== 'object' || Array.isArray(item)) return ['item debe ser un objeto'];
  for (const key of ['nombre', 'tiempoPrep', 'descripcion']) if (typeof item[key] !== 'string' || !item[key].trim() || item[key].length > 2000) errors.push(`${key} es obligatorio`);
  if (!allowed.has(item.tipo)) errors.push('tipo no reconocido para la categoría');
  if (!Number.isInteger(Number(item.porciones)) || Number(item.porciones) < 1 || Number(item.porciones) > 1000) errors.push('porciones debe ser un entero entre 1 y 1000');
  for (const key of ['ingredientes', 'pasos']) if (!Array.isArray(item[key]) || item[key].length > 300 || item[key].some(x => typeof x !== 'string' || x.length > 2000)) errors.push(`${key} debe ser una lista válida`);
  if (item.imagen && (typeof item.imagen !== 'string' || item.imagen.length > 2000 || !/^https:\/\//i.test(item.imagen))) errors.push('imagen debe ser una URL HTTPS válida');
  return errors;
}
function slug(value) { return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 120); }
function reqSize(body) { return Buffer.byteLength(JSON.stringify(body)); }

export async function handle(req, res, route = {}) {
  const { resource } = route;
  const legacyResources = new Set(['registrar', 'borradores', 'borrador', 'publicar']);
  if (resource && legacyResources.has(resource)) {
    return reply(res, 410, {
      error: 'El flujo de importación legacy quedó deshabilitado.',
      detail: 'La automatización actual usa Python/FastAPI y la ruta legacy ya no está activa.'
    });
  }
  if (!URL || !KEY) return reply(res, 503, { error: 'Falta configurar Supabase en el servidor.' });
  try {
    const body = readBody(req); if (req.body && reqSize(body) > MAX_BODY) return reply(res, 413, { error: 'Solicitud demasiado grande.' });
    const { id, action } = route;
    return reply(res, 405, { error: 'Método o recurso no permitido.' });
  } catch (error) { console.error('API importaciones:', error.message); return reply(res, 500, { error: 'No se pudo completar la operación de importación.' }); }
}

export default handle;
