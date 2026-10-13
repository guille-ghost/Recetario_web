# Importación de contenido desde archivos

## Flujo

Desde la pestaña **Importación de archivos** del panel se selecciona la categoría y se sube un documento. El servicio Python extrae una o más recetas, salsas/acompañamientos o bebidas con los campos del formulario actual. Cada elemento se guarda como borrador en Supabase; el administrador puede editarlo, descartarlo o publicarlo expresamente.

```text
Panel React → API Node.js/Vercel → FastAPI/Python → Ollama local → Supabase (borradores)
```

No se usa Google Drive ni Google Cloud. La API de Vercel valida la sesión del administrador y reenvía el archivo al servicio Python usando un secreto privado. Ese secreto nunca llega al navegador. El servicio Python manda los borradores a los endpoints protegidos de Node con `N8N_IMPORT_SECRET`, conservado por compatibilidad.

## Formatos y límites

- PDF con texto seleccionable o escaneado, DOCX, TXT, Markdown, CSV y TSV.
- Los PDFs con páginas escaneadas pasan por OCR local en español mediante Tesseract. El contenedor incluye Tesseract y sus datos de idioma español; no se requiere Google Cloud ni un proveedor OCR externo. El OCR puede equivocarse en documentos borrosos, inclinados o manuscritos, por eso el contenido siempre queda como borrador para revisión. ZIP e imágenes sueltas no se aceptan.
- Se procesan hasta 100 páginas por PDF.
- La subida desde Vercel está limitada a unos 2,2 MB por archivo por la codificación de la petición. El servicio Python también tiene `MAX_FILE_BYTES` (15 MB por defecto), pero el límite efectivo del panel es el menor de los dos.
- El texto se limita a 100.000 caracteres (`MAX_TEXT_CHARS`).
- El ejemplo usa Ollama con `qwen3:8b`, que ejecuta el modelo localmente y no cobra por tokens. El modelo ocupa alrededor de 5,2 GB en disco y necesita memoria y capacidad de cómputo suficientes. En producción se deben ejecutar Ollama y FastAPI en un servidor accesible; el servidor puede tener un costo aunque no haya cargos por tokens.
- También se puede escoger OpenAI con `LLM_PROVIDER=openai`, `LLM_MODEL` y `OPENAI_API_KEY`; en ese caso la API cobra por uso y el texto se envía a OpenAI.
- Categorías y campos siguen los formularios existentes: recetas (`equipo`, `carne`, tiempos, porciones, ingredientes, pasos y maridajes); salsas/acompañamientos (`salsa`, `acompanamiento`, `ensalada`); bebidas (`coctel`, `vino`, `cerveza`, `sin-alcohol`).

## Configuración

1. En Supabase, ejecuta `supabase/importaciones-recetas.sql` si aún no existe el flujo de borradores, `supabase/importaciones-recetas-multiples.sql` si tu instalación ya tenía la versión de una receta por archivo y luego `supabase/importaciones-contenido.sql` para habilitar la publicación de bebidas y salsas. Las migraciones de importación no cambian ni reemplazan las tablas actuales de catálogo y bebidas.
2. Despliega la web y las funciones Node en Vercel. Añade en las variables privadas:
   - `AUTOMATION_API_URL`: URL base del servicio Python desplegado.
   - `AUTOMATION_UPLOAD_SECRET`: secreto aleatorio largo que también configurarás como `UPLOAD_SECRET` en Python.
   - Conserva las variables actuales de Supabase y `N8N_IMPORT_SECRET` que usa la API de importación.
3. En `automation/`, copia `.env.example` a `.env` y configura:
   - `PORTAL_API_BASE`: URL del sitio/API Node en Vercel.
   - `PORTAL_IMPORT_SECRET`: mismo valor que `N8N_IMPORT_SECRET` en Vercel.
   - `UPLOAD_SECRET`: mismo valor que `AUTOMATION_UPLOAD_SECRET` en Vercel.
   - La configuración predeterminada usa `LLM_PROVIDER=ollama`, `OLLAMA_BASE_URL` y `LLM_MODEL=qwen3:8b`; no requiere clave OpenAI.
   - Para usar OpenAI en su lugar, configura `LLM_PROVIDER=openai`, `LLM_MODEL` con un modelo compatible y `OPENAI_API_KEY`.
4. Para ejecutar todo localmente con Docker Compose, desde `automation/`:

   ```powershell
   docker compose up --build -d
   docker compose exec ollama ollama pull qwen3:8b
   ```

   El primer comando inicia los contenedores; el segundo descarga el modelo. Después, `/health` debe mostrar `extractor_configured: true` y `llm_provider: ollama`.

   Si ejecutas FastAPI directamente en Windows en vez de Compose, instala Ollama, ejecuta `ollama pull qwen3:8b`, y deja `OLLAMA_BASE_URL=http://localhost:11434` en `.env`.

5. Para instalar las dependencias Python (Python 3.11 o posterior):

   ```powershell
   cd automation
   py -3 -m venv .venv
   .\.venv\Scripts\python.exe -m pip install -r requirements.txt
   if (-not (Test-Path .env)) { Copy-Item .env.example .env }
   .\.venv\Scripts\python.exe -m uvicorn app.main:app --reload
   ```

   En desarrollo, configura `AUTOMATION_API_URL` en Vercel CLI/local para apuntar al servicio Python accesible desde la función Node. En Compose, Ollama queda disponible para FastAPI dentro de la red del mismo Compose. `/health` informa si el proveedor y el portal tienen configuración.

## Despliegue

La carpeta Python comparte repositorio con la web, pero es un servicio/contenedor aparte porque Vercel ejecuta las funciones Node y no mantiene procesos FastAPI ni Ollama. Despliega ambos servicios juntos con Compose o en la misma red privada. Ollama requiere espacio para el modelo y suficiente memoria/cómputo; el uso local evita el cobro por tokens de una API, pero el servidor puede tener costo. Desde `automation/` se puede iniciar con:

```bash
docker compose up --build -d
```

El puerto 8000 debe poder ser alcanzado por la función Node de Vercel. Protege el endpoint con `UPLOAD_SECRET`; configura HTTPS en el proveedor de despliegue. La API Node valida la sesión del usuario antes de reenviar cualquier archivo.

## Revisión y publicación

El panel muestra el tipo, el nombre del documento, los campos detectados y los errores de validación. Editar guarda cambios en el borrador. Publicar valida el contenido y lo inserta en la tabla Supabase correspondiente: `recetas`, `catalogo_items` o `bebidas`. Descartar no publica nada. La inserción y el cambio de estado ocurren juntos mediante la función SQL `publicar_importacion_borrador`.

Cada archivo se identifica por SHA-256 y las entradas por clave del archivo, así que repetir la carga actualiza el borrador correspondiente en lugar de crear una entrada duplicada. La API Node aplica su límite de tamaño antes de llamar al servicio Python. Los errores no publican contenido.
