document.addEventListener("DOMContentLoaded", () => {
  const list=document.getElementById("imports-list"), message=document.getElementById("imports-message"), refresh=document.getElementById("imports-refresh"), form=document.getElementById("form-receta");
  if(!list || !message || !refresh || !form) return;
  let activeDraftId=null;
  const api=async(path,method="GET",body)=>{
    const response=await fetch(path,{method,credentials:"include",headers:body?{"Content-Type":"application/json"}:{},body:body?JSON.stringify(body):undefined});
    const data=await response.json(); if(!response.ok) throw new Error(data.details?.join(" · ")||data.error||"Error de comunicación."); return data;
  };
  function recipeFromForm(){
    const selected=id=>Array.from(document.getElementById(id).selectedOptions).map(option=>option.value);
    return {titulo:document.getElementById("titulo").value.trim(),equipo:document.getElementById("equipo").value,carne:document.getElementById("carne").value,tiempoPrep:document.getElementById("tiempoPrep").value.trim(),tiempoCoccion:document.getElementById("tiempoCoccion").value.trim(),porciones:Number(document.getElementById("porciones").value),imagen:document.getElementById("imagen").value.trim(),descripcion:document.getElementById("descripcion").value.trim(),ingredientes:document.getElementById("ingredientes").value.split("\n").map(x=>x.trim()).filter(Boolean),pasos:document.getElementById("pasos").value.split("\n").map(x=>x.trim()).filter(Boolean),maridajeSalsas:selected("maridajeSalsas"),maridajeEnsaladas:selected("maridajeEnsaladas"),maridajeBebidas:selected("maridajeBebidas")};
  }
  // Capture antes del listener normal del formulario: si se edita un borrador, nunca se guarda directo en recetas.
  form.addEventListener("submit",async event=>{
    if(!activeDraftId) return;
    event.preventDefault(); event.stopImmediatePropagation();
    const submit=form.querySelector('[type="submit"]'); submit.disabled=true;
    try {
      await api(`/api/importaciones/borradores/${encodeURIComponent(activeDraftId)}`,"PUT",{receta:recipeFromForm()});
      activeDraftId=null; document.getElementById("btn-cancelar-edicion-receta")?.click(); message.textContent="Correcciones guardadas como borrador. La receta sigue sin publicar."; message.className="text-sm mt-4 text-green-300";
      document.querySelector('[data-tab="importaciones"]')?.click(); await load();
    } catch(error){ message.textContent=error.message; message.className="text-sm mt-4 text-red-300"; }
    finally { submit.disabled=false; }
  },true);
  function makeButton(label,action,id,accent=false){const b=document.createElement("button");b.type="button";b.textContent=label;b.dataset.action=action;b.dataset.id=id;b.className=`${accent?"bg-gradient-to-r from-ember to-lava":"border border-ash/40"} rounded-lg px-4 py-2 text-sm hover:border-ember`;return b;}
  async function load(){
    message.textContent="Cargando borradores…";
    try {
      const drafts=await api("/api/importaciones/borradores"); list.replaceChildren(); message.textContent=`${drafts.length} borrador(es) pendientes de revisión.`;
      drafts.forEach(draft=>{
        const card=document.createElement("article");card.className="bg-smoke/80 border border-ash/20 rounded-xl p-5";
        const title=document.createElement("h3");title.className="font-semibold text-lg";title.textContent=draft.archivo?.nombre_archivo||draft.receta?.titulo||"Archivo sin nombre";
        const meta=document.createElement("p");meta.className="text-xs text-ash mt-1 mb-3";meta.textContent=`Estado: ${draft.estado} · ID Drive: ${draft.archivo?.drive_file_id||"—"} · ${draft.archivo?.detectado_en?new Date(draft.archivo.detectado_en).toLocaleString():""}`;
        card.append(title,meta);
        if(draft.error_validacion?.length){const errs=document.createElement("p");errs.className="text-sm text-gold mb-3";errs.textContent=`Revisar: ${draft.error_validacion.join(" · ")}`;card.append(errs);}
        const buttons=document.createElement("div");buttons.className="flex flex-wrap gap-2";buttons.append(makeButton("Editar con formulario de receta","edit",draft.id),makeButton("Publicar receta","publish",draft.id,true),makeButton("Descartar","discard",draft.id));
        card.append(buttons);list.append(card);
      });
    } catch(error){message.textContent=error.message;message.className="text-sm mt-4 text-red-300";}
  }
  refresh.addEventListener("click",load);
  document.getElementById("btn-cancelar-edicion-receta")?.addEventListener("click",()=>{activeDraftId=null;});
  list.addEventListener("click",async event=>{
    const button=event.target.closest("button[data-action]");if(!button)return;
    try {
      if(button.dataset.action==="edit"){
        const draft=(await api("/api/importaciones/borradores")).find(x=>x.id===button.dataset.id);if(!draft)throw new Error("El borrador ya no está pendiente.");
        activeDraftId=draft.id;window.dispatchEvent(new CustomEvent("recipe-draft-edit",{detail:draft.receta}));return;
      }
      if(button.dataset.action==="publish"){
        if(!window.confirm("¿Publicar esta receta en el recetario?"))return;
        await api(`/api/importaciones/borradores/${encodeURIComponent(button.dataset.id)}/publicar`,"POST",{});message.textContent="Receta publicada correctamente.";
      } else {
        if(!window.confirm("¿Descartar este borrador? Esta acción no publica la receta."))return;
        await api(`/api/importaciones/borradores/${encodeURIComponent(button.dataset.id)}`,"PUT",{action:"descartar"});message.textContent="Borrador descartado.";
      }
      await load();
    } catch(error){message.textContent=error.message;message.className="text-sm mt-4 text-red-300";}
  });
  document.querySelector('[data-tab="importaciones"]')?.addEventListener("click",load);
});
