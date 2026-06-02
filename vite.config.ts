import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  server: {
    host: true,
    port: 5173,
  },
  build: {
    target: 'es2020',
    sourcemap: true,
    rollupOptions: {
      output: {
        // Keep Phaser in its own chunk so the game logic can be cached separately.
        manualChunks: {
          phaser: ['phaser'],
        },
      },
    },
  },
});
