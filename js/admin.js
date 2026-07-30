/* ============================================================
   js/admin.js
   Lógica del panel de administración (admin.html):
   - Manejo de pestañas (Recetas / Catálogo / Bar)
   - Formulario de Recetas: llena multiselects de maridaje,
     genera slug en vivo, guarda en localStorage
   - Formulario de Catálogo (salsas/acompañamientos): genera
     slug, guarda en localStorage
   - Formulario de Bar (bebidas): genera slug, guarda en
     localStorage
   - Listados con opción de eliminar para los tres tipos
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {
  /* ----------------------------------------------------------
     PESTAÑAS
     ---------------------------------------------------------- */
  const tabBtns = document.querySelectorAll(".tab-btn");
  const tabPanels = {
    recetas: document.getElementById("tab-recetas"),
    catalogo: document.getElementById("tab-catalogo"),
    bar: document.getElementById("tab-bar")
  };

  tabBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      tabBtns.forEach((b) => b.classList.toggle("tab-activo", b === btn));
      Object.entries(tabPanels).forEach(([key, panel]) => {
        panel.classList.toggle("hidden", key !== btn.dataset.tab);
      });
      ocultarMensaje();
    });
  });

  /* ----------------------------------------------------------
     MENSAJE DE CONFIRMACIÓN (compartido por las 3 pestañas)
     ---------------------------------------------------------- */
  const mensajeExito = document.getElementById("mensaje-exito");

  function mostrarMensaje(texto, esError) {
    mensajeExito.textContent = texto;
    mensajeExito.classList.remove("hidden");
    mensajeExito.classList.toggle("border-green-600", !esError);
    mensajeExito.classList.toggle("bg-green-50", !esError);
    mensajeExito.classList.toggle("text-green-800", !esError);
    mensajeExito.classList.toggle("border-red-600", esError);
    mensajeExito.classList.toggle("bg-red-50", esError);
    mensajeExito.classList.toggle("text-red-800", esError);
    mensajeExito.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function ocultarMensaje() {
    mensajeExito.classList.add("hidden");
  }

  /* ----------------------------------------------------------
     UTILIDADES COMPARTIDAS
     ---------------------------------------------------------- */
  function textareaALista(valor) {
    return (valor || "")
      .split("\n")
      .map((linea) => linea.trim())
      .filter((linea) => linea.length > 0);
  }

  function valoresSeleccionados(select) {
    return Array.from(select.selectedOptions).map((opt) => opt.value);
  }

  /* ============================================================
     PESTAÑA 1: RECETAS
     ============================================================ */
  const formReceta = document.getElementById("form-receta");
  const tituloInput = document.getElementById("titulo");
  const slugPreview = document.getElementById("slug-preview");
  const selectSalsas = document.getElementById("maridajeSalsas");
  const selectBebidas = document.getElementById("maridajeBebidas");
  const listaGuardadas = document.getElementById("lista-guardadas");

  function llenarMultiselectsMaridaje() {
    selectSalsas.innerHTML = "";
    selectBebidas.innerHTML = "";

    DataManager.getCatalogo().forEach((item) => {
      const opt = document.createElement("option");
      opt.value = item.slug;
      opt.textContent = item.nombre;
      selectSalsas.appendChild(opt);
    });

    DataManager.getBar().forEach((item) => {
      const opt = document.createElement("option");
      opt.value = item.slug;
      opt.textContent = item.nombre;
      selectBebidas.appendChild(opt);
    });
  }

  tituloInput.addEventListener("input", () => {
    const slug = DataManager.generarSlug(tituloInput.value || "");
    slugPreview.textContent = slug ? `receta.html?slug=${slug}` : "";
  });

  formReceta.addEventListener("submit", (e) => {
    e.preventDefault();

    const titulo = tituloInput.value.trim();
    const slug = DataManager.generarSlug(titulo);

    if (!slug) {
      mostrarMensaje("Por favor ingresa un título válido para la receta.", true);
      return;
    }

    const receta = {
      slug,
      titulo,
      equipo: document.getElementById("equipo").value,
      carne: document.getElementById("carne").value,
      tiempoPrep: document.getElementById("tiempoPrep").value.trim(),
      tiempoCoccion: document.getElementById("tiempoCoccion").value.trim(),
      porciones: Number(document.getElementById("porciones").value) || 1,
      imagen: document.getElementById("imagen").value.trim() ||
        "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=1200&auto=format&fit=crop",
      descripcion: document.getElementById("descripcion").value.trim(),
      ingredientes: textareaALista(document.getElementById("ingredientes").value),
      pasos: textareaALista(document.getElementById("pasos").value),
      maridajeSalsas: valoresSeleccionados(selectSalsas),
      maridajeBebidas: valoresSeleccionados(selectBebidas),
      fecha: new Date().toISOString().slice(0, 10)
    };

    DataManager.guardarReceta(receta);
    mostrarMensaje(`Receta "${receta.titulo}" guardada correctamente. Ya está visible en el recetario.`, false);
    formReceta.reset();
    slugPreview.textContent = "";
    renderGuardadas();
  });

  function renderGuardadas() {
    const guardadas = DataManager.getRecetasUsuario();
    listaGuardadas.innerHTML = "";

    if (guardadas.length === 0) {
      listaGuardadas.innerHTML = `<p class="text-sm text-ash">Aún no has guardado ninguna receta desde este navegador.</p>`;
      return;
    }

    guardadas.forEach((r) => {
      const fila = document.createElement("div");
      fila.className = "flex items-center justify-between bg-white/70 border border-ash/30 rounded-lg px-4 py-3";
      fila.innerHTML = `
        <div>
          <p class="font-medium">${r.titulo}</p>
          <p class="text-xs text-ash">${DataManager.LABELS_EQUIPO[r.equipo] || r.equipo} · ${DataManager.LABELS_CARNE[r.carne] || r.carne}</p>
        </div>
        <div class="flex gap-3 text-sm">
          <a href="receta.html?slug=${r.slug}" class="text-ember hover:underline">Ver</a>
          <button data-slug="${r.slug}" class="btn-eliminar-receta text-red-700 hover:underline">Eliminar</button>
        </div>
      `;
      listaGuardadas.appendChild(fila);
    });

    document.querySelectorAll(".btn-eliminar-receta").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (confirm("¿Eliminar esta receta guardada?")) {
          DataManager.eliminarReceta(btn.dataset.slug);
          renderGuardadas();
        }
      });
    });
  }

  /* ============================================================
     PESTAÑA 2: CATÁLOGO (SALSAS Y ACOMPAÑAMIENTOS)
     ============================================================ */
  const formCatalogo = document.getElementById("form-catalogo");
  const catNombreInput = document.getElementById("cat-nombre");
  const catSlugPreview = document.getElementById("cat-slug-preview");
  const listaCatalogoGuardados = document.getElementById("lista-catalogo-guardados");

  catNombreInput.addEventListener("input", () => {
    catSlugPreview.textContent = DataManager.generarSlug(catNombreInput.value || "");
  });

  formCatalogo.addEventListener("submit", (e) => {
    e.preventDefault();

    const nombre = catNombreInput.value.trim();
    const slug = DataManager.generarSlug(nombre);

    if (!slug) {
      mostrarMensaje("Por favor ingresa un nombre válido.", true);
      return;
    }

    const item = {
      slug,
      nombre,
      tipo: document.getElementById("cat-tipo").value,
      tiempoPrep: document.getElementById("cat-tiempoPrep").value.trim(),
      porciones: Number(document.getElementById("cat-porciones").value) || 1,
      imagen: document.getElementById("cat-imagen").value.trim() ||
        "https://images.unsplash.com/photo-1518013431117-eb1465fa5752?q=80&w=800&auto=format&fit=crop",
      descripcion: document.getElementById("cat-descripcion").value.trim(),
      ingredientes: textareaALista(document.getElementById("cat-ingredientes").value),
      pasos: textareaALista(document.getElementById("cat-pasos").value)
    };

    DataManager.guardarCatalogoItem(item);
    mostrarMensaje(`"${item.nombre}" guardado en el catálogo. Ya está disponible para maridaje en las recetas.`, false);
    formCatalogo.reset();
    catSlugPreview.textContent = "";
    renderCatalogoGuardados();
    llenarMultiselectsMaridaje(); // refresca el selector de maridaje de recetas
  });

  function renderCatalogoGuardados() {
    const guardados = DataManager.getCatalogoUsuario();
    listaCatalogoGuardados.innerHTML = "";

    if (guardados.length === 0) {
      listaCatalogoGuardados.innerHTML = `<p class="text-sm text-ash">Aún no has guardado ninguna salsa o acompañamiento desde este navegador.</p>`;
      return;
    }

    guardados.forEach((i) => {
      const fila = document.createElement("div");
      fila.className = "flex items-center justify-between bg-white/70 border border-ash/30 rounded-lg px-4 py-3";
      fila.innerHTML = `
        <div>
          <p class="font-medium">${i.nombre}</p>
          <p class="text-xs text-ash">${DataManager.LABELS_TIPO_CATALOGO[i.tipo] || i.tipo}</p>
        </div>
        <div class="flex gap-3 text-sm">
          <a href="catalogo.html" class="text-ember hover:underline">Ver catálogo</a>
          <button data-slug="${i.slug}" class="btn-eliminar-catalogo text-red-700 hover:underline">Eliminar</button>
        </div>
      `;
      listaCatalogoGuardados.appendChild(fila);
    });

    document.querySelectorAll(".btn-eliminar-catalogo").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (confirm("¿Eliminar este ítem del catálogo?")) {
          DataManager.eliminarCatalogoItem(btn.dataset.slug);
          renderCatalogoGuardados();
          llenarMultiselectsMaridaje();
        }
      });
    });
  }

  /* ============================================================
     PESTAÑA 3: BAR (BEBIDAS)
     ============================================================ */
  const formBar = document.getElementById("form-bar");
  const barNombreInput = document.getElementById("bar-nombre");
  const barSlugPreview = document.getElementById("bar-slug-preview");
  const listaBarGuardados = document.getElementById("lista-bar-guardados");

  barNombreInput.addEventListener("input", () => {
    barSlugPreview.textContent = DataManager.generarSlug(barNombreInput.value || "");
  });

  formBar.addEventListener("submit", (e) => {
    e.preventDefault();

    const nombre = barNombreInput.value.trim();
    const slug = DataManager.generarSlug(nombre);

    if (!slug) {
      mostrarMensaje("Por favor ingresa un nombre válido.", true);
      return;
    }

    const item = {
      slug,
      nombre,
      tipo: document.getElementById("bar-tipo").value,
      tiempoPrep: document.getElementById("bar-tiempoPrep").value.trim(),
      porciones: Number(document.getElementById("bar-porciones").value) || 1,
      imagen: document.getElementById("bar-imagen").value.trim() ||
        "https://images.unsplash.com/photo-1560508601-ea36bd0f1ce9?q=80&w=800&auto=format&fit=crop",
      descripcion: document.getElementById("bar-descripcion").value.trim(),
      ingredientes: textareaALista(document.getElementById("bar-ingredientes").value),
      pasos: textareaALista(document.getElementById("bar-pasos").value)
    };

    DataManager.guardarBarItem(item);
    mostrarMensaje(`"${item.nombre}" guardado en el Bar. Ya está disponible para maridaje en las recetas.`, false);
    formBar.reset();
    barSlugPreview.textContent = "";
    renderBarGuardados();
    llenarMultiselectsMaridaje(); // refresca el selector de maridaje de recetas
  });

  function renderBarGuardados() {
    const guardados = DataManager.getBarUsuario();
    listaBarGuardados.innerHTML = "";

    if (guardados.length === 0) {
      listaBarGuardados.innerHTML = `<p class="text-sm text-ash">Aún no has guardado ninguna bebida desde este navegador.</p>`;
      return;
    }

    guardados.forEach((i) => {
      const fila = document.createElement("div");
      fila.className = "flex items-center justify-between bg-white/70 border border-ash/30 rounded-lg px-4 py-3";
      fila.innerHTML = `
        <div>
          <p class="font-medium">${i.nombre}</p>
          <p class="text-xs text-ash">${DataManager.LABELS_TIPO_BAR[i.tipo] || i.tipo}</p>
        </div>
        <div class="flex gap-3 text-sm">
          <a href="bar.html" class="text-ember hover:underline">Ver Bar</a>
          <button data-slug="${i.slug}" class="btn-eliminar-bar text-red-700 hover:underline">Eliminar</button>
        </div>
      `;
      listaBarGuardados.appendChild(fila);
    });

    document.querySelectorAll(".btn-eliminar-bar").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (confirm("¿Eliminar esta bebida?")) {
          DataManager.eliminarBarItem(btn.dataset.slug);
          renderBarGuardados();
          llenarMultiselectsMaridaje();
        }
      });
    });
  }

  /* ---- Inicialización ---- */
  llenarMultiselectsMaridaje();
  renderGuardadas();
  renderCatalogoGuardados();
  renderBarGuardados();
});
