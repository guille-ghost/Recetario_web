import { defineConfig } from 'vite';
import { cpSync } from 'node:fs';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [
    tailwindcss(),
    {
      name: 'copy-legacy-static-assets',
      apply: 'build',
      closeBundle() {
        cpSync('js', 'dist/js', { recursive: true });
        cpSync('css', 'dist/css', { recursive: true });
      },
    },
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        app: 'index.html',
        'recetario-legacy': 'recetario.html',
        'receta-legacy': 'receta.html',
        'catalogo-legacy': 'catalogo.html',
        'bar-legacy': 'bar.html',
      },
    },
  },
});