/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { characterImages } from './vite/characterImages';
import { slimManifest } from './vite/slimManifest';

// GitHub Pages serve o projeto em https://uchihadam3.github.io/icones-quiz/
export const BASE_PATH = '/icones-quiz/';

export default defineConfig({
  base: BASE_PATH,
  plugins: [
    // Antes do plugin JSON do Vite: recebe o texto do manifesto e devolve a versão enxuta.
    { ...slimManifest({ manifestPath: fileURLToPath(new URL('./src/data/assets-manifest.json', import.meta.url)) }), enforce: 'pre' },
    react(),
    characterImages({
      manifestPath: fileURLToPath(new URL('./src/data/assets-manifest.json', import.meta.url)),
      sourceDir: fileURLToPath(new URL('./art/characters', import.meta.url)),
    }),
  ],
  build: {
    target: 'es2022',
    sourcemap: true,
  },
  test: {
    environment: 'jsdom',
    globals: false,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
