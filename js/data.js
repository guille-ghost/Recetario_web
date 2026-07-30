/* ============================================================
   js/data.js
   Fuente única de datos del Portal Gastronómico.
   - Recetas base (por defecto, escritas en el código).
   - Catálogo de salsas / acompañamientos.
   - Módulo de Bar (bebidas).
   - Funciones de lectura/escritura en localStorage para que
     admin.html pueda agregar recetas nuevas sin tocar código.
   ============================================================ */

/* ----------------------------------------------------------
   1. CATÁLOGO DE SALSAS Y ACOMPAÑAMIENTOS (catalogo.html)
   ---------------------------------------------------------- */
const CATALOGO_SALSAS = [
  {
    slug: "chimichurri-clasico",
    nombre: "Chimichurri Clásico",
    tipo: "salsa",
    imagen: "https://images.unsplash.com/photo-1620201107744-2c9e5c8d5f8f?q=80&w=800&auto=format&fit=crop",
    descripcion: "El acompañante insustituible del asado: perejil fresco, ajo, orégano, ají molido, vinagre y un buen chorro de aceite de oliva. Se prepara con horas de anticipación para que los sabores se integren.",
    porciones: 6,
    tiempoPrep: "15 min + 2 h de reposo",
    ingredientes: [
      "1 taza de perejil fresco picado fino",
      "4 dientes de ajo picados",
      "1 cucharada de orégano seco",
      "1 cucharadita de ají molido",
      "1/2 taza de aceite de oliva",
      "1/4 taza de vinagre de vino tinto",
      "Sal y pimienta al gusto"
    ],
    pasos: [
      "Pica finamente el perejil y el ajo, y colócalos en un bowl.",
      "Agrega el orégano seco y el ají molido, mezclando bien.",
      "Incorpora el vinagre y deja reposar 5 minutos para que el ajo suavice su intensidad.",
      "Añade el aceite de oliva en forma de hilo mientras mezclas.",
      "Sazona con sal y pimienta al gusto.",
      "Deja reposar la mezcla al menos 2 horas a temperatura ambiente antes de servir para que los sabores se integren."
    ]
  },
  {
    slug: "salsa-criolla",
    nombre: "Salsa Criolla",
    tipo: "salsa",
    imagen: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?q=80&w=800&auto=format&fit=crop",
    descripcion: "Cebolla roja cortada en pluma fina, macerada en limón y ají amarillo picado, con un toque de culantro. Fresca, ácida y crocante, perfecta para cortar la grasa de las carnes rojas.",
    porciones: 4,
    tiempoPrep: "15 min",
    ingredientes: [
      "2 cebollas rojas cortadas en pluma fina",
      "Jugo de 3 limones",
      "1 ají amarillo picado sin venas ni pepas",
      "2 cucharadas de culantro picado",
      "Sal al gusto"
    ],
    pasos: [
      "Corta la cebolla en pluma bien fina y colócala en un bowl con agua fría por 5 minutos para suavizar su sabor.",
      "Escurre bien la cebolla y sécala con papel toalla.",
      "Mezcla la cebolla con el ají amarillo picado y el culantro.",
      "Agrega el jugo de limón y sal al gusto.",
      "Deja macerar 10 minutos antes de servir para que la cebolla absorba el limón."
    ]
  },
  {
    slug: "mojo-picon",
    nombre: "Mojo Picón",
    tipo: "salsa",
    imagen: "https://images.unsplash.com/photo-1604908177003-e5c3f9b6c0e0?q=80&w=800&auto=format&fit=crop",
    descripcion: "Salsa de origen canario a base de ajíes secos, comino, pimentón y aceite, ideal para carnes de cerdo y cordero asados a fuego lento.",
    porciones: 6,
    tiempoPrep: "20 min",
    ingredientes: [
      "3 ajíes secos (ñora o similar), remojados",
      "4 dientes de ajo",
      "1 cucharadita de comino molido",
      "1 cucharada de pimentón dulce",
      "1/2 taza de aceite de oliva",
      "2 cucharadas de vinagre",
      "Sal al gusto"
    ],
    pasos: [
      "Remoja los ajíes secos en agua caliente durante 15 minutos y retira las semillas.",
      "Licúa los ajíes con el ajo, comino, pimentón y vinagre hasta formar una pasta.",
      "Con la licuadora en marcha, incorpora el aceite de oliva en forma de hilo hasta emulsionar.",
      "Sazona con sal al gusto.",
      "Deja reposar 10 minutos antes de servir para que los sabores se asienten."
    ]
  },
  {
    slug: "papas-doradas",
    nombre: "Papas Doradas al Romero",
    tipo: "acompanamiento",
    imagen: "https://images.unsplash.com/photo-1518013431117-eb1465fa5752?q=80&w=800&auto=format&fit=crop",
    descripcion: "Papas nativas cocidas y luego doradas en la misma grasa del asado, perfumadas con romero fresco y sal de parrilla.",
    porciones: 4,
    tiempoPrep: "15 min + 30 min de cocción",
    ingredientes: [
      "1 kg de papas nativas pequeñas",
      "3 cucharadas de grasa del asado o aceite",
      "2 ramas de romero fresco",
      "3 dientes de ajo aplastados",
      "Sal de parrilla al gusto"
    ],
    pasos: [
      "Cocina las papas con piel en agua con sal hasta que estén tiernas al pinchar, unos 15 minutos.",
      "Escurre bien y déjalas templar; aplástalas ligeramente con el dorso de un tenedor.",
      "Calienta la grasa o aceite en una sartén junto con el ajo y el romero.",
      "Dora las papas por todos los lados hasta que estén crocantes y doradas, unos 10-15 minutos.",
      "Retira el romero y el ajo, y sirve espolvoreadas con sal de parrilla."
    ]
  },
  {
    slug: "ensalada-tomate-cebolla",
    nombre: "Ensalada de Tomate y Cebolla",
    tipo: "acompanamiento",
    imagen: "https://images.unsplash.com/photo-1540420773420-3366772f4999?q=80&w=800&auto=format&fit=crop",
    descripcion: "Clásico refrescante de tomate maduro, cebolla en pluma, aceite de oliva y orégano seco. El contrapunto ideal para una parrillada abundante.",
    porciones: 4,
    tiempoPrep: "10 min",
    ingredientes: [
      "4 tomates maduros en rodajas",
      "1 cebolla roja en pluma fina",
      "3 cucharadas de aceite de oliva",
      "1 cucharadita de orégano seco",
      "Sal y pimienta al gusto"
    ],
    pasos: [
      "Corta los tomates en rodajas y la cebolla en pluma fina.",
      "Acomoda los tomates y la cebolla alternados en una fuente.",
      "Rocía con el aceite de oliva y espolvorea el orégano seco.",
      "Sazona con sal y pimienta al gusto justo antes de servir."
    ]
  },
  {
    slug: "choclo-a-la-brasa",
    nombre: "Choclo a la Brasa con Mantequilla de Hierbas",
    tipo: "acompanamiento",
    imagen: "https://images.unsplash.com/photo-1601315379734-1c0d3e6d5e6f?q=80&w=800&auto=format&fit=crop",
    descripcion: "Choclo asado directamente sobre las brasas y pincelado con mantequilla derretida, ajo y hierbas frescas.",
    porciones: 4,
    tiempoPrep: "10 min + 15 min de cocción",
    ingredientes: [
      "4 choclos con su capuchón (chala) parcialmente retirado",
      "4 cucharadas de mantequilla",
      "2 dientes de ajo picados",
      "1 cucharada de perejil o culantro picado",
      "Sal al gusto"
    ],
    pasos: [
      "Derrite la mantequilla y mézclala con el ajo picado y las hierbas frescas.",
      "Coloca los choclos directamente sobre las brasas, girándolos cada 3-4 minutos.",
      "Asa durante 12-15 minutos hasta que los granos estén tiernos y ligeramente tostados.",
      "Retira del fuego y pincela con la mantequilla de hierbas mientras aún están calientes.",
      "Sazona con sal al gusto y sirve de inmediato."
    ]
  }
];

