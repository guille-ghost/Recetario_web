import React, { useCallback, useEffect, useState } from 'react';

const DM = () => window.DataManager;
const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=1200&auto=format&fit=crop';

const recipeBlank = () => ({
  slug: '', titulo: '', equipo: '', carne: '', tiempoPrep: '', tiempoCoccion: '',
  porciones: 4, imagen: '', descripcion: '', ingredientes: '', pasos: '',
  maridajeSalsas: [], maridajeEnsaladas: [], maridajeBebidas: [],
});
const itemBlank = () => ({
  slug: '', nombre: '', tipo: '', tiempoPrep: '', porciones: 1, imagen: '',
  descripcion: '', ingredientes: '', pasos: '',
});

const lines = (value) => String(value || '').split('\n').map((x) => x.trim()).filter(Boolean);
const invalidateContentCache = (...keys) =>
  keys.forEach((key) => sessionStorage.removeItem(`portal-content:${key}`));

function friendlyError(e) {
  const msg = e?.message || '';
  if (/row-level security|violates|policy|permission/i.test(msg)) {
    return 'Supabase rechazó el guardado por permisos. Ejecuta fix-policies.sql en Supabase y entra con el correo administrador.';
  }
  return msg || 'Ocurrió un error inesperado.';
}

async function authApi(url, method = 'GET', body) {
  const response = await fetch(url, {
    method,
    credentials: 'include',
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!response.headers.get('content-type')?.includes('application/json')) {
    throw new Error('No responde la API Node.js. Usa el despliegue de Vercel o ejecuta "vercel dev".');
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.details?.join(' · ') || data.error || 'No se pudo completar la solicitud.');
  return data;
}

const inputClass = 'w-full rounded-lg border border-ash/40 bg-smoke px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-ember';
const buttonClass = 'rounded-lg bg-gradient-to-r from-ember to-lava px-5 py-2.5 font-semibold text-gray-100 hover:shadow-ember-glow disabled:opacity-60';

/* ---------- Campos ---------- */
function Field({ label, children }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium">{label}</span>
      {children}
    </label>
  );
}
function TextField({ label, value, onChange, ...props }) {
  return <Field label={label}><input className={inputClass} value={value ?? ''} onChange={(e) => onChange(e.target.value)} {...props} /></Field>;
}
function TextArea({ label, value, onChange, ...props }) {
  return <Field label={label}><textarea className={inputClass} value={value ?? ''} onChange={(e) => onChange(e.target.value)} {...props} /></Field>;
}
function SelectField({ label, value, onChange, options, multiple = false, required = false }) {
  return (
    <Field label={label}>
      <select
        className={`${inputClass} ${multiple ? 'min-h-28' : ''}`}
        value={value || (multiple ? [] : '')}
        multiple={multiple}
        required={required}
        onChange={(e) => onChange(multiple ? Array.from(e.target.selectedOptions, (x) => x.value) : e.target.value)}
      >
        {!multiple && <option value="">Selecciona…</option>}
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
      {multiple && <span className="mt-1 block text-xs text-ash">Usa Ctrl o Cmd para seleccionar varios.</span>}
    </Field>
  );
}

