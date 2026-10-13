const crypto = require("crypto");
const { verifyAdminSession } = require("./admin-session");
const URL = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const MAX_BODY = 1024 * 1024;
const EQUIPOS = new Set(["caja-china", "cilindro", "parrilla", "horno-barro", "cocina-convencional", "airfryer"]);
const CARNES = new Set(["res", "cerdo", "pollo", "cordero", "pescado"]);

function reply(res, code, data) { res.setHeader("Content-Type", "application/json; charset=utf-8"); res.setHeader("Cache-Control", "no-store"); res.status(code).json(data); }
function readBody(req) { return typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {}; }
function secureEq(a, b) { const x = Buffer.from(a || ""), y = Buffer.from(b || ""); return x.length > 0 && x.length === y.length && crypto.timingSafeEqual(x, y); }
function isAuthorizedIntegration(req) {
  const legacySecret = process.env.N8N_IMPORT_SECRET;
  const secret = process.env.PORTAL_IMPORT_SECRET || legacySecret;
  return secureEq((req.headers.authorization || "").replace(/^Bearer\s+/i, ""), secret);
}
async function db(path, options={}) {
  const response=await fetch(`${URL}/rest/v1/${path}`,{...options,headers:{apikey:KEY,Authorization:`Bearer ${KEY}`,"Content-Type":"application/json",...(options.headers||{})}});
  const raw=await response.text(); if(!response.ok) throw new Error(`Supabase ${response.status}: ${raw.slice(0,400)}`); return raw ? JSON.parse(raw) : [];
}
function validateRecipe(r) {
  const errors=[];
  if (!r || typeof r !== "object" || Array.isArray(r)) return ["recipe debe ser un objeto"];
  for(const key of ["titulo","descripcion","tiempoPrep","tiempoCoccion"]) if(typeof r[key]!=="string" || !r[key].trim() || r[key].length>2000) errors.push(`${key} es obligatorio (máximo 2000 caracteres)`);
  if(!EQUIPOS.has(r.equipo)) errors.push("equipo no reconocido");
  if(!CARNES.has(r.carne)) errors.push("carne no reconocida");
  if(!Number.isInteger(Number(r.porciones)) || Number(r.porciones)<1 || Number(r.porciones)>1000) errors.push("porciones debe ser un entero entre 1 y 1000");
  for(const key of ["ingredientes","pasos"]) if(!Array.isArray(r[key]) || !r[key].length || r[key].length>300 || r[key].some(x=>typeof x!=="string" || !x.trim() || x.length>2000)) errors.push(`${key} requiere entre 1 y 300 líneas de texto`);
  for(const key of ["maridajeSalsas","maridajeEnsaladas","maridajeBebidas"]) if(r[key]!==undefined && (!Array.isArray(r[key]) || r[key].length>100 || r[key].some(x=>typeof x!=="string" || x.length>200))) errors.push(`${key} debe ser una lista válida`);
  if(r.imagen && (typeof r.imagen!=="string" || r.imagen.length>2000 || !/^https:\/\//i.test(r.imagen))) errors.push("imagen debe ser una URL HTTPS válida");
  return errors;
}
function validateItem(item, contentType) {
  const errors=[];
  const allowed = contentType === "catalogo" ? new Set(["salsa","acompanamiento","ensalada"]) : new Set(["coctel","vino","cerveza","sin-alcohol"]);
  if (!item || typeof item !== "object" || Array.isArray(item)) return ["item debe ser un objeto"];
  for(const key of ["nombre","tiempoPrep","descripcion"]) if(typeof item[key]!=="string" || !item[key].trim() || item[key].length>2000) errors.push(`${key} es obligatorio`);
  if(!allowed.has(item.tipo)) errors.push("tipo no reconocido para la categoría");
  if(!Number.isInteger(Number(item.porciones)) || Number(item.porciones)<1 || Number(item.porciones)>1000) errors.push("porciones debe ser un entero entre 1 y 1000");
  for(const key of ["ingredientes","pasos"]) if(!Array.isArray(item[key]) || item[key].length>300 || item[key].some(x=>typeof x!=="string" || x.length>2000)) errors.push(`${key} debe ser una lista válida`);
  if(item.imagen && (typeof item.imagen!=="string" || item.imagen.length>2000 || !/^https:\/\//i.test(item.imagen))) errors.push("imagen debe ser una URL HTTPS válida");
  return errors;
}
function slug(value) { return value.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,120); }
function reqSize(body) { return Buffer.byteLength(JSON.stringify(body)); }

async function handle(req,res,route={}) {
  if(!URL || !KEY) return reply(res,503,{error:"Falta configurar Supabase en el servidor."});
  try {
    const body=readBody(req); if(req.body && reqSize(body)>MAX_BODY) return reply(res,413,{error:"Solicitud demasiado grande."});
    const {resource, id, action}=route;
    if(resource==="registrar") {
      if(req.method!=="POST") return reply(res,405,{error:"Método no permitido."});
      if(!isAuthorizedIntegration(req)) return reply(res,401,{error:"Secreto de integración inválido."});
      if(typeof body.driveFileId!=="string" || !body.driveFileId.trim() || typeof body.contentHash!=="string" || !/^[a-f0-9]{64}$/i.test(body.contentHash) || typeof body.fileName!=="string" || !body.fileName.trim()) return reply(res,400,{error:"driveFileId, contentHash SHA-256 (64 caracteres hex) y fileName son obligatorios."});
      const rows=await db("importacion_archivos?on_conflict=drive_file_id%2Ccontent_hash",{method:"POST",headers:{Prefer:"resolution=merge-duplicates,return=representation"},body:JSON.stringify({drive_file_id:body.driveFileId.slice(0,500),content_hash:body.contentHash.slice(0,128),nombre_archivo:body.fileName.slice(0,500),mime_type:String(body.mimeType||"").slice(0,200),estado:"pendiente",error:""})});
      return reply(res,200,{ok:true,archivo:rows[0]});
    }
    if(resource==="borradores" && req.method==="POST") {
      if(!isAuthorizedIntegration(req)) return reply(res,401,{error:"Secreto de integración inválido."});
      if(typeof body.driveFileId!=="string" || typeof body.contentHash!=="string" || !/^[a-f0-9]{64}$/i.test(body.contentHash)) return reply(res,400,{error:"Faltan metadatos válidos del archivo y SHA-256."});
      const files=await db(`importacion_archivos?drive_file_id=eq.${encodeURIComponent(body.driveFileId)}&content_hash=eq.${encodeURIComponent(body.contentHash)}&select=id`);
      if(!files.length) return reply(res,404,{error:"Registra primero el archivo detectado."});
      const contentType=["receta","catalogo","bar"].includes(body.contentType)?body.contentType:"receta";
      const errors=contentType==="receta"?validateRecipe(body.recipe):validateItem(body.recipe,contentType);
      const recipeKey=String(body.recipeKey||slug(body.recipe?.titulo||body.recipe?.nombre||"")||crypto.createHash("sha256").update(JSON.stringify(body.recipe||{})).digest("hex")).trim().slice(0,200);
      const rows=await db("recetas_borradores?on_conflict=importacion_archivo_id%2Creceta_key",{method:"POST",headers:{Prefer:"resolution=merge-duplicates,return=representation"},body:JSON.stringify({importacion_archivo_id:files[0].id,receta_key:recipeKey,content_type:contentType,receta:body.recipe||{},estado:"pendiente",error_validacion:errors,updated_at:new Date().toISOString()})});
      await db(`importacion_archivos?id=eq.${encodeURIComponent(files[0].id)}`,{method:"PATCH",body:JSON.stringify({estado:"procesado"})});
      return reply(res,200,{ok:true,borrador:rows[0],validacion:errors});
    }
    if(!verifyAdminSession(req)) return reply(res,401,{error:"Sesión administrativa requerida."});
    if(resource==="borradores" && req.method==="GET") {
      const drafts=await db(`recetas_borradores?select=*&order=created_at.desc&limit=100${route.onlyPending?"&estado=eq.pendiente":""}`);
      const fileIds=[...new Set(drafts.map(x=>x.importacion_archivo_id))];
      const files=fileIds.length?await db(`importacion_archivos?id=in.(${fileIds.map(encodeURIComponent).join(",")})&select=*`):[];
      const byId=new Map(files.map(x=>[x.id,x]));
      return reply(res,200,drafts.map(x=>({...x,archivo:byId.get(x.importacion_archivo_id)||null})));
    }
    if(resource==="borrador" && req.method==="PUT") {
      if(!id) return reply(res,400,{error:"ID de borrador requerido."});
      if(body.action==="descartar") {
        const rows=await db(`recetas_borradores?id=eq.${encodeURIComponent(id)}&estado=eq.pendiente`,{method:"PATCH",headers:{Prefer:"return=representation"},body:JSON.stringify({estado:"descartado",revisado_en:new Date().toISOString(),updated_at:new Date().toISOString()})});
        return rows.length?reply(res,200,rows[0]):reply(res,404,{error:"Borrador pendiente no encontrado."});
      }
      const drafts=await db(`recetas_borradores?id=eq.${encodeURIComponent(id)}&estado=eq.pendiente&select=content_type`); if(!drafts.length) return reply(res,404,{error:"Borrador pendiente no encontrado."});
      const errors=drafts[0].content_type==="receta"?validateRecipe(body.receta):validateItem(body.receta,drafts[0].content_type); if(errors.length) return reply(res,422,{error:"El borrador tiene campos inválidos.",details:errors});
      const rows=await db(`recetas_borradores?id=eq.${encodeURIComponent(id)}&estado=eq.pendiente`,{method:"PATCH",headers:{Prefer:"return=representation"},body:JSON.stringify({receta:body.receta,error_validacion:[],updated_at:new Date().toISOString()})});
      return rows.length?reply(res,200,rows[0]):reply(res,404,{error:"Borrador pendiente no encontrado."});
    }
    if(resource==="publicar" && req.method==="POST") {
      if(!id) return reply(res,400,{error:"ID de borrador requerido."});
      const drafts=await db(`recetas_borradores?id=eq.${encodeURIComponent(id)}&estado=eq.pendiente&select=*`); if(!drafts.length) return reply(res,404,{error:"Borrador pendiente no encontrado."});
      const draft=drafts[0], r=draft.receta, contentType=draft.content_type||"receta", errors=contentType==="receta"?validateRecipe(r):validateItem(r,contentType); if(errors.length) return reply(res,422,{error:"El borrador aún tiene campos inválidos.",details:errors});
      const itemSlug=slug(r.titulo||r.nombre); if(!itemSlug) return reply(res,422,{error:"No se pudo generar el slug."});
      const published=await db("rpc/publicar_importacion_borrador",{method:"POST",body:JSON.stringify({p_borrador_id:id,p_slug:itemSlug})});
      return reply(res,200,{ok:true,slug:published,contentType});
    }
    return reply(res,405,{error:"Método o recurso no permitido."});
  } catch(error) { console.error("API importaciones:",error.message); return reply(res,500,{error:"No se pudo completar la operación de importación."}); }
}
module.exports={handle};
