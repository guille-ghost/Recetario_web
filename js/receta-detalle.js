/* ============================================================
   js/receta-detalle.js
   Paso 3 del flujo parrillero: lee el parámetro ?slug= de la URL,
   busca la receta combinada (base + localStorage) y la redacta
   en pantalla, incluyendo el módulo automático de Maridaje
   (Salsas / Acompañamientos del catálogo + Bebidas del Bar).
   ============================================================ */

document.addEventListener("DOMContentLoaded", async () => {
  const contenedor = document.getElementById("contenido-receta");
  const params = new URLSearchParams(window.location.search);
  const slug = params.get("slug");

  let receta = null;
  try {
    receta = slug ? await DataManager.getRecetaBySlug(slug) : null;
  } catch (error) {
    console.error("Error cargando la receta:", error);
    contenedor.innerHTML = '<p class="text-ash">No se pudo conectar con Supabase para cargar esta receta.</p>';
    return;
  }

  if (!receta) {
    const tpl = document.getElementById("tpl-no-encontrada");
    contenedor.innerHTML = "";
    contenedor.appendChild(tpl.content.cloneNode(true));
    return;
  }

  document.getElementById("tab-title").textContent = `${receta.titulo} | Fuego Real`;
  renderReceta(receta);
});

function renderReceta(receta) {
  const contenedor = document.getElementById("contenido-receta");
  const progreso = cargarProgreso(receta.slug);

  const ingredientesHtml = receta.ingredientes
    .map((ing, i) => `
      <li>
        <label class="flex gap-3 items-start cursor-pointer group">
          <input type="checkbox" data-tipo="ingrediente" data-index="${i}"
            class="chk-progreso mt-1 w-4 h-4 accent-ember flex-shrink-0 cursor-pointer" ${progreso.ingredientes[i] ? "checked" : ""} />
          <span class="chk-texto ${progreso.ingredientes[i] ? "line-through text-ash" : ""} group-hover:text-ember transition">${ing}</span>
        </label>
      </li>`)
    .join("");

  const pasosHtml = receta.pasos
    .map(
      (paso, i) => `
      <li>
        <label class="flex gap-4 items-start cursor-pointer group">
          <input type="checkbox" data-tipo="paso" data-index="${i}"
            class="chk-progreso peer sr-only" ${progreso.pasos[i] ? "checked" : ""} />
          <span class="flex-shrink-0 w-8 h-8 rounded-full bg-charcoal text-parchment font-display flex items-center justify-center text-sm peer-checked:bg-ember transition cursor-pointer select-none">
            ${progreso.pasos[i] ? "✓" : i + 1}
          </span>
          <p class="pt-1 chk-texto ${progreso.pasos[i] ? "line-through text-ash" : ""} group-hover:text-ember transition">${paso}</p>
        </label>
      </li>`
    )
    .join("");

  contenedor.innerHTML = `
    <a href="recetario.html" class="text-sm text-ember hover:underline">← Volver al recetario</a>

    <div class="mt-4 mb-6 flex gap-2">
      <span class="text-[11px] uppercase tracking-wide bg-charcoal text-parchment px-2 py-1 rounded-full">${DataManager.LABELS_EQUIPO[receta.equipo] || receta.equipo}</span>
      <span class="text-[11px] uppercase tracking-wide bg-ember/20 text-ember px-2 py-1 rounded-full">${DataManager.LABELS_CARNE[receta.carne] || receta.carne}</span>
    </div>

    <h1 class="font-display text-4xl md:text-5xl mb-4">${receta.titulo}</h1>
    <p class="text-ash text-lg mb-6">${receta.descripcion}</p>

    <div class="rounded-xl overflow-hidden mb-8">
      <img src="${receta.imagen}" alt="${receta.titulo}" class="w-full h-72 object-cover" />
    </div>

    <div class="grid grid-cols-3 gap-4 mb-10 text-center">
      <div class="bg-smoke/80 border border-ash/20 rounded-lg py-4">
        <p class="text-xs text-ash uppercase tracking-wide">Preparación</p>
        <p class="font-display text-lg">${receta.tiempoPrep}</p>
      </div>
      <div class="bg-smoke/80 border border-ash/20 rounded-lg py-4">
        <p class="text-xs text-ash uppercase tracking-wide">Cocción</p>
        <p class="font-display text-lg">${receta.tiempoCoccion}</p>
      </div>
      <div class="bg-smoke/80 border border-ash/20 rounded-lg py-4">
        <p class="text-xs text-ash uppercase tracking-wide">Porciones</p>
        <p class="font-display text-lg">${receta.porciones}</p>
      </div>
    </div>

    <div class="grid xl:grid-cols-[minmax(0,2fr)_minmax(300px,0.9fr)] gap-12 items-start">
      <div>
        <div class="grid md:grid-cols-[minmax(220px,0.9fr)_minmax(0,2fr)] gap-8 lg:gap-12 mb-4">
          <section class="min-w-0">
            <div class="flex items-center justify-between mb-4">
              <h2 class="font-display text-2xl text-ember">Ingredientes</h2>
              <span id="contador-ingredientes" class="text-xs text-ash"></span>
            </div>
            <ul class="space-y-3 text-gray-200">${ingredientesHtml}</ul>
          </section>
          <section class="min-w-0">
            <div class="flex items-center justify-between mb-4">
              <h2 class="font-display text-2xl text-ember">Preparación</h2>
              <span id="contador-pasos" class="text-xs text-ash"></span>
            </div>
            <ol class="space-y-4 text-gray-200">${pasosHtml}</ol>
          </section>
        </div>

        <div class="mb-14 lg:mb-0">
          <button id="btn-reiniciar-progreso" class="text-sm text-ash hover:text-ember transition underline">
            Reiniciar checklist
          </button>
        </div>
      </div>

      <section id="modulo-maridaje" class="xl:border-l xl:border-ash/20 xl:pl-8 border-t border-ash/20 pt-8 xl:border-t-0 xl:pt-0">
        <p class="text-ember font-semibold tracking-widest text-xs uppercase mb-2">Maridaje sugerido</p>
        <h2 class="font-display text-2xl mb-6">Cómo acompañar esta receta</h2>
        <div class="grid gap-8">
          <div>
            <h3 class="font-display text-lg mb-3">Salsas y acompañamientos</h3>
            <div id="maridaje-salsas" class="grid gap-3"></div>
          </div>
          <div>
            <h3 class="font-display text-lg mb-3">Ensaladas</h3>
            <div id="maridaje-ensaladas" class="grid gap-3"></div>
          </div>
          <div>
            <h3 class="font-display text-lg mb-3">Bebidas del Bar</h3>
            <div id="maridaje-bebidas" class="grid gap-3"></div>
          </div>
        </div>
      </section>
    </div>
  `;

  activarChecklist(receta);
  renderMaridaje(receta);
}