/* ----------------------------------------------------------
   2. MÓDULO DE BAR (bar.html)
   ---------------------------------------------------------- */
const BAR_BEBIDAS = [
  {
    slug: "pisco-sour",
    nombre: "Pisco Sour",
    tipo: "coctel",
    imagen: "https://images.unsplash.com/photo-1560508601-ea36bd0f1ce9?q=80&w=800&auto=format&fit=crop",
    descripcion: "El coctel bandera: pisco, jugo de limón, jarabe de goma, clara de huevo y unas gotas de amargo de angostura, batido hasta lograr una espuma firme.",
    porciones: 1,
    tiempoPrep: "5 min",
    ingredientes: [
      "3 oz de pisco puro",
      "1 oz de jugo de limón fresco",
      "1 oz de jarabe de goma",
      "1 clara de huevo",
      "6 cubos de hielo",
      "3 gotas de amargo de angostura"
    ],
    pasos: [
      "Vierte el pisco, el jugo de limón, el jarabe de goma y la clara de huevo en la coctelera.",
      "Agrega el hielo y cierra bien la coctelera.",
      "Agita con fuerza durante 15 segundos para que la clara emulsione y genere espuma.",
      "Cuela la mezcla directamente en una copa fría, sin dejar pasar el hielo.",
      "Decora la espuma con 3 gotas de amargo de angostura formando un dibujo.",
      "Sirve de inmediato, bien frío."
    ]
  },
  {
    slug: "chicha-morada",
    nombre: "Chicha Morada",
    tipo: "sin-alcohol",
    imagen: "https://images.unsplash.com/photo-1544145945-f90425340c7e?q=80&w=800&auto=format&fit=crop",
    descripcion: "Bebida refrescante a base de maíz morado hervido con piña, canela y clavo de olor. Dulce, frutal y sin alcohol, ideal para toda la familia.",
    porciones: 6,
    tiempoPrep: "50 min",
    ingredientes: [
      "1 kg de maíz morado (choclo morado seco)",
      "3 litros de agua",
      "1 piña, cáscara y trozos",
      "2 ramas de canela",
      "5 clavos de olor",
      "1 membrillo o manzana (opcional)",
      "Jugo de 2 limones",
      "Azúcar al gusto"
    ],
    pasos: [
      "Lava el maíz morado y colócalo en una olla grande con el agua.",
      "Agrega la cáscara de piña, la canela y los clavos de olor.",
      "Hierve a fuego medio durante 40 minutos hasta que el agua tome un color morado intenso.",
      "Cuela el líquido y descarta los sólidos, dejando enfriar la chicha.",
      "Incorpora el jugo de limón y azúcar al gusto, mezclando bien.",
      "Refrigera al menos 2 horas y sirve bien fría con trozos de piña y manzana picada."
    ]
  },
  {
    slug: "cerveza-artesanal-negra",
    nombre: "Cerveza Artesanal Negra",
    tipo: "cerveza",
    imagen: "https://images.unsplash.com/photo-1571613316887-6f8d5cbf7ef7?q=80&w=800&auto=format&fit=crop",
    descripcion: "Notas tostadas y amargor moderado que acompañan muy bien las carnes ahumadas de larga cocción.",
    porciones: 1,
    tiempoPrep: "2 min",
    ingredientes: [
      "1 botella de cerveza artesanal negra (330-500 ml)",
      "Copa o vaso tipo snifter/pinta",
      "Hielo (opcional, solo para enfriar la copa)"
    ],
    pasos: [
      "Enfría la copa en el congelador 5 minutos o pásale hielo y descártalo antes de servir.",
      "Inclina la copa a 45° y sirve la cerveza por el costado para controlar la espuma.",
      "Endereza la copa hacia el final del servido, dejando una espuma de 1-2 cm.",
      "Sirve entre 8°C y 12°C para resaltar las notas tostadas sin enmascarar el sabor.",
      "Disfruta acompañada de carnes ahumadas o a la parrilla."
    ]
  },
  {
    slug: "vino-tinto-malbec",
    nombre: "Vino Tinto Malbec",
    tipo: "vino",
    imagen: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?q=80&w=800&auto=format&fit=crop",
    descripcion: "Cuerpo intenso y taninos suaves que realzan el sabor de las carnes rojas asadas a la parrilla o al cilindro.",
    porciones: 1,
    tiempoPrep: "10 min",
    ingredientes: [
      "1 botella de vino tinto Malbec",
      "Copa de vino tinto de cáliz amplio",
      "Decantador (opcional)"
    ],
    pasos: [
      "Descorcha la botella y, si el vino es joven, déjalo respirar 10 minutos antes de servir.",
      "Si el vino tiene varios años, decántalo con cuidado para separarlo de posibles sedimentos.",
      "Sirve a una temperatura de 16°C a 18°C, llenando la copa hasta un tercio de su capacidad.",
      "Agita suavemente la copa para liberar los aromas antes de beber.",
      "Acompaña con carnes rojas asadas a la parrilla o al cilindro para resaltar los taninos."
    ]
  },
  {
    slug: "limonada-hierbabuena",
    nombre: "Limonada con Hierbabuena",
    tipo: "sin-alcohol",
    imagen: "https://images.unsplash.com/photo-1497534446932-c925b458314e?q=80&w=800&auto=format&fit=crop",
    descripcion: "Limonada clásica con un toque herbal de hierbabuena fresca, perfecta para acompañar carnes de cerdo y pollo a la brasa.",
    porciones: 4,
    tiempoPrep: "10 min",
    ingredientes: [
      "6 limones (jugo)",
      "1 litro de agua fría",
      "1/2 taza de azúcar (al gusto)",
      "1 puñado de hojas de hierbabuena fresca",
      "Hielo al gusto"
    ],
    pasos: [
      "Exprime los limones y reserva el jugo, retirando las semillas.",
      "Machaca suavemente la mitad de las hojas de hierbabuena en el fondo de la jarra para liberar su aroma.",
      "Agrega el jugo de limón, el agua fría y el azúcar, mezclando hasta disolver.",
      "Prueba y ajusta el dulzor según tu preferencia.",
      "Añade hielo y el resto de las hojas de hierbabuena frescas.",
      "Sirve de inmediato bien fría."
    ]
  }
];

