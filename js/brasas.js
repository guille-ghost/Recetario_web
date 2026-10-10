(() => {
  const canvas = document.getElementById("canvas-brasas");
  if (!canvas) return;

  const contexto = canvas.getContext("2d");
  const esFondoCompleto = canvas.dataset.scope === "viewport";
  const contenedor = esFondoCompleto ? null : document.getElementById("hero");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let ancho = 0;
  let alto = 0;
  let particulas = [];
  let cuadro = 0;

  function crearParticula(inicial = false) {
    return {
      x: Math.random() * ancho,
      y: inicial ? Math.random() * alto : alto + Math.random() * 24,
      radio: Math.random() * 2 + 0.6,
      velocidad: Math.random() * 0.8 + 0.35,
      deriva: (Math.random() - 0.5) * 0.65,
      opacidad: Math.random() * 0.65 + 0.25,
      color: Math.random() > 0.55 ? "#FF6A00" : "#FFB000"
    };
  }

  function ajustarCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (esFondoCompleto) {
      ancho = window.innerWidth;
      alto = window.innerHeight;
    } else {
      const rect = contenedor.getBoundingClientRect();
      ancho = rect.width;
      alto = rect.height;
    }

    canvas.width = Math.round(ancho * dpr);
    canvas.height = Math.round(alto * dpr);
    contexto.setTransform(dpr, 0, 0, dpr, 0, 0);
    particulas = Array.from(
      { length: Math.min(esFondoCompleto ? 90 : 75, Math.floor(ancho / 16)) },
      () => crearParticula(true)
    );
  }

  function animar() {
    contexto.clearRect(0, 0, ancho, alto);
    particulas.forEach((particula) => {
      particula.y -= particula.velocidad;
      particula.x += particula.deriva + Math.sin((particula.y + cuadro) * 0.012) * 0.25;
      if (particula.y < -8) Object.assign(particula, crearParticula());

      contexto.globalAlpha = particula.opacidad * Math.min(1, (alto - particula.y) / 60);
      contexto.fillStyle = particula.color;
      contexto.shadowBlur = 12;
      contexto.shadowColor = particula.color;
      contexto.beginPath();
      contexto.arc(particula.x, particula.y, particula.radio, 0, Math.PI * 2);
      contexto.fill();
    });

    contexto.globalAlpha = 1;
    contexto.shadowBlur = 0;
    cuadro++;
    if (!reduceMotion) requestAnimationFrame(animar);
  }

  ajustarCanvas();
  animar();
  window.addEventListener("resize", ajustarCanvas, { passive: true });
  if (!esFondoCompleto && "ResizeObserver" in window) {
    new ResizeObserver(ajustarCanvas).observe(contenedor);
  }
})();
