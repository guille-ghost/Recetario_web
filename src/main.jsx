import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import Admin from './Admin.jsx';
import './style.css';

const DM = () => window.DataManager;
const CONTENT_CACHE_PREFIX = 'portal-content:';
const CONTENT_CACHE_TTL = 120_000;
function readContentCache(key){try{const cached=JSON.parse(sessionStorage.getItem(`${CONTENT_CACHE_PREFIX}${key}`)||'null');return cached&&Date.now()-cached.savedAt<CONTENT_CACHE_TTL&&Array.isArray(cached.items)?cached.items:null}catch{return null}}
function writeContentCache(key,items){try{sessionStorage.setItem(`${CONTENT_CACHE_PREFIX}${key}`,JSON.stringify({items,savedAt:Date.now()}))}catch{}}
const equipment = Object.entries({
  'caja-china': 'Caja China', cilindro: 'Cilindro', parrilla: 'Parrilla',
  'horno-barro': 'Horno de Barro', 'cocina-convencional': 'Cocina Convencional', airfryer: 'Airfryer',
});
const proteins = Object.entries({ res: 'Res', cerdo: 'Cerdo', pollo: 'Pollo', cordero: 'Cordero', pescado: 'Pescado' });

function Header({ active }) {
  return <header className="sticky top-0 z-30 border-b border-ember/30 bg-charcoal/90 backdrop-blur"><div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
    <a href="/" className="brand-fire font-display text-lg sm:text-2xl">El Festín de Belcebú</a>
    <nav className="flex gap-3 text-xs text-ash sm:gap-6 sm:text-sm">{[['Inicio','/'],['Recetario','/recetario'],['Salsas','/catalogo'],['Bar','/bar']].map(([label, href]) => <a className={active===href?'text-gold':'transition hover:text-gold'} href={href} key={href}>{label}</a>)}</nav>
  </div></header>;
}
function Footer(){ return <footer className="mt-16 border-t border-ash/20 py-8 text-center text-xs text-ash">El Festín de Belcebú · Recetas para cocinar al fuego</footer>; }
function Shell({ active, children }) { return <><Header active={active}/>{children}<Footer/></>; }
function Card({ item, type='recipe' }) {
  const title = item.titulo || item.nombre;
  const content = <><img src={item.imagen} alt={title} className="h-48 w-full object-cover transition duration-500 group-hover:scale-105"/><div className="p-5">
      <span className="rounded-full bg-ember/20 px-2 py-1 text-[11px] uppercase text-ember">{DM().LABELS_CARNE[item.carne] || DM().LABELS_TIPO_CATALOGO[item.tipo] || DM().LABELS_TIPO_BAR[item.tipo] || item.carne || item.tipo}</span>
      <h3 className="mt-3 font-display text-lg group-hover:text-ember">{title}</h3><p className="mt-2 line-clamp-3 text-sm text-ash">{item.descripcion}</p>
    </div></>;
  const openPreparation = () => window.dispatchEvent(new CustomEvent('show-prep', { detail: item }));

  if (type !== 'recipe') {
    return <button type="button" onClick={openPreparation} className="group block w-full overflow-hidden rounded-xl border border-ember/20 bg-smoke/90 text-left transition hover:-translate-y-1 hover:border-ember hover:shadow-lava-glow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember">
      {content}
      <span className="mx-5 mb-5 block text-sm text-ember">Ver preparación →</span>
    </button>;
  }

  return <article className="overflow-hidden rounded-xl border border-ember/20 bg-smoke/90 transition hover:-translate-y-1 hover:border-ember hover:shadow-lava-glow">
    <a href={`/receta?slug=${encodeURIComponent(item.slug)}`} className="group block">{content}</a>
  </article>;
}
function useLoad(loader,cacheKey) {
  const [state, setState] = useState(() => {const items=readContentCache(cacheKey);return {items:items||[],loading:!items,error:''}});
  useEffect(() => { let mounted=true; loader().then(items=>{writeContentCache(cacheKey,items);if(mounted)setState({items,loading:false,error:''})}).catch(error=>mounted&&setState(current=>({...current,loading:false,error:'No fue posible cargar el contenido. Revisa la conexión con Supabase.'}))); return ()=>{mounted=false}; }, []);
  return state;
}
function Home(){
  const {items,loading,error}=useLoad(()=>DM().getRecetas(),'recipes');
  useEffect(()=>{const script=document.createElement('script');script.src='/js/brasas.js';document.body.appendChild(script);return()=>script.remove()},[]);
  return <Shell active="/"><section id="hero" className="relative overflow-hidden"><canvas id="canvas-brasas" aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full"/><div className="relative mx-auto grid max-w-6xl items-center gap-10 px-5 py-20 md:grid-cols-2">
    <div><p className="mb-4 text-xs font-semibold uppercase tracking-widest text-gold">Caja China · Cilindro · Parrilla · Horno de Barro</p><h1 className="mb-6 font-display text-4xl leading-tight sm:text-6xl">El fuego cuenta<br/>su propia receta.</h1><p className="mb-8 max-w-md text-lg text-ash">Un recetario al fuego: elige tu equipo, tu carne y encuentra la técnica para tu plato ideal.</p><a href="/recetario" className="rounded-lg bg-gradient-to-r from-ember to-lava px-6 py-3 font-semibold">Explorar recetario</a></div>
    <img className="h-80 w-full rounded-2xl object-cover shadow-lava-glow" src="https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=1200&auto=format&fit=crop" alt="Asado a la parrilla"/>
  </div></section><section className="mx-auto max-w-6xl px-5 py-12"><h2 className="mb-2 font-display text-3xl">Empieza por tu equipo</h2><p className="mb-7 text-ash">Cada técnica tiene sus propios tiempos y secretos.</p><div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">{equipment.map(([value,label])=><a key={value} href={`/recetario?equipo=${value}`} className="rounded-xl border border-ember/20 bg-smoke p-4 text-center font-display transition hover:border-ember hover:shadow-ember-glow">{label}</a>)}</div></section>
  <section className="mx-auto max-w-6xl border-t border-ash/20 px-5 py-12"><div className="mb-7 flex items-end justify-between"><div><h2 className="font-display text-3xl">Recetas destacadas</h2><p className="mt-2 text-ash">Las últimas incorporaciones al recetario.</p></div><a href="/recetario" className="text-sm text-ember">Ver todas →</a></div>{loading?<p className="text-ash">Cargando recetas…</p>:error?<p className="text-ash">{error}</p>:<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{items.slice(0,3).map(i=><Card item={i} key={i.slug}/>)}</div>}</section>
  <section className="mx-auto grid max-w-6xl gap-5 px-5 py-12 sm:grid-cols-2">{[['/catalogo','Salsas y Acompañamientos','Chimichurris, cremas y guarniciones para el maridaje.'],['/bar','Bar y Coctelería','Bebidas con y sin alcohol para acompañar la brasa.']].map(([url,title,desc])=><a key={url} href={url} className="rounded-xl border border-ember/20 bg-smoke p-8 transition hover:border-ember"><h2 className="mb-2 font-display text-2xl">{title}</h2><p className="text-sm text-ash">{desc}</p></a>)}</section></Shell>;
}
function RecipeList(){
  const params=new URLSearchParams(location.search); const [eq,setEq]=useState(params.get('equipo')||''); const [protein,setProtein]=useState('');
  const {items,loading,error}=useLoad(()=>DM().getRecetas(),'recipes');
  const filtered=useMemo(()=>items.filter(i=>(!eq||i.equipo===eq)&&(!protein||i.carne===protein)),[items,eq,protein]);
  const chips=(entries,value,setValue,all)=> <div className="flex flex-wrap gap-2">{[['',all],...entries].map(([v,label])=><button key={v} onClick={()=>setValue(v)} className={`rounded-full border px-4 py-2 text-sm ${value===v?'border-ember bg-ember/20 text-ember':'border-ash/30 text-ash hover:border-ember'}`}>{label}</button>)}</div>;
  return <Shell active="/recetario"><main className="mx-auto max-w-6xl px-5 py-12"><p className="mb-2 text-xs uppercase tracking-widest text-ember">Recetario parrillero</p><h1 className="mb-3 font-display text-4xl sm:text-5xl">Encuentra tu receta ideal</h1><p className="mb-10 max-w-2xl text-ash">Elige primero tu equipo de cocción y luego la proteína.</p><section className="mb-8"><h2 className="mb-4 font-display text-xl">Paso 1 · ¿Con qué equipo vas a cocinar?</h2>{chips(equipment,eq,setEq,'Todos')}</section><section className="mb-10"><h2 className="mb-4 font-display text-xl">Paso 2 · ¿Qué proteína quieres preparar?</h2>{chips(proteins,protein,setProtein,'Todas')}</section><div className="mb-4 flex justify-between"><h2 className="font-display text-2xl">Resultados</h2><span className="text-sm text-ash">{filtered.length} recetas</span></div>{loading?<p className="text-ash">Cargando recetas…</p>:error?<p className="text-ash">{error}</p>:filtered.length?<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{filtered.map(i=><Card key={i.slug} item={i}/>)}</div>:<p className="py-16 text-center text-ash">No hay recetas para esta combinación todavía.</p>}</main></Shell>;
}
function PreparationModal({item,onClose}) {
  if (!item) return null;
  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-charcoal/80 p-0 sm:items-center sm:p-6" onClick={onClose}>
    <section role="dialog" aria-modal="true" aria-labelledby="preparation-title" className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-ash/20 bg-charcoal p-6 sm:rounded-2xl" onClick={event => event.stopPropagation()}>
      <div className="mb-5 flex justify-between">
        <div><p className="text-xs uppercase text-ember">{item.tipo || 'Preparación'}</p><h2 id="preparation-title" className="font-display text-2xl">{item.nombre || item.titulo}</h2></div>
        <button type="button" onClick={event => { event.stopPropagation(); onClose(); }} aria-label="Cerrar" className="text-2xl text-ash">×</button>
      </div>
      <p className="mb-5 text-sm text-ash">{item.descripcion}</p>
      <p className="mb-5 text-xs text-ash">Prep: {item.tiempoPrep || '—'} · Rinde: {item.porciones || '—'}</p>
      <h3 className="mb-2 font-display text-lg text-ember">Ingredientes</h3>
      <ul className="mb-6 list-inside list-disc space-y-1 text-sm">{(item.ingredientes || []).map((ingredient, index) => <li key={index}>{ingredient}</li>)}</ul>
      <h3 className="mb-2 font-display text-lg text-ember">Preparación</h3>
      <ol className="list-inside list-decimal space-y-3 text-sm">{(item.pasos || []).map((step, index) => <li key={index}>{step}</li>)}</ol>
    </section>
  </div>;
}
function Collection({kind}) { const isBar=kind==='bar'; const {items,loading,error}=useLoad(()=>isBar?DM().getBar():DM().getCatalogo(),isBar?'bar':'catalogo'); const [modal,setModal]=useState(null); useEffect(()=>{const handler=e=>setModal(e.detail);window.addEventListener('show-prep',handler);return()=>window.removeEventListener('show-prep',handler)},[]); return <Shell active={isBar?'/bar':'/catalogo'}><main className="mx-auto max-w-6xl px-5 py-12"><p className="mb-2 text-xs uppercase tracking-widest text-ember">{isBar?'Brindis de brasas':'Catálogo'}</p><h1 className="mb-3 font-display text-4xl sm:text-5xl">{isBar?'Bar y Coctelería':'Salsas y Acompañamientos'}</h1><p className="mb-10 max-w-2xl text-ash">{isBar?'Bebidas para acompañar carnes a la brasa.':'Salsas y acompañamientos para el maridaje de cada receta.'}</p>{loading?<p className="text-ash">Cargando…</p>:error?<p className="text-ash">{error}</p>:<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{items.map(i=><Card item={i} type="collection" key={i.slug}/>)}</div>}</main><PreparationModal item={modal} onClose={()=>setModal(null)}/></Shell>; }
function RecipeDetail(){const slug=new URLSearchParams(location.search).get('slug');const [recipe,setRecipe]=useState(()=>readContentCache('recipes')?.find(item=>item.slug===slug)||null);const [catalog,setCatalog]=useState(()=>readContentCache('catalogo')||[]);const [drinks,setDrinks]=useState(()=>readContentCache('bar')||[]);const [loaded,setLoaded]=useState(()=>Boolean(readContentCache('recipes')?.some(item=>item.slug===slug)));const [modal,setModal]=useState(null);const [checks,setChecks]=useState({});useEffect(()=>{const key=`portal_gastronomico_progreso_${slug}`;try{setChecks(JSON.parse(localStorage.getItem(key)||'{}'))}catch{};Promise.all([DM().getRecetas(),DM().getCatalogo(),DM().getBar()]).then(([r,c,b])=>{writeContentCache('recipes',r);writeContentCache('catalogo',c);writeContentCache('bar',b);setRecipe(r.find(item=>item.slug===slug)||null);setCatalog(c);setDrinks(b)}).finally(()=>setLoaded(true))},[slug]);const toggle=(key)=>setChecks(old=>{const next={...old,[key]:!old[key]};localStorage.setItem(`portal_gastronomico_progreso_${slug}`,JSON.stringify(next));return next});if(!loaded)return <Shell><p className="p-10 text-ash">Cargando receta…</p></Shell>;if(!recipe)return <Shell><main className="py-24 text-center"><h1 className="mb-3 font-display text-3xl text-ember">Receta no encontrada</h1><a href="/recetario" className="text-ember">Volver al recetario</a></main></Shell>;const pair=(keys,items)=>items.filter(item=>(keys||[]).includes(item.slug));const related=[...pair(recipe.maridajeSalsas,catalog),...pair(recipe.maridajeEnsaladas,catalog),...pair(recipe.maridajeBebidas,drinks)];return <Shell><main className="mx-auto max-w-5xl px-5 py-10"><img className="mb-8 h-72 w-full rounded-2xl object-cover sm:h-96" src={recipe.imagen} alt={recipe.titulo}/><p className="text-xs uppercase tracking-widest text-ember">{DM().LABELS_CARNE[recipe.carne]} · {DM().LABELS_EQUIPO[recipe.equipo]}</p><h1 className="my-3 font-display text-4xl sm:text-5xl">{recipe.titulo}</h1><p className="mb-8 max-w-3xl text-ash">{recipe.descripcion}</p><div className="mb-9 flex flex-wrap gap-6 text-sm text-ash"><span>Preparación: {recipe.tiempoPrep}</span><span>Cocción: {recipe.tiempoCoccion}</span><span>Porciones: {recipe.porciones}</span></div><div className="mb-10 grid gap-10 sm:grid-cols-2"><section><h2 className="mb-4 font-display text-2xl text-ember">Ingredientes</h2><ul className="space-y-3">{(recipe.ingredientes||[]).map((x,i)=><li key={i}><label className="flex gap-3"><input type="checkbox" checked={!!checks[`i${i}`]} onChange={()=>toggle(`i${i}`)}/><span className={checks[`i${i}`]?'text-ash line-through':''}>{x}</span></label></li>)}</ul></section><section><h2 className="mb-4 font-display text-2xl text-ember">Preparación</h2><ol className="space-y-4">{(recipe.pasos||[]).map((x,i)=><li key={i}><label className="flex gap-3"><input type="checkbox" checked={!!checks[`p${i}`]} onChange={()=>toggle(`p${i}`)}/><span className={checks[`p${i}`]?'text-ash line-through':''}>{x}</span></label></li>)}</ol></section></div>{related.length>0&&<section><h2 className="mb-5 font-display text-2xl">Maridaje recomendado</h2><div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{related.map(item=><Card key={item.slug} item={item} type="collection"/>)}</div></section>}</main><PreparationModal item={modal} onClose={()=>setModal(null)}/><RecipeRelatedEvents onSelect={setModal}/></Shell>}
function RecipeRelatedEvents({onSelect}) { useEffect(()=>{const handler=e=>onSelect(e.detail);window.addEventListener('show-prep',handler);return()=>window.removeEventListener('show-prep',handler)},[onSelect]);return null; }
function App(){const path=location.pathname.replace(/\/$/,'')||'/';if(path==='/admin'||path==='/admin-panel'||path==='/admin-login')return <Admin/>;if(path==='/recetario')return <RecipeList/>;if(path==='/receta')return <RecipeDetail/>;if(path==='/catalogo')return <Collection kind="catalogo"/>;if(path==='/bar')return <Collection kind="bar"/>;return <Home/>;}

createRoot(document.getElementById('root')).render(<React.StrictMode><App/></React.StrictMode>);