function ImageField({ value, onChange, folder }) {
  const [status, setStatus] = useState('');

  async function upload(file) {
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
      setStatus('Formato no permitido (usa JPG, PNG, WebP o GIF).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) { setStatus('La imagen supera los 5 MB.'); return; }
    const client = window.supabaseClient;
    if (!client) { setStatus('Supabase no está configurado.'); return; }
    setStatus('Subiendo…');
    try {
      const { data: { session } } = await client.auth.getSession();
      if (!session) throw new Error('Tu sesión de Supabase expiró. Cierra sesión y vuelve a entrar.');
      const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
      const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await client.storage.from('imagenes').upload(path, file, { contentType: file.type });
      if (error) throw error;
      const { data } = client.storage.from('imagenes').getPublicUrl(path);
      onChange(data.publicUrl);
      setStatus('Imagen subida correctamente.');
    } catch (e) {
      setStatus(friendlyError(e));
    }
  }

  return (
    <div className="sm:col-span-2">
      <TextField label="Imagen (URL HTTPS o sube un archivo)" type="url" value={value} onChange={onChange} placeholder="https://…" />
      <div className="mt-2 flex items-center gap-3">
        <label className="cursor-pointer rounded-lg border border-ash/40 px-3 py-2 text-sm hover:border-ember hover:text-ember">
          Elegir archivo
          <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="sr-only"
            onChange={(e) => { upload(e.target.files?.[0]); e.target.value = ''; }} />
        </label>
        <span className="text-xs text-ash" aria-live="polite">{status}</span>
      </div>
      {value && <img src={value} alt="Vista previa" className="mt-3 h-28 w-40 rounded-lg border border-ash/20 object-cover" />}
    </div>
  );
}

/* ---------- Login ---------- */
function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      if (!window.supabaseClient) throw new Error('No está disponible la conexión con Supabase.');
      const { data, error: authError } = await window.supabaseClient.auth.signInWithPassword({ email: email.trim(), password });
      if (authError) throw authError;
      const result = await authApi('/api/admin', 'POST', { access_token: data.session?.access_token });
      if (!result.authenticated) throw new Error('La cuenta no está autorizada para administrar el sitio.');
      onLogin();
    } catch (err) {
      setError(err.message || 'No se pudo iniciar sesión.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-16">
      <section className="w-full max-w-md rounded-2xl border border-ember/20 bg-charcoal/95 p-8 shadow-xl">
        <a href="/" className="brand-fire mb-6 inline-block font-display text-xl">El Festín de Belcebú</a>
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-gold">Acceso privado</p>
        <h1 className="mb-3 font-display text-4xl">Panel de contenido</h1>
        <p className="mb-7 text-sm text-ash">Solo el administrador autorizado puede editar recetas, salsas y bebidas.</p>
        <form onSubmit={submit} className="space-y-4">
          <TextField label="Correo" type="email" autoComplete="username" required value={email} onChange={setEmail} />
          <TextField label="Contraseña" type="password" autoComplete="current-password" required value={password} onChange={setPassword} />
          <button className={`${buttonClass} w-full`} disabled={busy}>{busy ? 'Comprobando…' : 'Entrar al panel'}</button>
          {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
        </form>
      </section>
    </main>
  );
}

/* ---------- Lista ---------- */
function EntityList({ items, title, onEdit, onDelete }) {
  return (
    <section className="mt-10">
      <h2 className="mb-4 font-display text-2xl">{title}</h2>
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.slug} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-ash/20 bg-smoke/70 px-4 py-3">
            <div>
              <p className="font-medium">{item.titulo || item.nombre}</p>
              <p className="text-xs text-ash">{item.slug} · {item.es_personalizada === false ? 'De fábrica' : 'Personalizada'}</p>
            </div>
            <div className="flex gap-4 text-sm">
              <button type="button" onClick={() => onEdit(item)} className="text-ember hover:underline">Editar</button>
              <button type="button" onClick={() => onDelete(item)} className="text-red-300 hover:underline">Eliminar</button>
            </div>
          </div>
        ))}
      </div>
      {items.length === 0 && <p className="text-sm text-ash">No hay elementos para mostrar.</p>}
    </section>
  );
}

