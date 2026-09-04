/* ============================================================
   js/recetario.js
   Lógica del Paso 1 (equipo) y Paso 2 (carne) del recetario.
   Filtra dinámicamente RECETAS_BASE + recetas de localStorage
   y pinta las tarjetas resultantes.
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {
  const grid = document.getElementById("grid-recetas");
  const sinResultados = document.getElementById("sin-resultados");
  const contador = document.getElementById("contador-resultados");

  const estado = {
    equipo: "",
    carne: ""
  };

  /* Lee filtros iniciales desde la URL, si vienen (ej. desde index.html) */
  const params = new URLSearchParams(window.location.search);
  if (params.get("equipo")) estado.equipo = params.get("equipo");
  if (params.get("carne")) estado.carne = params.get("carne");

  function activarChip(tipo, valor) {
    document.querySelectorAll(`[data-tipo="${tipo}"]`).forEach((btn) => {
      btn.classList.toggle("chip-activo", btn.dataset.value === valor);
    });
  }

  function renderTarjetas() {
    const recetas = DataManager.getRecetas().filter((r) => {
      const coincideEquipo = !estado.equipo || r.equipo === estado.equipo;
      const coincideCarne = !estado.carne || r.carne === estado.carne;
      return coincideEquipo && coincideCarne;
    });

    grid.innerHTML = "";
    contador.textContent = `${recetas.length} receta${recetas.length === 1 ? "" : "s"} encontrada${recetas.length === 1 ? "" : "s"}`;

    if (recetas.length === 0) {
      sinResultados.classList.remove("hidden");
      return;
    }
    sinResultados.classList.add("hidden");

    recetas.forEach((r) => {
      const card = document.createElement("a");
      card.href = `receta.html?slug=${r.slug}`;
      card.className = "group block bg-white/70 border border-ash/30 rounded-xl overflow-hidden hover:shadow-lg hover:-translate-y-1 transition";
      card.innerHTML = `
        <div class="h-44 overflow-hidden">
          <img src="${r.imagen}" alt="${r.titulo}" class="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
        </div>
        <div class="p-5">
          <div class="flex gap-2 mb-2">
            <span class="text-[11px] uppercase tracking-wide bg-charcoal text-parchment px-2 py-1 rounded-full">${DataManager.LABELS_EQUIPO[r.equipo] || r.equipo}</span>
            <span class="text-[11px] uppercase tracking-wide bg-ember/10 text-ember px-2 py-1 rounded-full">${DataManager.LABELS_CARNE[r.carne] || r.carne}</span>
          </div>
          <h3 class="font-display text-lg mb-1 group-hover:text-ember transition">${r.titulo}</h3>
          <p class="text-sm text-smoke/70 line-clamp-2">${r.descripcion}</p>
          <p class="text-xs text-ash mt-3">⏱ ${r.tiempoCoccion} de cocción · ${r.porciones} porciones</p>
        </div>
      `;
      grid.appendChild(card);
    });
  }

  document.getElementById("filtro-equipo").addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;
    estado.equipo = btn.dataset.value;
    activarChip("equipo", estado.equipo);
    renderTarjetas();
  });

  document.getElementById("filtro-carne").addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;
    estado.carne = btn.dataset.value;
    activarChip("carne", estado.carne);
    renderTarjetas();
  });

  activarChip("equipo", estado.equipo);
  activarChip("carne", estado.carne);
  renderTarjetas();
});
