import React from 'react';

/*
  Ficha de receta estilo pergamino.
  Guardar como src/RecipeScroll.jsx

  Uso en src/main.jsx (dentro de RecipeDetail, sustituye todo el <main>…</main>):

    import RecipeScroll from './RecipeScroll.jsx';
    ...
    return <Shell><RecipeScroll recipe={recipe} related={{ salsas, ensaladas, bebidas }}
             checks={checks} toggle={toggle} /><PreparationModal item={modal} onClose={()=>setModal(null)}/>
             <RecipeRelatedEvents onSelect={setModal}/></Shell>

  con, antes del return:
    const salsas = pair(recipe.maridajeSalsas, catalog);
    const ensaladas = pair(recipe.maridajeEnsaladas, catalog);
    const bebidas = pair(recipe.maridajeBebidas, drinks);

  Los pasos pueden ser texto o { texto, imagen } (la imagen por paso es opcional).
*/

const DM = () => window.DataManager;
const openPrep = (item) => window.dispatchEvent(new CustomEvent('show-prep', { detail: item }));

function ServeWith({ title, items }) {
  if (!items.length) return null;
  return (
    <div className="mb-5 last:mb-0">
      <h3>{title}</h3>
      {items.map((item) => (
        <button type="button" key={item.slug} className="scroll-item" onClick={() => openPrep(item)}>
          <img src={item.imagen} alt="" loading="lazy" />
          <span>{item.nombre}</span>
        </button>
      ))}
    </div>
  );
}

export default function RecipeScroll({ recipe, related, checks, toggle }) {
  const { salsas = [], ensaladas = [], bebidas = [] } = related || {};
  const hasPairing = salsas.length + ensaladas.length + bebidas.length > 0;

  return (
    <main className="mx-auto max-w-5xl px-5 py-10">
      {/* Portada: la imagen es lo primero que se ve */}
      <header className="relative mb-10 overflow-hidden rounded-sm border border-ember/30">
        <img src={recipe.imagen} alt={recipe.titulo} className="h-80 w-full object-cover sm:h-[28rem]" />
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal via-charcoal/60 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-6 sm:p-10">
          <p className="text-sm text-gold">
            {DM().LABELS_CARNE[recipe.carne]} en {DM().LABELS_EQUIPO[recipe.equipo]}
          </p>
          <h1 className="mt-2 font-display text-3xl leading-tight sm:text-5xl">{recipe.titulo}</h1>
        </div>
      </header>

      <div className="scroll-wrap mb-10">
        <article className="scroll">
          <p className="mx-auto mb-2 max-w-2xl text-center text-lg italic">{recipe.descripcion}</p>
          <p className="mb-6 text-center text-sm text-[color:var(--ink-soft)]">
            Preparación {recipe.tiempoPrep} · Cocción {recipe.tiempoCoccion} · {recipe.porciones} porciones
          </p>
          <hr className="rule" />

          <div className="grid gap-10 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
            <section>
              <h2>Ingredientes</h2>
              <ul className="space-y-2">
                {(recipe.ingredientes || []).map((x, i) => (
                  <li key={i}>
                    <label className="flex cursor-pointer gap-3">
                      <input type="checkbox" checked={!!checks[`i${i}`]} onChange={() => toggle(`i${i}`)} />
                      <span className={checks[`i${i}`] ? 'done' : ''}>{x}</span>
                    </label>
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h2>Preparación</h2>
              <ol className="space-y-6">
                {(recipe.pasos || []).map((p, i) => {
                  const texto = typeof p === 'string' ? p : p.texto;
                  const imagen = typeof p === 'string' ? null : p.imagen;
                  const done = !!checks[`p${i}`];
                  return (
                    <li key={i} className={done ? 'step-done' : ''}>
                      <label className="flex cursor-pointer items-start gap-4">
                        <input type="checkbox" className="sr-only" checked={done} onChange={() => toggle(`p${i}`)} />
                        <span className="step-badge mt-1"><span>{done ? '✓' : i + 1}</span></span>
                        <span className={done ? 'done' : ''}>{texto}</span>
                      </label>
                      {imagen && (
                        <img src={imagen} alt="" loading="lazy"
                          className="mt-3 h-44 w-full rounded-sm border border-[#6b4a22] object-cover" />
                      )}
                    </li>
                  );
                })}
              </ol>
            </section>
          </div>
        </article>
      </div>

      {hasPairing && (
        <div className="scroll-wrap md:ml-auto md:max-w-md">
          <aside className="scroll">
            <h2>Sirve con</h2>
            <hr className="rule" />
            <ServeWith title="Salsas y acompañamientos" items={salsas} />
            <ServeWith title="Ensaladas" items={ensaladas} />
            <ServeWith title="Bebidas" items={bebidas} />
          </aside>
        </div>
      )}
    </main>
  );
}