/* ----------------------------------------------------------
   3. RECETAS BASE (por defecto, siempre disponibles)
   Estructura de cada receta:
   {
     slug, titulo, equipo, carne, tiempoPrep, tiempoCoccion,
     porciones, imagen, descripcion,
     ingredientes: [string], pasos: [string],
     maridajeSalsas: [slug...], maridajeBebidas: [slug...],
     fecha
   }
   ---------------------------------------------------------- */
const RECETAS_BASE = [
  {
    slug: "costillar-de-res-caja-china",
    titulo: "Costillar de Res en Caja China",
    equipo: "caja-china",
    carne: "res",
    tiempoPrep: "30 min",
    tiempoCoccion: "3 h",
    porciones: 8,
    imagen: "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=1200&auto=format&fit=crop",
    descripcion: "Un costillar entero cocido lentamente en caja china hasta lograr una carne jugosa que se desprende del hueso, con una corteza dorada y crocante.",
    ingredientes: [
      "1 costillar de res entero (aprox. 5 kg)",
      "3 cucharadas de sal gruesa",
      "2 cucharadas de pimienta negra molida",
      "2 cucharadas de ajo en polvo",
      "1 cucharada de comino",
      "2 cucharadas de aceite vegetal",
      "Carbón vegetal en cantidad suficiente"
    ],
    pasos: [
      "Seca bien el costillar con papel toalla y retira el exceso de grasa dejando una capa fina.",
      "Frota el aceite sobre toda la superficie y aplica la mezcla de sal, pimienta, ajo y comino, presionando para que se adhiera.",
      "Deja reposar la carne sazonada durante al menos 1 hora a temperatura ambiente.",
      "Enciende el carbón y colócalo en la parte superior de la caja china según las instrucciones del equipo.",
      "Ubica el costillar con el hueso hacia abajo dentro de la caja y cierra la tapa.",
      "Cocina por 2 horas y 30 minutos sin abrir la tapa para mantener la temperatura estable.",
      "Verifica el punto de cocción; la carne debe estar tierna y separarse fácilmente del hueso.",
      "Retira, deja reposar 15 minutos cubierto con papel aluminio antes de cortar."
    ],
    maridajeSalsas: ["chimichurri-clasico", "salsa-criolla", "papas-doradas"],
    maridajeBebidas: ["vino-tinto-malbec", "cerveza-artesanal-negra"],
    fecha: "2026-01-10"
  },
  {
    slug: "lechon-al-cilindro",
    titulo: "Lechón Entero al Cilindro",
    equipo: "cilindro",
    carne: "cerdo",
    tiempoPrep: "45 min",
    tiempoCoccion: "4 h",
    porciones: 12,
    imagen: "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=1200&auto=format&fit=crop",
    descripcion: "Lechón entero girando lentamente en el cilindro, con piel crocante y carne jugosa gracias a la cocción indirecta por calor radiante.",
    ingredientes: [
      "1 lechón entero (8 a 10 kg)",
      "1/2 taza de sal gruesa",
      "1/4 taza de pimienta negra",
      "6 dientes de ajo molidos",
      "1/2 taza de vinagre blanco",
      "3 hojas de laurel",
      "Carbón vegetal en cantidad suficiente"
    ],
    pasos: [
      "Lava y seca el lechón por dentro y por fuera con papel toalla.",
      "Prepara un adobo con ajo, vinagre, laurel y pimienta, y frota la cavidad interna.",
      "Sazona la piel exterior únicamente con sal gruesa para lograr un crocante parejo.",
      "Ensarta el lechón en la varilla del cilindro asegurando que quede bien centrado.",
      "Enciende el carbón alrededor de la base del cilindro de forma uniforme.",
      "Cocina girando el lechón cada 20-30 minutos durante aproximadamente 4 horas.",
      "En la última media hora, aumenta ligeramente el calor para dorar y crocantizar la piel.",
      "Retira, deja reposar 20 minutos antes de trozar y servir."
    ],
    maridajeSalsas: ["mojo-picon", "salsa-criolla", "choclo-a-la-brasa"],
    maridajeBebidas: ["chicha-morada", "cerveza-artesanal-negra"],
    fecha: "2026-01-12"
  },
  {
    slug: "pollo-mariposa-parrilla",
    titulo: "Pollo Mariposa a la Parrilla",
    equipo: "parrilla",
    carne: "pollo",
    tiempoPrep: "20 min",
    tiempoCoccion: "45 min",
    porciones: 4,
    imagen: "https://images.unsplash.com/photo-1598103442097-8b74394b95c6?q=80&w=1200&auto=format&fit=crop",
    descripcion: "Pollo entero abierto en mariposa para una cocción pareja y rápida sobre la parrilla, con piel dorada y carne jugosa.",
    ingredientes: [
      "1 pollo entero (1.8 kg aprox.)",
      "3 cucharadas de aceite de oliva",
      "2 cucharadas de paprika",
      "1 cucharada de orégano seco",
      "3 dientes de ajo picados",
      "Jugo de 1 limón",
      "Sal y pimienta al gusto"
    ],
    pasos: [
      "Coloca el pollo con la pechuga hacia abajo y corta la columna vertebral con tijeras de cocina.",
      "Abre el pollo como un libro y presiona el esternón para aplanarlo (técnica mariposa).",
      "Mezcla aceite, paprika, orégano, ajo, limón, sal y pimienta para el adobo.",
      "Frota el adobo por ambos lados del pollo y deja marinar 30 minutos.",
      "Precalienta la parrilla a fuego medio y coloca el pollo con la piel hacia arriba primero.",
      "Cocina 20 minutos, voltea y cocina 20 minutos más hasta que el termómetro marque 74°C en la pechuga.",
      "Deja reposar 10 minutos antes de trinchar."
    ],
    maridajeSalsas: ["chimichurri-clasico", "ensalada-tomate-cebolla"],
    maridajeBebidas: ["limonada-hierbabuena", "pisco-sour"],
    fecha: "2026-01-15"
  },
  {
    slug: "pierna-cordero-horno-barro",
    titulo: "Pierna de Cordero en Horno de Barro",
    equipo: "horno-barro",
    carne: "cordero",
    tiempoPrep: "25 min",
    tiempoCoccion: "2 h 30 min",
    porciones: 6,
    imagen: "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=1200&auto=format&fit=crop",
    descripcion: "Pierna de cordero cocida lentamente en horno de barro, envuelta en hojas de plátano junto a hierbas aromáticas, hasta quedar tierna y perfumada.",
    ingredientes: [
      "1 pierna de cordero (2.5 kg aprox.)",
      "4 dientes de ajo laminados",
      "2 ramas de romero fresco",
      "1 taza de chicha de jora o vino tinto",
      "2 cucharadas de ají panca",
      "Hojas de plátano para envolver",
      "Sal y comino al gusto"
    ],
    pasos: [
      "Realiza pequeños cortes en la pierna e inserta las láminas de ajo.",
      "Mezcla el ají panca, la chicha o vino, sal y comino para formar el adobo.",
      "Cubre la pierna con el adobo y coloca el romero fresco encima; deja marinar 2 horas.",
      "Envuelve la pierna en hojas de plátano previamente pasadas por calor para flexibilizarlas.",
      "Introduce en el horno de barro precalentado y cocina a fuego medio-bajo durante 2 horas y 30 minutos.",
      "Retira las hojas con cuidado, verifica que la carne esté tierna al pinchar con un tenedor.",
      "Deja reposar 10 minutos antes de servir en porciones."
    ],
    maridajeSalsas: ["mojo-picon", "papas-doradas"],
    maridajeBebidas: ["vino-tinto-malbec", "chicha-morada"],
    fecha: "2026-01-18"
  },
  {
    slug: "bistec-cocina-convencional",
    titulo: "Bistec Encebollado en Cocina Convencional",
    equipo: "cocina-convencional",
    carne: "res",
    tiempoPrep: "15 min",
    tiempoCoccion: "25 min",
    porciones: 4,
    imagen: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?q=80&w=1200&auto=format&fit=crop",
    descripcion: "Una receta práctica para el día a día: bistec de res sellado en sartén y bañado en una salsa de cebolla dorada, lista en menos de media hora.",
    ingredientes: [
      "4 bistecs de res (150 g c/u)",
      "2 cebollas rojas en pluma",
      "3 cucharadas de aceite vegetal",
      "1 cucharada de salsa de soya",
      "2 dientes de ajo picados",
      "Sal y pimienta al gusto",
      "Perejil picado para decorar"
    ],
    pasos: [
      "Sazona los bistecs con sal y pimienta por ambos lados.",
      "Calienta el aceite en una sartén a fuego alto y sella los bistecs 2 minutos por lado; retira y reserva.",
      "En la misma sartén, agrega el ajo y la cebolla, y cocina hasta que la cebolla esté dorada y transparente.",
      "Incorpora la salsa de soya y un poco de agua para formar una salsa ligera.",
      "Regresa los bistecs a la sartén y cocina 3 minutos más para que absorban el sabor.",
      "Sirve caliente decorado con perejil picado."
    ],
    maridajeSalsas: ["ensalada-tomate-cebolla", "papas-doradas"],
    maridajeBebidas: ["cerveza-artesanal-negra", "limonada-hierbabuena"],
    fecha: "2026-01-20"
  }
];

