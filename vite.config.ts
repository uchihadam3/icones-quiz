/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { characterImages } from './vite/characterImages';
import { slimManifest } from './vite/slimManifest';

// Versão exibida no rodapé (diagnóstico de cache/PWA): commit do CI ou do checkout local.
process.env.VITE_APP_VERSION ??= (process.env.GITHUB_SHA ?? safeGit('git rev-parse HEAD')).slice(0, 7) || 'dev';

function safeGit(cmd: string): string {
  try {
    return execSync(cmd, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
  } catch {
    return '';
  }
}

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
