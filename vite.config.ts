import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

// GitHub Pages deploys to https://<username>.github.io/cage-legacy/
// so the base path must match the repo name.
export default defineConfig({
  plugins: [react()],
  base: '/cage-legacy/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