/* ----------------------------------------------------------
   4. GESTOR DE LOCALSTORAGE
   Las recetas creadas desde admin.html se guardan bajo esta
   clave y se combinan en tiempo real con RECETAS_BASE.
   ---------------------------------------------------------- */
const LS_KEY_RECETAS = "portal_gastronomico_recetas_usuario";
const LS_KEY_CATALOGO = "portal_gastronomico_catalogo_usuario";
const LS_KEY_BAR = "portal_gastronomico_bar_usuario";

const DataManager = {
  /** Devuelve solo las recetas guardadas por el usuario en localStorage */
  getRecetasUsuario() {
    try {
      const raw = localStorage.getItem(LS_KEY_RECETAS);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error("Error leyendo recetas de localStorage:", e);
      return [];
    }
  },

  /** Devuelve TODAS las recetas: las base + las del usuario, sin duplicar slugs */
  getRecetas() {
    const usuario = this.getRecetasUsuario();
    const slugsUsuario = new Set(usuario.map((r) => r.slug));
    const base = RECETAS_BASE.filter((r) => !slugsUsuario.has(r.slug));
    // Las recetas de usuario se muestran primero (más recientes)
    return [...usuario, ...base];
  },

  /** Busca una receta por su slug en el conjunto combinado */
  getRecetaBySlug(slug) {
    return this.getRecetas().find((r) => r.slug === slug) || null;
  },

  /** Guarda una receta nueva (o actualiza si el slug ya existe) en localStorage */
  guardarReceta(receta) {
    const usuario = this.getRecetasUsuario();
    const idx = usuario.findIndex((r) => r.slug === receta.slug);
    if (idx >= 0) {
      usuario[idx] = receta;
    } else {
      usuario.unshift(receta);
    }
    localStorage.setItem(LS_KEY_RECETAS, JSON.stringify(usuario));
    return receta;
  },

  /** Elimina una receta de usuario por slug */
  eliminarReceta(slug) {
    const usuario = this.getRecetasUsuario().filter((r) => r.slug !== slug);
    localStorage.setItem(LS_KEY_RECETAS, JSON.stringify(usuario));
  },

  /** Genera un slug URL-friendly a partir de un título */
  generarSlug(texto) {
    return texto
      .toString()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // quita tildes
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  },

  /* ---------- CATÁLOGO: Salsas y Acompañamientos ---------- */

  /** Devuelve solo los ítems de catálogo guardados por el usuario */
  getCatalogoUsuario() {
    try {
      const raw = localStorage.getItem(LS_KEY_CATALOGO);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error("Error leyendo catálogo de localStorage:", e);
      return [];
    }
  },

  /** Devuelve TODO el catálogo: base + usuario, sin duplicar slugs */
  getCatalogo() {
    const usuario = this.getCatalogoUsuario();
    const slugsUsuario = new Set(usuario.map((c) => c.slug));
    const base = CATALOGO_SALSAS.filter((c) => !slugsUsuario.has(c.slug));
    return [...usuario, ...base];
  },

  getCatalogoBySlug(slug) {
    return this.getCatalogo().find((c) => c.slug === slug) || null;
  },

  /** Guarda (o actualiza) una salsa/acompañamiento en localStorage */
  guardarCatalogoItem(item) {
    const usuario = this.getCatalogoUsuario();
    const idx = usuario.findIndex((c) => c.slug === item.slug);
    if (idx >= 0) {
      usuario[idx] = item;
    } else {
      usuario.unshift(item);
    }
    localStorage.setItem(LS_KEY_CATALOGO, JSON.stringify(usuario));
    return item;
  },

  eliminarCatalogoItem(slug) {
    const usuario = this.getCatalogoUsuario().filter((c) => c.slug !== slug);
    localStorage.setItem(LS_KEY_CATALOGO, JSON.stringify(usuario));
  },

  /* ---------- BAR: Bebidas ---------- */

  /** Devuelve solo las bebidas guardadas por el usuario */
  getBarUsuario() {
    try {
      const raw = localStorage.getItem(LS_KEY_BAR);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error("Error leyendo bar de localStorage:", e);
      return [];
    }
  },

  /** Devuelve TODAS las bebidas: base + usuario, sin duplicar slugs */
  getBar() {
    const usuario = this.getBarUsuario();
    const slugsUsuario = new Set(usuario.map((b) => b.slug));
    const base = BAR_BEBIDAS.filter((b) => !slugsUsuario.has(b.slug));
    return [...usuario, ...base];
  },

  getBarBySlug(slug) {
    return this.getBar().find((b) => b.slug === slug) || null;
  },

  /** Guarda (o actualiza) una bebida en localStorage */
  guardarBarItem(item) {
    const usuario = this.getBarUsuario();
    const idx = usuario.findIndex((b) => b.slug === item.slug);
    if (idx >= 0) {
      usuario[idx] = item;
    } else {
      usuario.unshift(item);
    }
    localStorage.setItem(LS_KEY_BAR, JSON.stringify(usuario));
    return item;
  },

  eliminarBarItem(slug) {
    const usuario = this.getBarUsuario().filter((b) => b.slug !== slug);
    localStorage.setItem(LS_KEY_BAR, JSON.stringify(usuario));
  },

  /** Etiquetas legibles para equipo y carne, usadas en toda la web */
  LABELS_EQUIPO: {
    "caja-china": "Caja China",
    "cilindro": "Cilindro",
    "parrilla": "Parrilla",
    "horno-barro": "Horno de Barro",
    "cocina-convencional": "Cocina Convencional"
  },

  LABELS_CARNE: {
    res: "Res",
    cerdo: "Cerdo",
    pollo: "Pollo",
    cordero: "Cordero"
  },

  LABELS_TIPO_CATALOGO: {
    salsa: "Salsa",
    acompanamiento: "Acompañamiento"
  },

  LABELS_TIPO_BAR: {
    coctel: "Coctel",
    vino: "Vino",
    cerveza: "Cerveza",
    "sin-alcohol": "Sin alcohol"
  }
};
