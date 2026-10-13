-# El Festín de Belcebú · Portal Gastronómico Parrillero

Portal gastronómico con interfaz React y Tailwind CSS (Vite), funciones API en Node.js y Supabase. La automatización de importación actual usa n8n.

## Desarrollo

Requiere Node.js y npm:

```bash
npm install
npm run dev
```

`npm run dev` inicia Vite para la interfaz. Las rutas `/api/*` son funciones de Vercel y no las ejecuta Vite; para usar login y administración local, inicia el proyecto con Vercel CLI (`vercel dev`) y configura las variables del archivo `.env.example`.

Genera la salida de producción de Vercel con:

```bash
npm run build
```

## Interfaz

La portada, las secciones públicas y el panel de administración usan React en `src/` y Tailwind CSS compilado por Vite. Las rutas son `/`, `/recetario`, `/receta?slug=...`, `/catalogo`, `/bar` y `/admin`.

El panel conserva el inicio de sesión Supabase, la administración de recetas, catálogo y bebidas, los respaldos JSON y la revisión/publicación de borradores importados. Reutiliza el `DataManager` y las APIs Node.js existentes. Las páginas `.html` y los scripts anteriores se mantienen por compatibilidad con enlaces existentes.

## Estructura

```text
src/                 Interfaz React y estilos Tailwind
api/                 Funciones serverless Node.js para Vercel
lib/                 Lógica compartida de endpoints de importación
js/data.js           Acceso a Supabase y compatibilidad con páginas antiguas
supabase/            Esquema y migraciones SQL
n8n/                 Workflow actual de importación de recetas
```

Las rutas y contratos de API, y el esquema Supabase, se mantienen. La validación de sesión administrativa ahora se comparte desde `lib/admin-session.js` entre el login, el acceso legado al panel y la revisión de borradores. La migración de n8n a Python queda para una fase posterior.
