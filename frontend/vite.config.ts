import { defineConfig } from 'vitest/config';

const base = process.env.VITE_BASE_PATH || '/';

export default defineConfig({
  base,
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 1000,
    cssMinify: true,
  },
  preview: {
    port: 4173,
    host: '0.0.0.0',
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
  },
});