/* ============================================================
   js/receta-detalle.js
   Paso 3 del flujo parrillero: lee el parámetro ?slug= de la URL,
   busca la receta combinada (base + localStorage) y la redacta
   en pantalla, incluyendo el módulo automático de Maridaje
   (Salsas / Acompañamientos del catálogo + Bebidas del Bar).
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {
  const contenedor = document.getElementById("contenido-receta");
  const params = new URLSearchParams(window.location.search);
  const slug = params.get("slug");

  const receta = slug ? DataManager.getRecetaBySlug(slug) : null;

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
      <span class="text-[11px] uppercase tracking-wide bg-ember/10 text-ember px-2 py-1 rounded-full">${DataManager.LABELS_CARNE[receta.carne] || receta.carne}</span>
    </div>

    <h1 class="font-display text-4xl md:text-5xl mb-4">${receta.titulo}</h1>
    <p class="text-smoke/80 text-lg mb-6">${receta.descripcion}</p>

    <div class="rounded-xl overflow-hidden mb-8">
      <img src="${receta.imagen}" alt="${receta.titulo}" class="w-full h-72 object-cover" />
    </div>

    <div class="grid grid-cols-3 gap-4 mb-10 text-center">
      <div class="bg-white/60 border border-ash/30 rounded-lg py-4">
        <p class="text-xs text-ash uppercase tracking-wide">Preparación</p>
        <p class="font-display text-lg">${receta.tiempoPrep}</p>
      </div>
      <div class="bg-white/60 border border-ash/30 rounded-lg py-4">
        <p class="text-xs text-ash uppercase tracking-wide">Cocción</p>
        <p class="font-display text-lg">${receta.tiempoCoccion}</p>
      </div>
      <div class="bg-white/60 border border-ash/30 rounded-lg py-4">
        <p class="text-xs text-ash uppercase tracking-wide">Porciones</p>
        <p class="font-display text-lg">${receta.porciones}</p>
      </div>
    </div>

    <div class="grid md:grid-cols-3 gap-10 mb-4">
      <section class="md:col-span-1">
        <div class="flex items-center justify-between mb-4">
          <h2 class="font-display text-2xl text-ember">Ingredientes</h2>
          <span id="contador-ingredientes" class="text-xs text-ash"></span>
        </div>
        <ul class="space-y-3 text-smoke/90">${ingredientesHtml}</ul>
      </section>
      <section class="md:col-span-2">
        <div class="flex items-center justify-between mb-4">
          <h2 class="font-display text-2xl text-ember">Preparación</h2>
          <span id="contador-pasos" class="text-xs text-ash"></span>
        </div>
        <ol class="space-y-4 text-smoke/90">${pasosHtml}</ol>
      </section>
    </div>

    <div class="mb-14">
      <button id="btn-reiniciar-progreso" class="text-sm text-ash hover:text-ember transition underline">
        Reiniciar checklist
      </button>
    </div>

    <section id="modulo-maridaje" class="border-t border-ash/30 pt-10">
      <p class="text-ember font-semibold tracking-widest text-xs uppercase mb-2">Maridaje sugerido</p>
      <h2 class="font-display text-3xl mb-6">Cómo acompañar esta receta</h2>
      <div class="grid sm:grid-cols-2 gap-8">
        <div>
          <h3 class="font-display text-lg mb-3">Salsas y acompañamientos</h3>
          <div id="maridaje-salsas" class="grid gap-3"></div>
        </div>
        <div>
          <h3 class="font-display text-lg mb-3">Bebidas del Bar</h3>
          <div id="maridaje-bebidas" class="grid gap-3"></div>
        </div>
      </div>
    </section>
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

function renderMaridaje(receta) {
  const contSalsas = document.getElementById("maridaje-salsas");
  const contBebidas = document.getElementById("maridaje-bebidas");

  const salsas = (receta.maridajeSalsas || [])
    .map((slug) => DataManager.getCatalogoBySlug(slug))
    .filter(Boolean);

  const bebidas = (receta.maridajeBebidas || [])
    .map((slug) => DataManager.getBarBySlug(slug))
    .filter(Boolean);

  contSalsas.innerHTML = salsas.length
    ? salsas.map((item) => tarjetaMaridaje(item, "catalogo")).join("")
    : `<p class="text-sm text-ash">Sin sugerencias registradas para esta receta.</p>`;

  contBebidas.innerHTML = bebidas.length
    ? bebidas.map((item) => tarjetaMaridaje(item, "bar")).join("")
    : `<p class="text-sm text-ash">Sin sugerencias registradas para esta receta.</p>`;

  document.querySelectorAll(".btn-maridaje").forEach((btn) => {
    btn.addEventListener("click", () => abrirModalMaridaje(btn.dataset.slug, btn.dataset.origen));
  });
}

function tarjetaMaridaje(item, origen) {
  return `
    <button type="button" data-slug="${item.slug}" data-origen="${origen}"
       class="btn-maridaje w-full text-left flex gap-3 items-center bg-white/60 border border-ash/30 rounded-lg p-3 hover:border-ember transition">
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
  coctel: "Coctel",
  vino: "Vino",
  cerveza: "Cerveza",
  "sin-alcohol": "Sin alcohol"
};

/* ---- Modal de preparación (reutilizado para salsas, acompañamientos y bebidas) ---- */
function abrirModalMaridaje(slug, origen) {
  const item = origen === "bar" ? DataManager.getBarBySlug(slug) : DataManager.getCatalogoBySlug(slug);
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
