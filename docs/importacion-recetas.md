# Importación automática de recetas

## Auditoría

El workspace es un sitio HTML, Tailwind CSS por CDN y JavaScript vanilla en Vercel. Las funciones Node.js están en `api/`. Supabase contiene `recetas`, `catalogo_items` y `bebidas`; el panel usa Supabase Auth y una cookie de sesión firmada. La tabla pública de recetas alimenta la web. Las imágenes se guardan en Supabase Storage.

El formulario que se reutiliza está en `private/admin-panel.html`, con lógica en `js/admin.js`. Campos: `titulo`, `equipo`, `carne`, `tiempoPrep`, `tiempoCoccion`, `porciones`, `imagen`, `descripcion`, `ingredientes[]`, `pasos[]`, `maridajeSalsas[]`, `maridajeEnsaladas[]` y `maridajeBebidas[]`.

## Flujo implementado

Google Drive privado → n8n → extracción/OCR/IA configurable → registrar metadata → enviar borrador → revisión en los controles originales del formulario → guardar correcciones → acción administrativa separada de publicación → tabla `recetas`.

La clave de idempotencia es `(drive_file_id, content_hash)`. El mismo archivo sin cambios actualiza su registro; una versión modificada queda separada. La validación de backend restringe enums, tipos, longitudes, número de pasos/ingredientes y URL HTTPS de imagen. Una receta nunca se hace pública por la recepción del workflow.

## Endpoints REST

Se admiten varias recetas por archivo de Drive. Cada POST de borrador puede incluir `recipeKey` (estable dentro del archivo, por ejemplo `1`, `2`, ...); la clave única de borrador es `(importacion_archivo_id, receta_key)`. Si ya ejecutaste la migración original, ejecuta también `supabase/importaciones-recetas-multiples.sql` antes de desplegar este cambio.

Todos están implementados por `api/importaciones/*` y usan `lib/importaciones.js`.

| Ruta | Método | Acceso | Función |
|---|---|---|---|
| `/api/importaciones/registrar` | POST | Bearer `N8N_IMPORT_SECRET` | Registra ID, hash, nombre y MIME del archivo |
| `/api/importaciones/borradores` | POST | Bearer `N8N_IMPORT_SECRET` | Valida y persiste los datos estructurados asociados al archivo registrado |
| `/api/importaciones/borradores` | GET | Cookie de administrador | Lista borradores pendientes con metadata de origen |
| `/api/importaciones/borradores/{id}` | PUT | Cookie de administrador | Guarda correcciones o descarta el borrador |
| `/api/importaciones/borradores/{id}/publicar` | POST | Cookie de administrador | Valida de nuevo, previene slug duplicado y publica |

La clave service role se usa solo desde funciones server-side. La tabla de recetas conserva sus políticas existentes; los endpoints de publicación son el camino de escritura privilegiado para este caso.

## Puesta en marcha

1. Ejecuta `supabase/importaciones-recetas.sql` en Supabase SQL Editor. Para una instalación existente, ejecuta además `supabase/importaciones-recetas-multiples.sql`.
2. En Vercel define `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_SESSION_SECRET` (ya requerido por el login) y `N8N_IMPORT_SECRET`. Usa valores secretos fuertes y no los incluyas en el repositorio.
3. Despliega Vercel y verifica que `GET /api/importaciones/borradores` sin sesión devuelva 401.
4. Importa `n8n/drive-recetas-import.json`. El JSON contiene recepción de payload con header auth, validación básica y llamadas a los dos endpoints POST. Está inactivo al importarlo. Crea en n8n una credencial Header Auth llamada “Fuego webhook secret” con nombre de encabezado `X-Workflow-Secret` y un valor aleatorio privado; asígnala al nodo Webhook importado.
5. Configura en n8n `PORTAL_API_BASE=https://recetario-web-one.vercel.app` y `PORTAL_IMPORT_SECRET` igual al valor de Vercel. En n8n configura también credenciales OAuth Google y, opcionalmente, el proveedor OCR/IA en Credentials. El secreto de entrada del webhook es separado del secreto backend.

## Google Drive personal

El workflow exportado es una base de recepción de recetas ya extraídas; todavía no incorpora el nodo Google Drive porque no conocemos la versión o modalidad de la instancia n8n. Añade el nodo **Google Drive Trigger** o **Google Drive** y crea la credencial correspondiente.

Si usas **n8n Cloud**, elige **Sign in with Google** (OAuth administrado) cuando aparezca en la credencial. Autoriza tu cuenta personal; en este caso no necesitas crear un proyecto de Google Cloud. Si n8n te ofrece solo **Custom OAuth2**, o si usas n8n autohospedado, sí tendrás que configurar Google Cloud: crear/seleccionar un proyecto, habilitar Drive API, configurar OAuth consent como External para Gmail personal, añadir tu cuenta como test user durante pruebas y pegar el callback que n8n muestra en la credencial. Usa permisos de solo lectura; no configures escritura o borrado.

En Drive abre tu carpeta privada y copia el ID del segmento `/folders/{id}`. En n8n configura Drive Trigger para nuevo archivo y limita el evento a ese folder; si esa versión no lo ofrece, usa polling periódico y compara ID/modifiedTime. Descarga el archivo en binario dentro de n8n, conserva el original y calcula SHA-256. Para TXT/CSV y formatos de oficina utiliza los extractores disponibles en esa versión; añade OCR para PDF escaneados e imágenes. ZIP debe extraerse con límites de tamaño, cantidad y profundidad.

Normaliza el resultado IA como JSON con las propiedades del formulario. Mantén la IA en Credentials y no le entregues secretos ni instrucciones de control del workflow. Usa el webhook importado para transmitir metadata y JSON. La recepción registra cada archivo antes de guardar su receta.

## Revisión y publicación

Entra en `/admin`, abre “Importación automática” y pulsa “Editar con formulario de receta”. Se rellenan los campos existentes. Al enviar el formulario, las correcciones se guardan solo en `recetas_borradores`; el listener impide que el guardado normal del catálogo publique esa receta accidentalmente. Después usa “Publicar receta”. El backend repite las validaciones y rechaza conflictos de slug.

## Recuperación y límites

- El workflow no está conectado a una instancia n8n, Google Drive ni proveedor OCR/IA del usuario. Esas credenciales/configuración son pendientes externas, y no se declara completada la detección automática real.
- La imagen se acepta como URL HTTPS; la copia automática de una imagen de Drive a Supabase Storage no está implementada. Puede completarse en el formulario con la carga existente.
- Cada llamada n8n crea/actualiza una entrada idempotente. Si el extractor falla, configura su rama de error en n8n y reintenta el mismo archivo; los originales no se borran.
- Estados en `recetas_borradores`: `pendiente`, `aprobado`, `descartado`, `publicado`; `importacion_archivos` usa `pendiente`, `procesado`, `error`, `descartado`. El flujo actual utiliza `pendiente`, `descartado` y `publicado`; no implementa una etapa intermedia `aprobado` separada.
- No hay runtime Node.js disponible en este entorno, por lo que no se ejecutaron pruebas de integración ni comprobaciones sintácticas JS. La verificación local se limita a revisión de cambios y validación estructural del JSON exportado.
