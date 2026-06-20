import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite';

const base = process.env.VITE_BASE_PATH || '/se4801-group-SY/';

export default defineConfig({
  plugins: [react()],
  base,
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