/* ---------- Editor de recetas ---------- */
function RecipeEditor({ initial, options, onSave, onCancel, busy }) {
  const [form, setForm] = useState({ ...recipeBlank(), ...initial });
  const set = (key, value) => setForm((old) => ({ ...old, [key]: value }));
  useEffect(() => { setForm({ ...recipeBlank(), ...initial }); }, [initial]);

  const editing = Boolean(initial?.slug);
  const slug = form.slug || DM().generarSlug(form.titulo || '');

  function submit(e) {
    e.preventDefault();
    if (!slug) return;
    onSave({
      ...form,
      slug,
      titulo: form.titulo.trim(),
      porciones: Number(form.porciones) || 1,
      imagen: form.imagen?.trim() || DEFAULT_IMAGE,
      ingredientes: lines(form.ingredientes),
      pasos: lines(form.pasos),
      maridajeSalsas: (form.maridajeSalsas || []).filter(Boolean),
      maridajeEnsaladas: (form.maridajeEnsaladas || []).filter(Boolean),
      maridajeBebidas: (form.maridajeBebidas || []).filter(Boolean),
    }, editing);
  }

  const salsas = options.catalog.filter((x) => ['salsa', 'acompanamiento'].includes(x.tipo)).map((x) => [x.slug, x.nombre]);
  const ensaladas = options.catalog.filter((x) => ['ensalada', 'ensaladas'].includes(x.tipo)).map((x) => [x.slug, x.nombre]);
  const bebidas = options.drinks.map((x) => [x.slug, x.nombre]);

  return (
    <form onSubmit={submit} className="space-y-6">
      {editing && <p className="rounded-lg border border-gold bg-gold/10 px-4 py-3 text-sm text-ash">✏️ Editando: <b>{initial.titulo}</b></p>}
      <section className="rounded-xl border border-ash/20 bg-smoke/70 p-5">
        <h2 className="mb-4 font-display text-xl text-ember">Datos de la receta</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Título *" required value={form.titulo} onChange={(v) => set('titulo', v)} />
          <p className="self-end pb-2 font-mono text-xs text-ember">URL: /receta?slug={slug || '…'}{editing ? ' (fijo)' : ''}</p>
          <SelectField label="Equipo *" required value={form.equipo} onChange={(v) => set('equipo', v)} options={Object.entries(DM().LABELS_EQUIPO)} />
          <SelectField label="Proteína *" required value={form.carne} onChange={(v) => set('carne', v)} options={Object.entries(DM().LABELS_CARNE)} />
          <TextField label="Tiempo de preparación *" required value={form.tiempoPrep} onChange={(v) => set('tiempoPrep', v)} />
          <TextField label="Tiempo de cocción *" required value={form.tiempoCoccion} onChange={(v) => set('tiempoCoccion', v)} />
          <TextField label="Porciones *" type="number" min="1" required value={form.porciones} onChange={(v) => set('porciones', v)} />
          <div />
          <ImageField value={form.imagen} onChange={(v) => set('imagen', v)} folder="recetas" />
          <div className="sm:col-span-2"><TextArea label="Descripción *" required rows="3" value={form.descripcion} onChange={(v) => set('descripcion', v)} /></div>
          <div className="sm:col-span-2"><TextArea label="Ingredientes (uno por línea) *" required rows="6" value={form.ingredientes} onChange={(v) => set('ingredientes', v)} /></div>
          <div className="sm:col-span-2"><TextArea label="Pasos (uno por línea) *" required rows="6" value={form.pasos} onChange={(v) => set('pasos', v)} /></div>
        </div>
      </section>

      <section className="rounded-xl border border-ash/20 bg-smoke/70 p-5">
        <h2 className="mb-4 font-display text-xl text-ember">Maridaje</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <SelectField label="Salsas y acompañamientos" multiple value={form.maridajeSalsas} onChange={(v) => set('maridajeSalsas', v)} options={salsas} />
          <SelectField label="Ensaladas" multiple value={form.maridajeEnsaladas} onChange={(v) => set('maridajeEnsaladas', v)} options={ensaladas} />
          <SelectField label="Bebidas" multiple value={form.maridajeBebidas} onChange={(v) => set('maridajeBebidas', v)} options={bebidas} />
        </div>
      </section>

      <div className="flex flex-wrap gap-3">
        <button className={buttonClass} disabled={busy}>{busy ? 'Guardando…' : editing ? 'Actualizar receta' : 'Guardar receta'}</button>
        {editing && <button type="button" onClick={onCancel} className="rounded-lg border border-ash/40 px-4 py-2 text-sm text-ash">Cancelar edición</button>}
        <a href="/recetario" className="self-center text-sm text-ash hover:text-ember">Ver recetario →</a>
      </div>
    </form>
  );
}