/* ============================================================
   CHECKLIST INTERACTIVO (ingredientes y pasos)
   El progreso se guarda por receta (slug) en localStorage para
   que persista si recargas la página o vuelves más tarde.
   ============================================================ */
function claveProgreso(slug) {
  return `portal_gastronomico_progreso_${slug}`;
}

function cargarProgreso(slug) {
  try {
    const raw = localStorage.getItem(claveProgreso(slug));
    return raw ? JSON.parse(raw) : { ingredientes: [], pasos: [] };
  } catch (e) {
    return { ingredientes: [], pasos: [] };
  }
}

function guardarProgreso(slug, progreso) {
  localStorage.setItem(claveProgreso(slug), JSON.stringify(progreso));
}

function activarChecklist(receta) {
  const progreso = cargarProgreso(receta.slug);
  progreso.ingredientes = progreso.ingredientes || [];
  progreso.pasos = progreso.pasos || [];

  function actualizarContadores() {
    const totalIng = receta.ingredientes.length;
    const totalPasos = receta.pasos.length;
    const marcadosIng = progreso.ingredientes.filter(Boolean).length;
    const marcadosPasos = progreso.pasos.filter(Boolean).length;
    document.getElementById("contador-ingredientes").textContent = `${marcadosIng}/${totalIng} listos`;
    document.getElementById("contador-pasos").textContent = `${marcadosPasos}/${totalPasos} completados`;
  }

  document.querySelectorAll(".chk-progreso").forEach((chk) => {
    chk.addEventListener("change", () => {
      const tipo = chk.dataset.tipo;
      const index = Number(chk.dataset.index);
      const arr = tipo === "ingrediente" ? progreso.ingredientes : progreso.pasos;
      arr[index] = chk.checked;
      guardarProgreso(receta.slug, progreso);

      const label = chk.closest("label");
      const texto = label.querySelector(".chk-texto");
      texto.classList.toggle("line-through", chk.checked);
      texto.classList.toggle("text-ash", chk.checked);

      if (tipo === "paso") {
        const circulo = label.querySelector("span.flex-shrink-0");
        circulo.textContent = chk.checked ? "✓" : String(index + 1);
      }

      actualizarContadores();
    });
  });

  const btnReiniciar = document.getElementById("btn-reiniciar-progreso");
  if (btnReiniciar) {
    btnReiniciar.addEventListener("click", () => {
      if (!confirm("¿Reiniciar el checklist de esta receta?")) return;
      guardarProgreso(receta.slug, { ingredientes: [], pasos: [] });
      renderReceta(receta);
    });
  }

  actualizarContadores();
}

