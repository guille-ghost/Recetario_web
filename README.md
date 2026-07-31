# Fuego Real · Portal Gastronómico Parrillero

Portal gastronómico 100% estático (HTML5 + Tailwind CSS vía CDN + JavaScript Vanilla ES6+), sin frameworks ni backend. Todo el contenido editable se guarda en `localStorage` del navegador a través de un panel de administración visual.

## Estructura

```
portal-gastronomico-html/
├── index.html            # Home
├── recetario.html        # Paso 1 (equipo) y Paso 2 (carne): filtro del recetario
├── receta.html           # Paso 3: ficha completa + checklist + maridaje automático
├── catalogo.html         # Salsas y acompañamientos
├── bar.html               # Coctelería y bebidas
├── admin.html             # Panel: alta de Recetas / Salsas / Bebidas
├── js/
│   ├── data.js             # Datos base + DataManager (localStorage)
│   ├── recetario.js        # Lógica del filtro en 2 pasos
│   ├── receta-detalle.js   # Ficha de receta, checklist y maridaje
│   └── admin.js             # Lógica de los 3 formularios del panel
└── css/
    └── custom.css           # Chips, pestañas, line-clamp, etc.
```

## Funcionalidades

- **Recetario en 2 pasos**: filtra por Equipo (Caja China, Cilindro, Parrilla, Horno de Barro, Cocina Convencional) y por Carne (Res, Cerdo, Pollo, Cordero).
- **Ficha de receta** con checklist interactivo de ingredientes/pasos (progreso guardado por receta en `localStorage`) y maridaje automático (salsas + bebidas) en modal.
- **Panel admin** (`admin.html`) con 3 pestañas para redactar Recetas, Salsas/Acompañamientos y Bebidas sin tocar código; todo se combina en tiempo real con los datos base de `js/data.js`.
- **Catálogo y Bar** con modal "Ver preparación" (ingredientes + pasos) para cada ítem.

## Cómo usarlo

Al ser un sitio 100% estático, no requiere servidor ni build. Basta con abrir `index.html` en el navegador, o servirlo con cualquier servidor estático simple, por ejemplo:

```bash
npx serve .
# o
python3 -m http.server 8080
```

## Notas

- Todo el contenido agregado desde `admin.html` vive en el `localStorage` del navegador donde se creó — no se sincroniza entre dispositivos ni navegadores.
- Las imágenes se referencian por URL (no hay subida de archivos).