/* ---------- Editor de catálogo / bar ---------- */
function ItemEditor({ initial, onSave, onCancel, busy, kind }) {
  const [form, setForm] = useState({ ...itemBlank(), ...initial });
  const set = (key, value) => setForm((old) => ({ ...old, [key]: value }));
  useEffect(() => { setForm({ ...itemBlank(), ...initial }); }, [initial]);

  const editing = Boolean(initial?.slug);
  const slug = form.slug || DM().generarSlug(form.nombre || '');
  const isCatalog = kind === 'catalog';
  const types = isCatalog
    ? [['salsa', 'Salsa'], ['acompanamiento', 'Acompañamiento'], ['ensalada', 'Ensalada']]
    : [['coctel', 'Cóctel'], ['vino', 'Vino'], ['cerveza', 'Cerveza'], ['sin-alcohol', 'Sin alcohol']];

  function submit(e) {
    e.preventDefault();
    if (!slug) return;
    onSave({
      ...form,
      slug,
      nombre: form.nombre.trim(),
      porciones: Number(form.porciones) || 1,
      imagen: form.imagen?.trim() || DEFAULT_IMAGE,
      ingredientes: lines(form.ingredientes),
      pasos: lines(form.pasos),
    }, editing);
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      {editing && <p className="rounded-lg border border-gold bg-gold/10 px-4 py-3 text-sm text-ash">✏️ Editando: <b>{initial.nombre}</b></p>}
      <section className="rounded-xl border border-ash/20 bg-smoke/70 p-5">
        <h2 className="mb-4 font-display text-xl text-ember">{isCatalog ? 'Salsas, acompañamientos y ensaladas' : 'Bebidas'}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Nombre *" required value={form.nombre} onChange={(v) => set('nombre', v)} />
          <p className="self-end pb-2 font-mono text-xs text-ember">Slug: {slug || '…'}{editing ? ' (fijo)' : ''}</p>
          <SelectField label="Tipo *" required value={form.tipo} onChange={(v) => set('tipo', v)} options={types} />
          <TextField label="Tiempo de preparación *" required value={form.tiempoPrep} onChange={(v) => set('tiempoPrep', v)} />
          <TextField label="Porciones *" type="number" min="1" required value={form.porciones} onChange={(v) => set('porciones', v)} />
          <div />
          <ImageField value={form.imagen} onChange={(v) => set('imagen', v)} folder={isCatalog ? 'catalogo' : 'bar'} />
          <div className="sm:col-span-2"><TextArea label="Descripción *" required rows="3" value={form.descripcion} onChange={(v) => set('descripcion', v)} /></div>
          <div className="sm:col-span-2"><TextArea label="Ingredientes (uno por línea)" rows="5" value={form.ingredientes} onChange={(v) => set('ingredientes', v)} /></div>
          <div className="sm:col-span-2"><TextArea label="Preparación (un paso por línea)" rows="6" value={form.pasos} onChange={(v) => set('pasos', v)} /></div>
        </div>
      </section>
      <div className="flex gap-3">
        <button className={buttonClass} disabled={busy}>{busy ? 'Guardando…' : editing ? 'Actualizar' : 'Guardar'}</button>
        {editing && <button type="button" onClick={onCancel} className="rounded-lg border border-ash/40 px-4 py-2 text-sm text-ash">Cancelar edición</button>}
      </div>
    </form>
  );
}

/* ---------- Panel ---------- */
const TABS = [['recetas', 'Recetas'], ['catalogo', 'Salsas y acompañamientos'], ['bar', 'Bebidas']];
const toEditable = (item) => ({ ...item, ingredientes: (item.ingredientes || []).join('\n'), pasos: (item.pasos || []).join('\n') });

