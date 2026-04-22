import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/jsonapi': {
        target: process.env.VITE_DRUPAL_URL ?? 'http://taqatransmission-one.local',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        entryFileNames: 'media-hub.js',
        chunkFileNames: 'media-hub-[name].js',
        assetFileNames: (info) =>
          info.name?.endsWith('.css') ? 'media-hub.css' : '[name][extname]',
      },
    },
  },
});
