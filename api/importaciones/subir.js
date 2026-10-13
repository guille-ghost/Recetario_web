const { verifyAdminSession } = require("../../lib/admin-session");

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ error: "Método no permitido." });
  if (!verifyAdminSession(req)) return res.status(401).json({ error: "Sesión administrativa requerida." });
  const { AUTOMATION_API_URL, AUTOMATION_UPLOAD_SECRET } = process.env;
  if (!AUTOMATION_API_URL || !AUTOMATION_UPLOAD_SECRET) return res.status(503).json({ error: "Falta configurar el servicio de automatización." });
  const payload = req.body && typeof req.body === "object" ? req.body : {};
  if (typeof payload.contentBase64 !== "string" || Buffer.byteLength(payload.contentBase64, "utf8") > 3_000_000) {
    return res.status(413).json({ error: "El archivo supera el límite de 2,2 MB para subirlo desde el panel." });
  }
  try {
    const upstream = await fetch(`${AUTOMATION_API_URL.replace(/\/$/, "")}/upload`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Upload-Secret": AUTOMATION_UPLOAD_SECRET },
      body: JSON.stringify(payload),
    });
    const data = await upstream.json().catch(() => ({}));
    return res.status(upstream.status).json(data);
  } catch (error) {
    console.error("Automation upload proxy:", error.message);
    return res.status(502).json({ error: "No se pudo contactar el servicio de automatización." });
  }
};

module.exports.config = { api: { bodyParser: { sizeLimit: "4mb" } } };
