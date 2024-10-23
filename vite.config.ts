import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'extension',
    rollupOptions: {
      input: {
        popup: 'popup.html',
        content: 'content.js'
      },
      output: {
        entryFileNames: '[name].js'
      }
    }
  }
});