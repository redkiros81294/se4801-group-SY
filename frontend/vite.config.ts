import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  base: '/ChainTrack/',
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 1000,
  },
  preview: {
    port: 4173,
    host: '0.0.0.0',
  },
});