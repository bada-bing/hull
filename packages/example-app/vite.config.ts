import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  root: './examples/',
  resolve: {
    alias: {
      '@hull/framework': path.resolve(__dirname, '../framework/src'),
    },
  },
});