function AdminPanel({ onLogout }) {
  const [tab, setTab] = useState('recetas');
  const [recipes, setRecipes] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [drinks, setDrinks] = useState([]);
  const [editing, setEditing] = useState(null); // item en edición (o null = formulario nuevo)
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [code, setCode] = useState(null);

  const notify = (text, error = false) => { setMessage(text); setIsError(error); };

  const refresh = useCallback(async () => {
    try {
      const [r, c, b] = await Promise.all([DM().getRecetas(), DM().getCatalogo(), DM().getBar()]);
      setRecipes(r); setCatalog(c); setDrinks(b);
    } catch (e) {
      notify(friendlyError(e), true);
    }
  }, []);
  useEffect(() => { refresh(); }, [refresh]);

  const kindOf = { recetas: 'recipe', catalogo: 'catalog', bar: 'bar' };
  const cacheOf = { recipe: 'recipes', catalog: 'catalogo', bar: 'bar' };

  async function save(item, isEdit) {
    const kind = kindOf[tab];
    if (!isEdit) {
      const list = kind === 'recipe' ? recipes : kind === 'catalog' ? catalog : drinks;
      if (list.some((x) => x.slug === item.slug) && !confirm('Ya existe un elemento con ese nombre. ¿Reemplazarlo?')) return;
    }
    setBusy(true); setMessage('');
    try {
      if (kind === 'recipe') await DM().guardarReceta(item);
      else if (kind === 'catalog') await DM().guardarCatalogoItem(item);
      else await DM().guardarBarItem(item);
      invalidateContentCache(cacheOf[kind]);
      notify(isEdit ? 'Cambios guardados correctamente.' : 'Guardado correctamente. Ya está visible en el sitio.');
      setEditing(null);
      await refresh();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) {
      notify(friendlyError(e), true);
    } finally {
      setBusy(false);
    }
  }

  async function remove(item) {
    const name = item.titulo || item.nombre;
    if (!confirm(`¿Eliminar “${name}”? Esta acción no se puede deshacer.`)) return;
    const kind = kindOf[tab];
    try {
      if (kind === 'recipe') await DM().eliminarReceta(item.slug);
      else if (kind === 'catalog') await DM().eliminarCatalogoItem(item.slug);
      else await DM().eliminarBarItem(item.slug);
      invalidateContentCache(cacheOf[kind]);
      if (editing?.slug === item.slug) setEditing(null);
      notify(`“${name}” eliminado.`);
      await refresh();
    } catch (e) {
      notify(friendlyError(e), true);
    }
  }

  async function logout() {
    try {
      await authApi('/api/admin', 'POST', { action: 'logout' });
      await window.supabaseClient?.auth.signOut();
    } finally {
      onLogout();
    }
  }

  async function exportBackup() {
    try {
      const d = DM();
      const data = {
        version: 1, fecha: new Date().toISOString(),
        recetas: await d.getRecetasUsuario(), recetasOcultas: await d.getRecetasOcultas(),
        catalogo: await d.getCatalogoUsuario(), catalogoOcultas: await d.getCatalogoOcultas(),
        bar: await d.getBarUsuario(), barOcultas: await d.getBarOcultas(),
      };
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
      a.download = `respaldo-fuego-real-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (e) { notify(friendlyError(e), true); }
  }

  async function importBackup(file) {
    try {
      const data = JSON.parse(await file.text());
      if (!confirm('Importar reemplazará los elementos personalizados en Supabase. ¿Continuar?')) return;
      const d = DM();
      await d.reemplazarRecetas(data.recetas || [], data.recetasOcultas || []);
      await d.reemplazarCatalogo(data.catalogo || [], data.catalogoOcultas || []);
      await d.reemplazarBar(data.bar || [], data.barOcultas || []);
      invalidateContentCache('recipes', 'catalogo', 'bar');
      notify('Respaldo restaurado correctamente.');
      await refresh();
    } catch (e) { notify(friendlyError(e), true); }
  }

  async function showCode() {
    try {
      const d = DM();
      const [r, c, b] = await Promise.all([d.getRecetasUsuario(), d.getCatalogoUsuario(), d.getBarUsuario()]);
      const block = (name, arr) => arr.length ? `/* Pega dentro de ${name} en js/data.js */\n${arr.map((x) => JSON.stringify(x, null, 2)).join(',\n')},` : '';
      setCode([block('RECETAS_BASE', r), block('CATALOGO_SALSAS', c), block('BAR_BEBIDAS', b)].filter(Boolean).join('\n\n') || '// Todavía no hay elementos personalizados.');
    } catch (e) { notify(friendlyError(e), true); }
  }

  const switchTab = (id) => { setTab(id); setEditing(null); setMessage(''); };

  return (
    <>
      <main className="mx-auto max-w-6xl px-5 py-10">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-ember">Panel del cocinero</p>
            <h1 className="font-display text-4xl sm:text-5xl">Panel de contenido</h1>
          </div>
          <div className="flex gap-3">
            <a href="/" className="rounded-lg border border-ash/40 px-4 py-2 text-sm">Ver sitio</a>
            <button onClick={logout} className="rounded-lg border border-ash/40 px-4 py-2 text-sm">Cerrar sesión</button>
          </div>
        </div>

        <section className="mb-7 rounded-xl border border-ash/20 bg-smoke/70 p-5">
          <h2 className="mb-1 font-display text-xl text-ember">Respaldo de contenido</h2>
          <p className="mb-4 text-xs text-ash">Exporta una copia JSON o restaura una guardada.</p>
          <div className="flex flex-wrap gap-3">
            <button onClick={exportBackup} className="rounded-lg border border-ash/40 px-4 py-2 text-sm">Exportar respaldo JSON</button>
            <label className="cursor-pointer rounded-lg border border-ash/40 px-4 py-2 text-sm hover:border-ember">
              Importar respaldo JSON
              <input type="file" accept="application/json" className="hidden"
                onChange={(e) => { if (e.target.files?.[0]) importBackup(e.target.files[0]); e.target.value = ''; }} />
            </label>
            <button onClick={showCode} className="rounded-lg border border-ash/40 px-4 py-2 text-sm hover:border-ember">Generar código para data.js</button>
          </div>
        </section>

        <nav className="mb-6 flex flex-wrap gap-2 border-b border-ash/20">
          {TABS.map(([id, label]) => (
            <button key={id} onClick={() => switchTab(id)}
              className={`border-b-2 px-3 py-3 text-sm font-semibold ${tab === id ? 'border-ember text-ember' : 'border-transparent text-ash hover:text-gold'}`}>
              {label}
            </button>
          ))}
        </nav>

        {message && (
          <p role="status" className={`mb-5 rounded-lg border px-4 py-3 text-sm ${isError ? 'border-red-800 text-red-300' : 'border-green-800 text-green-300'}`}>{message}</p>
        )}

        {tab === 'recetas' && (
          <>
            <RecipeEditor key={editing?.slug || 'new'} initial={editing || recipeBlank()} options={{ catalog, drinks }}
              busy={busy} onCancel={() => setEditing(null)} onSave={save} />
            <EntityList items={recipes} title="Todas las recetas" onEdit={(i) => { setEditing(toEditable(i)); window.scrollTo({ top: 0, behavior: 'smooth' }); }} onDelete={remove} />
          </>
        )}
        {tab === 'catalogo' && (
          <>
            <ItemEditor key={editing?.slug || 'new'} kind="catalog" initial={editing || itemBlank()} busy={busy}
              onCancel={() => setEditing(null)} onSave={save} />
            <EntityList items={catalog} title="Salsas, acompañamientos y ensaladas" onEdit={(i) => { setEditing(toEditable(i)); window.scrollTo({ top: 0, behavior: 'smooth' }); }} onDelete={remove} />
          </>
        )}
        {tab === 'bar' && (
          <>
            <ItemEditor key={editing?.slug || 'new'} kind="bar" initial={editing || itemBlank()} busy={busy}
              onCancel={() => setEditing(null)} onSave={save} />
            <EntityList items={drinks} title="Bebidas" onEdit={(i) => { setEditing(toEditable(i)); window.scrollTo({ top: 0, behavior: 'smooth' }); }} onDelete={remove} />
          </>
        )}
      </main>

      {code !== null && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-charcoal/80 p-0 sm:items-center sm:p-6" onClick={() => setCode(null)}>
          <section className="w-full max-w-3xl rounded-t-2xl border border-ash/20 bg-charcoal p-6 sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-2xl">Código para data.js</h2>
              <button onClick={() => setCode(null)} className="text-2xl text-ash" aria-label="Cerrar">×</button>
            </div>
            <textarea readOnly rows="18" value={code} className={`${inputClass} font-mono text-xs`} />
            <button onClick={() => navigator.clipboard?.writeText(code)} className={`${buttonClass} mt-4`}>Copiar al portapapeles</button>
          </section>
        </div>
      )}
      <footer className="mt-16 border-t border-ash/20 py-8 text-center text-xs text-ash">El Festín de Belcebú · Panel de administración privado</footer>
    </>
  );
}

export default function Admin() {
  const [status, setStatus] = useState('checking');
  useEffect(() => {
    authApi('/api/admin').then(() => setStatus('authenticated')).catch(() => setStatus('login'));
  }, []);
  if (status === 'checking') return <main className="p-10 text-center text-ash">Comprobando sesión administrativa…</main>;
  return status === 'authenticated'
    ? <AdminPanel onLogout={() => setStatus('login')} />
    : <Login onLogin={() => setStatus('authenticated')} />;
}