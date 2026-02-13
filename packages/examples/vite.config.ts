import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@hull/framework': path.resolve(__dirname, '../framework/src'),
    },
  },
});
