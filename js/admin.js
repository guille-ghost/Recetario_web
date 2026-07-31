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
  const editandoSlugInput = document.getElementById("receta-editando-slug");
  const avisoEditando = document.getElementById("aviso-editando-receta");
  const avisoEditandoNombre = document.getElementById("aviso-editando-receta-nombre");
  const btnGuardarReceta = document.getElementById("btn-guardar-receta");
  const btnCancelarEdicionReceta = document.getElementById("btn-cancelar-edicion-receta");

  function llenarMultiselectsMaridaje(seleccionadosSalsas = [], seleccionadosBebidas = []) {
    selectSalsas.innerHTML = "";
    selectBebidas.innerHTML = "";

    DataManager.getCatalogo().forEach((item) => {
      const opt = document.createElement("option");
      opt.value = item.slug;
      opt.textContent = item.nombre;
      opt.selected = seleccionadosSalsas.includes(item.slug);
      selectSalsas.appendChild(opt);
    });

    DataManager.getBar().forEach((item) => {
      const opt = document.createElement("option");
      opt.value = item.slug;
      opt.textContent = item.nombre;
      opt.selected = seleccionadosBebidas.includes(item.slug);
      selectBebidas.appendChild(opt);
    });
  }

  tituloInput.addEventListener("input", () => {
    // Si se está editando, el slug queda fijo para no romper enlaces existentes
    if (editandoSlugInput.value) return;
    const slug = DataManager.generarSlug(tituloInput.value || "");
    slugPreview.textContent = slug ? `receta.html?slug=${slug}` : "";
  });

  function entrarModoEdicionReceta(receta) {
    editandoSlugInput.value = receta.slug;
    tituloInput.value = receta.titulo;
    document.getElementById("equipo").value = receta.equipo;
    document.getElementById("carne").value = receta.carne;
    document.getElementById("tiempoPrep").value = receta.tiempoPrep;
    document.getElementById("tiempoCoccion").value = receta.tiempoCoccion;
    document.getElementById("porciones").value = receta.porciones;
    document.getElementById("imagen").value = receta.imagen || "";
    document.getElementById("descripcion").value = receta.descripcion;
    document.getElementById("ingredientes").value = (receta.ingredientes || []).join("\n");
    document.getElementById("pasos").value = (receta.pasos || []).join("\n");

    llenarMultiselectsMaridaje(receta.maridajeSalsas || [], receta.maridajeBebidas || []);

    slugPreview.textContent = `receta.html?slug=${receta.slug} (fijo mientras editas)`;
    avisoEditandoNombre.textContent = receta.titulo;
    avisoEditando.classList.remove("hidden");
    btnGuardarReceta.textContent = "Actualizar receta";
    btnCancelarEdicionReceta.classList.remove("hidden");

    document.querySelector('[data-tab="recetas"]').click();
    formReceta.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function salirModoEdicionReceta() {
    editandoSlugInput.value = "";
    formReceta.reset();
    slugPreview.textContent = "";
    avisoEditando.classList.add("hidden");
    btnGuardarReceta.textContent = "Guardar receta";
    btnCancelarEdicionReceta.classList.add("hidden");
    llenarMultiselectsMaridaje();
  }

  btnCancelarEdicionReceta.addEventListener("click", salirModoEdicionReceta);

  formReceta.addEventListener("submit", (e) => {
    e.preventDefault();

    const titulo = tituloInput.value.trim();
    const editandoSlug = editandoSlugInput.value;
    const slug = editandoSlug || DataManager.generarSlug(titulo);

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
    mostrarMensaje(
      editandoSlug
        ? `Receta "${receta.titulo}" actualizada correctamente.`
        : `Receta "${receta.titulo}" guardada correctamente. Ya está visible en el recetario.`,
      false
    );
    salirModoEdicionReceta();
    renderGuardadas();
  });

  function renderGuardadas() {
    const todas = DataManager.getRecetas();
    listaGuardadas.innerHTML = "";

    if (todas.length === 0) {
      listaGuardadas.innerHTML = `<p class="text-sm text-ash">No hay recetas todavía.</p>`;
      return;
    }

    todas.forEach((r) => {
      const esBase = DataManager.esRecetaBase(r.slug);
      const fueEditada = esBase && DataManager.getRecetasUsuario().some((u) => u.slug === r.slug);
      const fila = document.createElement("div");
      fila.className = "flex items-center justify-between bg-white/70 border border-ash/30 rounded-lg px-4 py-3";
      fila.innerHTML = `
        <div>
          <p class="font-medium flex items-center gap-2">
            ${r.titulo}
            ${esBase && !fueEditada ? '<span class="text-[10px] uppercase tracking-wide bg-ash/20 text-ash px-2 py-0.5 rounded-full">De fábrica</span>' : ""}
            ${fueEditada ? '<span class="text-[10px] uppercase tracking-wide bg-gold/20 text-gold px-2 py-0.5 rounded-full">Editada</span>' : ""}
            ${!esBase ? '<span class="text-[10px] uppercase tracking-wide bg-ember/10 text-ember px-2 py-0.5 rounded-full">Personalizada</span>' : ""}
          </p>
          <p class="text-xs text-ash">${DataManager.LABELS_EQUIPO[r.equipo] || r.equipo} · ${DataManager.LABELS_CARNE[r.carne] || r.carne}</p>
        </div>
        <div class="flex gap-3 text-sm">
          <a href="receta.html?slug=${r.slug}" class="text-ash hover:text-ember transition">Ver</a>
          <button data-slug="${r.slug}" class="btn-editar-receta text-ember hover:underline">Editar</button>
          <button data-slug="${r.slug}" class="btn-eliminar-receta text-red-700 hover:underline">Eliminar</button>
        </div>
      `;
      listaGuardadas.appendChild(fila);
    });

    document.querySelectorAll(".btn-editar-receta").forEach((btn) => {
      btn.addEventListener("click", () => {
        const receta = DataManager.getRecetaBySlug(btn.dataset.slug);
        if (receta) entrarModoEdicionReceta(receta);
      });
    });

    document.querySelectorAll(".btn-eliminar-receta").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (confirm("¿Eliminar esta receta? Esta acción no se puede deshacer.")) {
          DataManager.eliminarReceta(btn.dataset.slug);
          if (editandoSlugInput.value === btn.dataset.slug) salirModoEdicionReceta();
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
  const catEditandoSlugInput = document.getElementById("catalogo-editando-slug");
  const avisoEditandoCat = document.getElementById("aviso-editando-catalogo");
  const avisoEditandoCatNombre = document.getElementById("aviso-editando-catalogo-nombre");
  const btnGuardarCatalogo = document.getElementById("btn-guardar-catalogo");
  const btnCancelarEdicionCatalogo = document.getElementById("btn-cancelar-edicion-catalogo");

  catNombreInput.addEventListener("input", () => {
    if (catEditandoSlugInput.value) return;
    catSlugPreview.textContent = DataManager.generarSlug(catNombreInput.value || "");
  });

  function entrarModoEdicionCatalogo(item) {
    catEditandoSlugInput.value = item.slug;
    catNombreInput.value = item.nombre;
    document.getElementById("cat-tipo").value = item.tipo;
    document.getElementById("cat-tiempoPrep").value = item.tiempoPrep || "";
    document.getElementById("cat-porciones").value = item.porciones || 1;
    document.getElementById("cat-imagen").value = item.imagen || "";
    document.getElementById("cat-descripcion").value = item.descripcion || "";
    document.getElementById("cat-ingredientes").value = (item.ingredientes || []).join("\n");
    document.getElementById("cat-pasos").value = (item.pasos || []).join("\n");

    catSlugPreview.textContent = `${item.slug} (fijo mientras editas)`;
    avisoEditandoCatNombre.textContent = item.nombre;
    avisoEditandoCat.classList.remove("hidden");
    btnGuardarCatalogo.textContent = "Actualizar";
    btnCancelarEdicionCatalogo.classList.remove("hidden");

    document.querySelector('[data-tab="catalogo"]').click();
    formCatalogo.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function salirModoEdicionCatalogo() {
    catEditandoSlugInput.value = "";
    formCatalogo.reset();
    catSlugPreview.textContent = "";
    avisoEditandoCat.classList.add("hidden");
    btnGuardarCatalogo.textContent = "Guardar en el catálogo";
    btnCancelarEdicionCatalogo.classList.add("hidden");
  }

  btnCancelarEdicionCatalogo.addEventListener("click", salirModoEdicionCatalogo);

  formCatalogo.addEventListener("submit", (e) => {
    e.preventDefault();

    const nombre = catNombreInput.value.trim();
    const editandoSlug = catEditandoSlugInput.value;
    const slug = editandoSlug || DataManager.generarSlug(nombre);

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
    mostrarMensaje(
      editandoSlug
        ? `"${item.nombre}" actualizado correctamente.`
        : `"${item.nombre}" guardado en el catálogo. Ya está disponible para maridaje en las recetas.`,
      false
    );
    salirModoEdicionCatalogo();
    renderCatalogoGuardados();
    llenarMultiselectsMaridaje(); // refresca el selector de maridaje de recetas
  });

  function renderCatalogoGuardados() {
    const todos = DataManager.getCatalogo();
    listaCatalogoGuardados.innerHTML = "";

    if (todos.length === 0) {
      listaCatalogoGuardados.innerHTML = `<p class="text-sm text-ash">No hay salsas ni acompañamientos todavía.</p>`;
      return;
    }

    todos.forEach((i) => {
      const esBase = DataManager.esCatalogoBase(i.slug);
      const fueEditada = esBase && DataManager.getCatalogoUsuario().some((u) => u.slug === i.slug);
      const fila = document.createElement("div");
      fila.className = "flex items-center justify-between bg-white/70 border border-ash/30 rounded-lg px-4 py-3";
      fila.innerHTML = `
        <div>
          <p class="font-medium flex items-center gap-2">
            ${i.nombre}
            ${esBase && !fueEditada ? '<span class="text-[10px] uppercase tracking-wide bg-ash/20 text-ash px-2 py-0.5 rounded-full">De fábrica</span>' : ""}
            ${fueEditada ? '<span class="text-[10px] uppercase tracking-wide bg-gold/20 text-gold px-2 py-0.5 rounded-full">Editada</span>' : ""}
            ${!esBase ? '<span class="text-[10px] uppercase tracking-wide bg-ember/10 text-ember px-2 py-0.5 rounded-full">Personalizada</span>' : ""}
          </p>
          <p class="text-xs text-ash">${DataManager.LABELS_TIPO_CATALOGO[i.tipo] || i.tipo}</p>
        </div>
        <div class="flex gap-3 text-sm">
          <a href="catalogo.html" class="text-ash hover:text-ember transition">Ver</a>
          <button data-slug="${i.slug}" class="btn-editar-catalogo text-ember hover:underline">Editar</button>
          <button data-slug="${i.slug}" class="btn-eliminar-catalogo text-red-700 hover:underline">Eliminar</button>
        </div>
      `;
      listaCatalogoGuardados.appendChild(fila);
    });

    document.querySelectorAll(".btn-editar-catalogo").forEach((btn) => {
      btn.addEventListener("click", () => {
        const item = DataManager.getCatalogoBySlug(btn.dataset.slug);
        if (item) entrarModoEdicionCatalogo(item);
      });
    });

    document.querySelectorAll(".btn-eliminar-catalogo").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (confirm("¿Eliminar este ítem del catálogo? Esta acción no se puede deshacer.")) {
          DataManager.eliminarCatalogoItem(btn.dataset.slug);
          if (catEditandoSlugInput.value === btn.dataset.slug) salirModoEdicionCatalogo();
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
  const barEditandoSlugInput = document.getElementById("bar-editando-slug");
  const avisoEditandoBar = document.getElementById("aviso-editando-bar");
  const avisoEditandoBarNombre = document.getElementById("aviso-editando-bar-nombre");
  const btnGuardarBar = document.getElementById("btn-guardar-bar");
  const btnCancelarEdicionBar = document.getElementById("btn-cancelar-edicion-bar");

  barNombreInput.addEventListener("input", () => {
    if (barEditandoSlugInput.value) return;
    barSlugPreview.textContent = DataManager.generarSlug(barNombreInput.value || "");
  });

  function entrarModoEdicionBar(item) {
    barEditandoSlugInput.value = item.slug;
    barNombreInput.value = item.nombre;
    document.getElementById("bar-tipo").value = item.tipo;
    document.getElementById("bar-tiempoPrep").value = item.tiempoPrep || "";
    document.getElementById("bar-porciones").value = item.porciones || 1;
    document.getElementById("bar-imagen").value = item.imagen || "";
    document.getElementById("bar-descripcion").value = item.descripcion || "";
    document.getElementById("bar-ingredientes").value = (item.ingredientes || []).join("\n");
    document.getElementById("bar-pasos").value = (item.pasos || []).join("\n");

    barSlugPreview.textContent = `${item.slug} (fijo mientras editas)`;
    avisoEditandoBarNombre.textContent = item.nombre;
    avisoEditandoBar.classList.remove("hidden");
    btnGuardarBar.textContent = "Actualizar";
    btnCancelarEdicionBar.classList.remove("hidden");

    document.querySelector('[data-tab="bar"]').click();
    formBar.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function salirModoEdicionBar() {
    barEditandoSlugInput.value = "";
    formBar.reset();
    barSlugPreview.textContent = "";
    avisoEditandoBar.classList.add("hidden");
    btnGuardarBar.textContent = "Guardar en el Bar";
    btnCancelarEdicionBar.classList.add("hidden");
  }

  btnCancelarEdicionBar.addEventListener("click", salirModoEdicionBar);

  formBar.addEventListener("submit", (e) => {
    e.preventDefault();

    const nombre = barNombreInput.value.trim();
    const editandoSlug = barEditandoSlugInput.value;
    const slug = editandoSlug || DataManager.generarSlug(nombre);

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
    mostrarMensaje(
      editandoSlug
        ? `"${item.nombre}" actualizado correctamente.`
        : `"${item.nombre}" guardado en el Bar. Ya está disponible para maridaje en las recetas.`,
      false
    );
    salirModoEdicionBar();
    renderBarGuardados();
    llenarMultiselectsMaridaje(); // refresca el selector de maridaje de recetas
  });

  function renderBarGuardados() {
    const todos = DataManager.getBar();
    listaBarGuardados.innerHTML = "";

    if (todos.length === 0) {
      listaBarGuardados.innerHTML = `<p class="text-sm text-ash">No hay bebidas todavía.</p>`;
      return;
    }

    todos.forEach((i) => {
      const esBase = DataManager.esBarBase(i.slug);
      const fueEditada = esBase && DataManager.getBarUsuario().some((u) => u.slug === i.slug);
      const fila = document.createElement("div");
      fila.className = "flex items-center justify-between bg-white/70 border border-ash/30 rounded-lg px-4 py-3";
      fila.innerHTML = `
        <div>
          <p class="font-medium flex items-center gap-2">
            ${i.nombre}
            ${esBase && !fueEditada ? '<span class="text-[10px] uppercase tracking-wide bg-ash/20 text-ash px-2 py-0.5 rounded-full">De fábrica</span>' : ""}
            ${fueEditada ? '<span class="text-[10px] uppercase tracking-wide bg-gold/20 text-gold px-2 py-0.5 rounded-full">Editada</span>' : ""}
            ${!esBase ? '<span class="text-[10px] uppercase tracking-wide bg-ember/10 text-ember px-2 py-0.5 rounded-full">Personalizada</span>' : ""}
          </p>
          <p class="text-xs text-ash">${DataManager.LABELS_TIPO_BAR[i.tipo] || i.tipo}</p>
        </div>
        <div class="flex gap-3 text-sm">
          <a href="bar.html" class="text-ash hover:text-ember transition">Ver</a>
          <button data-slug="${i.slug}" class="btn-editar-bar text-ember hover:underline">Editar</button>
          <button data-slug="${i.slug}" class="btn-eliminar-bar text-red-700 hover:underline">Eliminar</button>
        </div>
      `;
      listaBarGuardados.appendChild(fila);
    });

    document.querySelectorAll(".btn-editar-bar").forEach((btn) => {
      btn.addEventListener("click", () => {
        const item = DataManager.getBarBySlug(btn.dataset.slug);
        if (item) entrarModoEdicionBar(item);
      });
    });

    document.querySelectorAll(".btn-eliminar-bar").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (confirm("¿Eliminar esta bebida? Esta acción no se puede deshacer.")) {
          DataManager.eliminarBarItem(btn.dataset.slug);
          if (barEditandoSlugInput.value === btn.dataset.slug) salirModoEdicionBar();
          renderBarGuardados();
          llenarMultiselectsMaridaje();
        }
      });
    });
  }

  /* ============================================================
     RESPALDO: EXPORTAR / IMPORTAR / GENERAR CÓDIGO PARA data.js
     ============================================================ */
  const btnExportar = document.getElementById("btn-exportar");
  const btnImportar = document.getElementById("btn-importar");
  const inputImportar = document.getElementById("input-importar");
  const btnGenerarCodigo = document.getElementById("btn-generar-codigo");

  function refrescarTodo() {
    llenarMultiselectsMaridaje();
    renderGuardadas();
    renderCatalogoGuardados();
    renderBarGuardados();
  }

  /* ---- Exportar: descarga un .json con todo lo agregado/editado/eliminado ---- */
  btnExportar.addEventListener("click", () => {
    const respaldo = {
      version: 1,
      fecha: new Date().toISOString(),
      recetas: DataManager.getRecetasUsuario(),
      recetasOcultas: DataManager.getRecetasOcultas(),
      catalogo: DataManager.getCatalogoUsuario(),
      catalogoOcultas: DataManager.getCatalogoOcultas(),
      bar: DataManager.getBarUsuario(),
      barOcultas: DataManager.getBarOcultas()
    };

    const blob = new Blob([JSON.stringify(respaldo, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `respaldo-fuego-real-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);

    mostrarMensaje("Respaldo exportado. Guarda el archivo .json en un lugar seguro.", false);
  });

  /* ---- Importar: reemplaza el contenido local con el del archivo .json ---- */
  btnImportar.addEventListener("click", () => inputImportar.click());

  inputImportar.addEventListener("change", () => {
    const archivo = inputImportar.files[0];
    if (!archivo) return;

    const lector = new FileReader();
    lector.onload = () => {
      try {
        const datos = JSON.parse(lector.result);

        if (!confirm("Importar reemplazará las recetas, salsas y bebidas guardadas en este navegador por las del archivo. ¿Continuar?")) {
          inputImportar.value = "";
          return;
        }

        localStorage.setItem(LS_KEY_RECETAS, JSON.stringify(datos.recetas || []));
        localStorage.setItem(LS_KEY_RECETAS_OCULTAS, JSON.stringify(datos.recetasOcultas || []));
        localStorage.setItem(LS_KEY_CATALOGO, JSON.stringify(datos.catalogo || []));
        localStorage.setItem(LS_KEY_CATALOGO_OCULTAS, JSON.stringify(datos.catalogoOcultas || []));
        localStorage.setItem(LS_KEY_BAR, JSON.stringify(datos.bar || []));
        localStorage.setItem(LS_KEY_BAR_OCULTAS, JSON.stringify(datos.barOcultas || []));

        refrescarTodo();
        mostrarMensaje("Respaldo importado correctamente.", false);
      } catch (err) {
        mostrarMensaje("El archivo no es un respaldo válido (JSON incorrecto).", true);
      }
      inputImportar.value = "";
    };
    lector.readAsText(archivo);
  });

  /* ---- Generar código listo para pegar en js/data.js ---- */
  const modalCodigo = document.getElementById("modal-codigo");
  const codigoGenerado = document.getElementById("codigo-generado");
  const btnCopiarCodigo = document.getElementById("btn-copiar-codigo");
  const copiadoConfirmacion = document.getElementById("copiado-confirmacion");

  function generarCodigoDataJs() {
    const recetas = DataManager.getRecetasUsuario();
    const catalogo = DataManager.getCatalogoUsuario();
    const bar = DataManager.getBarUsuario();
    const bloques = [];

    if (recetas.length) {
      bloques.push(
        `/* Pega estos objetos DENTRO del arreglo RECETAS_BASE, en js/data.js */\n` +
        recetas.map((r) => JSON.stringify(r, null, 2)).join(",\n") + ","
      );
    }
    if (catalogo.length) {
      bloques.push(
        `/* Pega estos objetos DENTRO del arreglo CATALOGO_SALSAS, en js/data.js */\n` +
        catalogo.map((c) => JSON.stringify(c, null, 2)).join(",\n") + ","
      );
    }
    if (bar.length) {
      bloques.push(
        `/* Pega estos objetos DENTRO del arreglo BAR_BEBIDAS, en js/data.js */\n` +
        bar.map((b) => JSON.stringify(b, null, 2)).join(",\n") + ","
      );
    }

    return bloques.length
      ? bloques.join("\n\n")
      : "// Todavía no has agregado ni editado nada desde este navegador.";
  }

  btnGenerarCodigo.addEventListener("click", () => {
    codigoGenerado.value = generarCodigoDataJs();
    copiadoConfirmacion.classList.add("hidden");
    modalCodigo.classList.remove("hidden");
    document.body.classList.add("overflow-hidden");
  });

  function cerrarModalCodigo() {
    modalCodigo.classList.add("hidden");
    document.body.classList.remove("overflow-hidden");
  }

  document.getElementById("modal-codigo-cerrar").addEventListener("click", cerrarModalCodigo);
  document.getElementById("modal-codigo-overlay").addEventListener("click", cerrarModalCodigo);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") cerrarModalCodigo();
  });

  btnCopiarCodigo.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(codigoGenerado.value);
    } catch (err) {
      codigoGenerado.select();
      document.execCommand("copy");
    }
    copiadoConfirmacion.classList.remove("hidden");
  });

  /* ---- Inicialización ---- */
  llenarMultiselectsMaridaje();
  renderGuardadas();
  renderCatalogoGuardados();
  renderBarGuardados();
});