async function renderMaridaje(receta) {
  const contSalsas = document.getElementById("maridaje-salsas");
  const contEnsaladas = document.getElementById("maridaje-ensaladas");
  const contBebidas = document.getElementById("maridaje-bebidas");
  let catalogo, bebidasCatalogo;
  try {
    [catalogo, bebidasCatalogo] = await Promise.all([DataManager.getCatalogo(), DataManager.getBar()]);
  } catch (error) {
    console.error("Error cargando las sugerencias de maridaje:", error);
    [contSalsas, contEnsaladas, contBebidas].forEach((contenedor) => {
      contenedor.innerHTML = '<p class="text-sm text-ash">No se pudo cargar el maridaje.</p>';
    });
    return;
  }
  const catalogoPorSlug = new Map(catalogo.map((item) => [item.slug, item]));
  const bebidasPorSlug = new Map(bebidasCatalogo.map((item) => [item.slug, item]));

  const salsas = (receta.maridajeSalsas || [])
    .map((slug) => catalogoPorSlug.get(slug))
    .filter(Boolean);

  const ensaladas = (receta.maridajeEnsaladas || [])
    .map((slug) => catalogoPorSlug.get(slug))
    .filter(Boolean);

  const bebidas = (receta.maridajeBebidas || [])
    .map((slug) => bebidasPorSlug.get(slug))
    .filter(Boolean);

  contSalsas.innerHTML = salsas.length
    ? salsas.map((item) => tarjetaMaridaje(item, "catalogo")).join("")
    : `<p class="text-sm text-ash">Sin sugerencias registradas para esta receta.</p>`;

  contEnsaladas.innerHTML = ensaladas.length
    ? ensaladas.map((item) => tarjetaMaridaje(item, "catalogo")).join("")
    : `<p class="text-sm text-ash">Sin sugerencias registradas para esta receta.</p>`;

  contBebidas.innerHTML = bebidas.length
    ? bebidas.map((item) => tarjetaMaridaje(item, "bar")).join("")
    : `<p class="text-sm text-ash">Sin sugerencias registradas para esta receta.</p>`;

  document.querySelectorAll(".btn-maridaje").forEach((btn) => {
    btn.addEventListener("click", async () => abrirModalMaridaje(btn.dataset.slug, btn.dataset.origen));
  });
}

function tarjetaMaridaje(item, origen) {
  return `
    <button type="button" data-slug="${item.slug}" data-origen="${origen}"
       class="btn-maridaje w-full text-left flex gap-3 items-center bg-smoke/80 border border-ash/20 rounded-lg p-3 hover:border-ember transition">
      <img src="${item.imagen}" alt="${item.nombre}" class="w-14 h-14 rounded-md object-cover flex-shrink-0" />
      <div>
        <p class="font-medium text-sm">${item.nombre}</p>
        <p class="text-xs text-ash line-clamp-1">${item.descripcion}</p>
      </div>
    </button>
  `;
}

const ETIQUETAS_TIPO = {
  salsa: "Salsa",
  acompanamiento: "Acompañamiento",
  ensalada: "Ensalada",
  coctel: "Coctel",
  vino: "Vino",
  cerveza: "Cerveza",
  "sin-alcohol": "Sin alcohol"
};

/* ---- Modal de preparación (reutilizado para salsas, acompañamientos y bebidas) ---- */
async function abrirModalMaridaje(slug, origen) {
  const item = origen === "bar" ? await DataManager.getBarBySlug(slug) : await DataManager.getCatalogoBySlug(slug);
  if (!item) return;

  const modal = document.getElementById("modal-preparacion");

  document.getElementById("modal-tipo").textContent = ETIQUETAS_TIPO[item.tipo] || item.tipo;
  document.getElementById("modal-nombre").textContent = item.nombre;
  document.getElementById("modal-descripcion").textContent = item.descripcion;
  document.getElementById("modal-tiempo").textContent = item.tiempoPrep || "—";
  document.getElementById("modal-porciones").textContent = item.porciones ? `${item.porciones} porción(es)` : "—";

  document.getElementById("modal-ingredientes").innerHTML = (item.ingredientes || [])
    .map((ing) => `<li class="flex gap-2"><span class="text-ember">•</span><span>${ing}</span></li>`)
    .join("") || `<li class="text-ash">Sin ingredientes registrados.</li>`;

  document.getElementById("modal-pasos").innerHTML = (item.pasos || [])
    .map((paso, idx) => `
      <li class="flex gap-3">
        <span class="flex-shrink-0 w-6 h-6 rounded-full bg-charcoal text-parchment font-display flex items-center justify-center text-xs">${idx + 1}</span>
        <p class="pt-0.5">${paso}</p>
      </li>`)
    .join("") || `<li class="text-ash">Sin pasos registrados.</li>`;

  modal.classList.remove("hidden");
  document.body.classList.add("overflow-hidden");
}

function cerrarModalMaridaje() {
  document.getElementById("modal-preparacion").classList.add("hidden");
  document.body.classList.remove("overflow-hidden");
}

document.addEventListener("DOMContentLoaded", () => {
  const overlay = document.getElementById("modal-overlay");
  const btnCerrar = document.getElementById("modal-cerrar");
  if (overlay) overlay.addEventListener("click", cerrarModalMaridaje);
  if (btnCerrar) btnCerrar.addEventListener("click", cerrarModalMaridaje);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") cerrarModalMaridaje();
  });
});
